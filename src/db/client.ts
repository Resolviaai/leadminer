import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config/env';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

export const db = drizzle(getDbPool(), { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const p = getDbPool();
    const res = await p.query('SELECT 1');
    return res.rowCount === 1;
  } catch (error) {
    return false;
  }
}
