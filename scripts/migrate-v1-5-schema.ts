import { runMigrations } from '../src/db/migrate';
import { checkDatabaseConnection } from '../src/db/client';

async function main() {
  console.log('--- LeadMiner v1.5 Database Migration Runner ---');
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.warn('⚠️ Database connection could not be established. Check DATABASE_URL in environment.');
    process.exit(1);
  }

  console.log('Database connected successfully. Running migrations...');
  await runMigrations();
  console.log('✅ Migrations completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
