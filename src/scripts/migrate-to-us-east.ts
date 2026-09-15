import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const TOKYO_URL = 'postgresql://postgres.nrcdsjcsjrwuopaqmohj:Tr06jJKGZpNJYDyO@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const US_EAST_URL = 'postgresql://postgres.ayznnspiruidutjohkhd:pUtBjfvSeKwnuyHT@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const sourcePool = new Pool({
  connectionString: TOKYO_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

const targetPool = new Pool({
  connectionString: US_EAST_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function runSql(pool: Pool, sqlContent: string, desc: string) {
  console.log(`Executing ${desc}...`);
  const client = await pool.connect();
  try {
    await client.query(sqlContent);
    console.log(`✅ ${desc} completed.`);
  } finally {
    client.release();
  }
}

async function runTargetMigrations() {
  console.log('\n--- Step 1: Running migrations on US-East ---');
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  // 0000
  const m0 = fs.readFileSync(path.join(migrationsDir, '0000_init_schema.sql'), 'utf8').replace(/^\uFEFF/, '');
  await runSql(targetPool, m0, '0000_init_schema.sql');

  // 0001
  const m1 = fs.readFileSync(path.join(migrationsDir, '0001_hardening_schema.sql'), 'utf8').replace(/^\uFEFF/, '');
  await runSql(targetPool, m1, '0001_hardening_schema.sql');

  // 0002
  const m2 = fs.readFileSync(path.join(migrationsDir, '0002_add_lead_country.sql'), 'utf8').replace(/^\uFEFF/, '');
  await runSql(targetPool, m2, '0002_add_lead_country.sql');
}

async function copyTable(tableName: string, batchSize = 500) {
  console.log(`\n📦 Copying table "${tableName}"...`);
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    const countRes = await sourceClient.query(`SELECT count(*)::int as cnt FROM ${tableName}`);
    const total = countRes.rows[0].cnt;
    console.log(`   Source has ${total} rows.`);

    if (total === 0) {
      console.log(`   Skipping empty table "${tableName}".`);
      return;
    }

    const colsRes = await sourceClient.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [tableName]
    );
    const cols = colsRes.rows.map(r => r.column_name);
    const colList = cols.map(c => `"${c}"`).join(', ');

    let processed = 0;
    while (processed < total) {
      const rowsRes = await sourceClient.query(
        `SELECT * FROM ${tableName} ORDER BY 1 LIMIT $1 OFFSET $2`,
        [batchSize, processed]
      );
      const rows = rowsRes.rows;
      if (rows.length === 0) break;

      // Group rows into single multi-row insert for high throughput
      const valueParams: any[] = [];
      const rowPlaceholders: string[] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const placeholders: string[] = [];
        for (let c = 0; c < cols.length; c++) {
          let val = row[cols[c]];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            val = JSON.stringify(val);
          }
          valueParams.push(val);
          placeholders.push(`$${valueParams.length}`);
        }
        rowPlaceholders.push(`(${placeholders.join(', ')})`);
      }

      await targetClient.query(
        `INSERT INTO ${tableName} (${colList}) VALUES ${rowPlaceholders.join(', ')} ON CONFLICT DO NOTHING`,
        valueParams
      );

      processed += rows.length;
      if (processed % 2000 === 0 || processed === total) {
        console.log(`   Transferred ${processed} / ${total} rows...`);
      }
    }

    try {
      await targetClient.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), coalesce(max(id), 1)) FROM ${tableName}`);
    } catch {
      // ignore sequence reset errors for tables without serial id
    }

    const targetCount = await targetClient.query(`SELECT count(*)::int as cnt FROM ${tableName}`);
    console.log(`   ✅ "${tableName}" copy complete: US-East has ${targetCount.rows[0].cnt} rows.`);
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

async function main() {
  console.log('🚀 Starting Supabase US-East Database Migration & Transfer...');
  const start = Date.now();

  try {
    await runTargetMigrations();

    const tables = [
      'system_settings',
      'templates',
      'campaigns',
      'gmail_accounts',
      'keywords',
      'leads',
      'contacts',
      'lead_keyword_sources',
      'messages',
      'jobs',
      'logs'
    ];

    for (const table of tables) {
      await copyTable(table, table === 'keywords' ? 500 : 250);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n🎉 Migration & Data Transfer Finished Successfully in ${elapsed}s!`);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

main();
