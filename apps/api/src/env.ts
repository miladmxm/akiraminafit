import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE ?? new URL('../../../.env', import.meta.url) });
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  BETTER_AUTH_SECRET: z.string().min(32).default('development-secret-change-me-1234567890'),
  BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
  S3_ENDPOINT: z.url().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('fitflow-media'),
  S3_PUBLIC_URL: z.url().default('http://localhost:9000/fitflow-media'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  ADMIN_NAME: z.string().nonempty().min(3),
  ADMIN_EMAIL: z.email().nonempty(),
  ADMIN_PASSWORD: z.string().nonempty().min(8)
});

export const env = envSchema.parse(process.env);
