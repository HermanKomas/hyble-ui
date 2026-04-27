import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import type { JWTPayload } from '../middleware/auth.js';
import { loginSchema } from '@hyble/shared';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = await signToken({ sub: user.id, email: user.email });

    reply
      .setCookie('hbl_session', token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      .send({ user: { id: user.id, email: user.email } });
  });

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('hbl_session', { path: '/' }).send({ ok: true });
  });

  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = (request as typeof request & { user: JWTPayload }).user;
    const [dbUser] = await db
      .select({ id: schema.users.id, email: schema.users.email, created_at: schema.users.created_at })
      .from(schema.users)
      .where(eq(schema.users.id, user.sub))
      .limit(1);
    if (!dbUser) return reply.status(404).send({ error: 'User not found' });
    return reply.send({ user: dbUser });
  });
}
