import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: process.env.ENV_FILE ?? new URL('../../.env', import.meta.url) });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://akiraminafit:akiraminafit@localhost:5432/akiraminafit',
  },
  strict: true,
  verbose: true,
});
