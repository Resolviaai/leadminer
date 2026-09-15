import fs from 'fs';
import path from 'path';
import { getDbPool } from './client';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const migrationPath = path.join(process.cwd(), 'migrations', '0000_init_schema.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Database migrations executed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
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
