import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

dotenv.config({ path: process.env.ENV_FILE ?? new URL('../../../.env', import.meta.url) });

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://fitflow:fitflow@localhost:5432/fitflow';

export const pool = new Pool({ connectionString, max: 10 });
export const db = drizzle(pool, { schema });
export type Database = typeof db;
