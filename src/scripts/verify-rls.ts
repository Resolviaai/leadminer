import { Pool } from 'pg';
import { env } from '../config/env';

async function verify() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const res = await pool.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  console.log('--- Row Level Security (RLS) Status on US-East ---');
  for (const row of res.rows) {
    console.log(`Table: ${row.tablename.padEnd(25)} RLS: ${row.rowsecurity ? '🔒 ENABLED' : '❌ DISABLED'}`);
  }

  await pool.end();
}

verify().catch(console.error);
