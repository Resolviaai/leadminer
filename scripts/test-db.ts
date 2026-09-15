import { checkDatabaseConnection, db } from '../src/db/client';
import { keywords } from '../src/db/schema';

async function main() {
  console.log('Testing connection to Supabase...');
  const connected = await checkDatabaseConnection();
  console.log('Connection test result:', connected);
  
  if (connected) {
    const list = await db.select().from(keywords).limit(5);
    console.log('Successfully queried keywords table! Row count:', list.length);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
