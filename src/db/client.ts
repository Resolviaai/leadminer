import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config/env';

declare global {
  var _dbPool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!globalThis._dbPool) {
    globalThis._dbPool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: process.env.NODE_ENV === 'production' ? 3 : 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    globalThis._dbPool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return globalThis._dbPool;
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
