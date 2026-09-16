import fs from 'fs';
import path from 'path';
import { getDbPool } from './client';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    // 1. Ensure migrations ledger table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__app_migrations" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const appliedResult = await client.query<{ name: string }>('SELECT name FROM "__app_migrations"');
    const appliedSet = new Set(appliedResult.rows.map((r) => r.name));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ [Skipped] Migration ${file} already applied.`);
        continue;
      }

      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

      if (sql.includes('ADD VALUE')) {
        await client.query(sql);
        await client.query('INSERT INTO "__app_migrations" (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
      } else {
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO "__app_migrations" (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
          await client.query('COMMIT');
        } catch (mErr: any) {
          await client.query('ROLLBACK');
          if (mErr.message?.includes('already exists')) {
            console.warn(`⚠️ Migration ${file} objects already exist in DB. Marking as applied.`);
            await client.query('INSERT INTO "__app_migrations" (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
          } else {
            throw mErr;
          }
        }
      }
      console.log(`✅ ${file} applied successfully.`);
    }
    console.log('✅ All database migrations executed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct execution
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
