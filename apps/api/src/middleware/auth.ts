import type { FastifyRequest, FastifyReply } from 'fastify';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface JWTPayload {
  sub: string; // user id
  email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const token = request.cookies['hbl_session'];
    if (!token) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const payload = await verifyToken(token);
    (request as FastifyRequest & { user: JWTPayload }).user = payload;
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}
