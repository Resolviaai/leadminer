import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { normalizeKeyword } from '../../src/scripts/seed-keywords';

describe('LeadMiner Workbook Parsing', () => {
  it('should successfully read LeadMiner.xlsx without modifying it', () => {
    const filePath = path.join(process.cwd(), 'LeadMiner.xlsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    expect(workbook.SheetNames).toContain('Keywords');
    expect(workbook.SheetNames).toContain('Sheet10');
    expect(workbook.SheetNames).toContain('modifiers');
  });

  it('should parse normalized unique keywords from Keywords sheet', () => {
    const filePath = path.join(process.cwd(), 'LeadMiner.xlsx');
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Keywords'];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    expect(rows.length).toBeGreaterThan(20000);

    const firstRow = rows[1];
    expect(firstRow[0]).toBe('Top Podcasters');
    expect(firstRow[1]).toBe('Joe Rogan');
    expect(firstRow[2]).toBe('clips');
    expect(normalizeKeyword(firstRow[3])).toBe('joe rogan clips');
  });
});
