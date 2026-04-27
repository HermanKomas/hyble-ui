import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { uploadBuffer } from '../services/storage.js';
import { downloadToBuffer } from '../services/storage.js';
import { env } from '../env.js';

export async function imageRoutes(app: FastifyInstance) {
  // Proxy image from S3 — keeps a stable URL regardless of signed URL expiry
  app.get<{ Params: { '*': string } }>(
    '/*',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const key = decodeURIComponent(request.params['*']);
      try {
        const buffer = await downloadToBuffer(key);
        const ext = key.split('.').pop() ?? 'png';
        const ct = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
        return reply
          .header('Cache-Control', 'private, max-age=3600')
          .type(ct)
          .send(buffer);
      } catch {
        return reply.status(404).send({ error: 'Image not found' });
      }
    },
  );

  // Upload a reference image from the client
  app.post(
    '/upload',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const data = await request.file();
      if (!data) return reply.status(400).send({ error: 'No file uploaded' });

      const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of data.file) {
        size += chunk.length;
        if (size > maxBytes) {
          return reply.status(413).send({ error: `Max upload size is ${env.MAX_UPLOAD_MB}MB` });
        }
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const ct = data.mimetype ?? 'image/png';
      const key = await uploadBuffer(buffer, ct, 'uploads');

      return reply.send({ key, url: `/api/images/${encodeURIComponent(key)}` });
    },
  );
}
