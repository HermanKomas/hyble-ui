import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from repo root
config({ path: resolve(process.cwd(), '../../.env') });
// Fallback for Railway (env vars already set)
config({ path: resolve(process.cwd(), '.env') });

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
} satisfies Config;
