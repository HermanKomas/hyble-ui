import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { orderRoutes } from './routes/orders.js';
import { generateRoutes } from './routes/generate.js';
import { imageRoutes } from './routes/images.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'development' && {
      transport: { target: 'pino-pretty', options: { colorize: true } },
    }),
  },
});

// Plugins
await app.register(fastifyCors, {
  origin: env.NODE_ENV === 'development'
    ? (origin, cb) => cb(null, true) // allow all localhost origins in dev
    : env.PUBLIC_URL,
  credentials: true,
});

await app.register(fastifyCookie);

await app.register(fastifyMultipart, {
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

// API routes
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(orderRoutes, { prefix: '/api/orders' });
await app.register(generateRoutes, { prefix: '/api/generate' });
await app.register(imageRoutes, { prefix: '/api/images' });

// Health check
app.get('/api/health', async () => ({ ok: true, version: '0.1.0' }));

// Serve built web app in production
const webDistPath = resolve(__dirname, '../../web/dist');
if (existsSync(webDistPath)) {
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/',
  });

  // SPA fallback
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile('index.html');
  });
}

// Start
try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`Server running at ${env.PUBLIC_URL}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
