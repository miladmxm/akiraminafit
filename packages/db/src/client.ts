import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { env } from './env.js';

const connectionString = env.DATABASE_URL
export const pool = new Pool({ connectionString, max: 10 });
export const db = drizzle(pool, { schema });
export type Database = typeof db;
