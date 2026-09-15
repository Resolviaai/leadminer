import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { db, getDbPool } from '../db/client';
import { keywords } from '../db/schema';
import { sql } from 'drizzle-orm';

interface RawKeywordRow {
  category: string;
  entity: string;
  modifier: string;
  keyword: string;
  normalizedKeyword: string;
}

export function normalizeKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export async function seedKeywords(): Promise<{ totalRead: number; uniqueCount: number; insertedCount: number }> {
  console.log('🚀 Starting keyword taxonomy ingestion from LeadMiner.xlsx...');

  const workbookPath = path.join(process.cwd(), 'LeadMiner.xlsx');
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found at ${workbookPath}`);
  }

  // Load workbook in read-only memory buffer
  const fileBuffer = fs.readFileSync(workbookPath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellFormula: false, cellHTML: false });

  let keywordMap = new Map<string, RawKeywordRow>();

  // Strategy A: Try reading 'Keywords' sheet directly
  if (workbook.SheetNames.includes('Keywords')) {
    console.log('📖 Reading from "Keywords" sheet...');
    const sheet = workbook.Sheets['Keywords'];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 4) continue;

      const category = String(row[0] || '').trim();
      const entity = String(row[1] || '').trim();
      const modifier = String(row[2] || '').trim();
      const rawKeyword = String(row[3] || '').trim();

      if (!category || !entity || !rawKeyword) continue;

      const normalized = normalizeKeyword(rawKeyword);
      if (!keywordMap.has(normalized)) {
        keywordMap.set(normalized, {
          category,
          entity,
          modifier: modifier || 'general',
          keyword: rawKeyword,
          normalizedKeyword: normalized,
        });
      }
    }
  }

  // Strategy B Fallback: If Keywords sheet had no rows, reconstruct from Sheet10 + modifiers
  if (keywordMap.size === 0 && workbook.SheetNames.includes('Sheet10')) {
    console.log('🔄 Reconstructing taxonomy from "Sheet10" (entities) and "modifiers"...');
    const sheet10 = workbook.Sheets['Sheet10'];
    const sheet10Rows = XLSX.utils.sheet_to_json<any>(sheet10, { header: 1 });

    const modifiersSheet = workbook.Sheets['modifiers'];
    const modifierRows = modifiersSheet ? XLSX.utils.sheet_to_json<any>(modifiersSheet, { header: 1 }) : [];

    const categoryModifiers = new Map<string, string[]>();
    for (let i = 1; i < modifierRows.length; i++) {
      const row = modifierRows[i];
      if (!row || row.length < 2) continue;
      const cat = String(row[0] || '').trim();
      const mod = String(row[1] || '').trim();
      if (!cat || !mod) continue;
      if (!categoryModifiers.has(cat)) categoryModifiers.set(cat, []);
      categoryModifiers.get(cat)!.push(mod);
    }

    for (let i = 1; i < sheet10Rows.length; i++) {
      const row = sheet10Rows[i];
      if (!row || row.length < 2) continue;
      const cat = String(row[0] || '').trim();
      const ent = String(row[1] || '').trim();
      if (!cat || !ent || cat === 'Category') continue;

      const mods = categoryModifiers.get(cat) || ['clips', 'highlights', 'podcast'];
      for (const mod of mods) {
        const kw = `${ent} ${mod}`;
        const normalized = normalizeKeyword(kw);
        if (!keywordMap.has(normalized)) {
          keywordMap.set(normalized, {
            category: cat,
            entity: ent,
            modifier: mod,
            keyword: kw,
            normalizedKeyword: normalized,
          });
        }
      }
    }
  }

  const uniqueKeywords = Array.from(keywordMap.values());
  console.log(`📊 Extracted ${uniqueKeywords.length} unique normalized keywords from taxonomy.`);

  if (uniqueKeywords.length === 0) {
    console.warn('⚠️ No keywords found to import.');
    return { totalRead: 0, uniqueCount: 0, insertedCount: 0 };
  }

  // Batch insert into PostgreSQL
  const pool = getDbPool();
  const client = await pool.connect();
  let insertedCount = 0;

  try {
    const BATCH_SIZE = 500;
    console.log(`💾 Inserting keywords in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < uniqueKeywords.length; i += BATCH_SIZE) {
      const batch = uniqueKeywords.slice(i, i + BATCH_SIZE);

      // Build parameterized bulk insert query with ON CONFLICT DO NOTHING
      const values: any[] = [];
      const valueStrings: string[] = [];

      batch.forEach((k, idx) => {
        const offset = idx * 5;
        valueStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 'PENDING')`);
        values.push(k.keyword, k.normalizedKeyword, k.category, k.entity, k.modifier);
      });

      const queryText = `
        INSERT INTO keywords (keyword, normalized_keyword, category, entity, modifier, status)
        VALUES ${valueStrings.join(', ')}
        ON CONFLICT (normalized_keyword) DO NOTHING
      `;

      const result = await client.query(queryText, values);
      insertedCount += result.rowCount ?? 0;

      if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= uniqueKeywords.length) {
        console.log(`  Processed ${Math.min(i + BATCH_SIZE, uniqueKeywords.length)} / ${uniqueKeywords.length} keywords...`);
      }
    }

    console.log(`✅ Keyword migration completed! Inserted ${insertedCount} new keywords (${uniqueKeywords.length - insertedCount} already existed).`);
  } finally {
    client.release();
  }

  return {
    totalRead: uniqueKeywords.length,
    uniqueCount: uniqueKeywords.length,
    insertedCount,
  };
}

if (require.main === module) {
  seedKeywords()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Keyword seed failed:', err);
      process.exit(1);
    });
}
