import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE ?? new URL('../../../.env', import.meta.url) });
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
