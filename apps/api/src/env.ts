import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env from repo root when running in development
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '../../.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // In production, env vars come from Railway directly
  }
}

loadEnv();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),
  PUBLIC_URL: optional('PUBLIC_URL', 'http://localhost:3000'),

  JWT_SECRET: required('JWT_SECRET'),

  DATABASE_URL: required('DATABASE_URL'),

  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),
  ANTHROPIC_MODEL: optional('ANTHROPIC_MODEL', 'claude-opus-4-6'),

  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  OPENAI_IMAGE_MODEL: optional('OPENAI_IMAGE_MODEL', 'gpt-image-2-2026-04-21'),

  S3_ENDPOINT: required('S3_ENDPOINT'),
  S3_BUCKET: required('S3_BUCKET'),
  S3_ACCESS_KEY_ID: required('S3_ACCESS_KEY_ID'),
  S3_SECRET_ACCESS_KEY: required('S3_SECRET_ACCESS_KEY'),
  S3_REGION: optional('S3_REGION', 'auto'),

  MAX_UPLOAD_MB: parseInt(optional('MAX_UPLOAD_MB', '10'), 10),
  DAILY_GENERATION_CAP_PER_USER: parseInt(optional('DAILY_GENERATION_CAP_PER_USER', '50'), 10),
  ORDER_GENERATION_CAP: parseInt(optional('ORDER_GENERATION_CAP', '20'), 10),
  LOG_LEVEL: optional('LOG_LEVEL', 'info'),
} as const;
