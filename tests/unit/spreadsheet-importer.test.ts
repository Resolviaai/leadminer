import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  spreadsheetImporterService,
  sanitizeCellValue,
  normalizeDomain,
  isValidEmail,
  FREEMAIL_DOMAINS,
} from '../../src/services/import/spreadsheet-importer.service';

describe('Spreadsheet Ingestion Engine Unit Tests', () => {
  describe('1. Formula Injection Sanitization (CWE-1236)', () => {
    it('should prefix dangerous formula characters with single quote', () => {
      expect(sanitizeCellValue('=cmd|"/C calc"!A0')).toBe('\'=cmd|"/C calc"!A0');
      expect(sanitizeCellValue('+123456789')).toBe('\'+123456789');
      expect(sanitizeCellValue('-5+5')).toBe('\'-5+5');
      expect(sanitizeCellValue('@SUM(A1:A10)')).toBe('\'@SUM(A1:A10)');
      expect(sanitizeCellValue('\tDangerousTab')).toBe('\'\tDangerousTab');
    });

    it('should leave safe values unchanged', () => {
      expect(sanitizeCellValue('John Doe')).toBe('John Doe');
      expect(sanitizeCellValue('john@example.com')).toBe('john@example.com');
      expect(sanitizeCellValue(12345)).toBe(12345);
      expect(sanitizeCellValue(true)).toBe(true);
      expect(sanitizeCellValue(null)).toBe(null);
    });
  });

  describe('2. Domain Normalization & Freemail Protection', () => {
    it('should extract root hostname from various website URL formats', () => {
      expect(normalizeDomain('https://www.acme-corp.com/about?ref=123')).toBe('acme-corp.com');
      expect(normalizeDomain('http://subdomain.company.io:8080/')).toBe('subdomain.company.io');
      expect(normalizeDomain('WWW.EXAMPLE.ORG')).toBe('example.org');
      expect(normalizeDomain('  my-startup.co/products  ')).toBe('my-startup.co');
    });

    it('should return null for invalid or non-domain inputs', () => {
      expect(normalizeDomain('')).toBeNull();
      expect(normalizeDomain('nodots')).toBeNull();
      expect(normalizeDomain(null)).toBeNull();
    });

    it('should identify major freemail domains correctly', () => {
      expect(FREEMAIL_DOMAINS.has('gmail.com')).toBe(true);
      expect(FREEMAIL_DOMAINS.has('yahoo.com')).toBe(true);
      expect(FREEMAIL_DOMAINS.has('outlook.com')).toBe(true);
      expect(FREEMAIL_DOMAINS.has('protonmail.com')).toBe(true);
      expect(FREEMAIL_DOMAINS.has('acme.com')).toBe(false);
    });
  });

  describe('3. Email Validation', () => {
    it('should validate RFC conformant emails', () => {
      expect(isValidEmail('founder@saas.io')).toBe(true);
      expect(isValidEmail('sarah.connor+newsletter@skynet.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('4. Fuzzy Header Detection', () => {
    it('should automatically detect common B2B export headers', () => {
      const headers = ['Contact_Email', 'First_Name', 'Last_Name', 'Company_Name', 'Company_Website', 'Vertical', 'Location'];
      const mapping = spreadsheetImporterService.detectColumnMapping(headers);

      expect(mapping.email).toBe('Contact_Email');
      expect(mapping.firstName).toBe('First_Name');
      expect(mapping.lastName).toBe('Last_Name');
      expect(mapping.companyName).toBe('Company_Name');
      expect(mapping.website).toBe('Company_Website');
      expect(mapping.industry).toBe('Vertical');
      expect(mapping.country).toBe('Location');
    });
  });

  describe('5. End-to-End CSV/XLSX Parsing & Lead Extraction', () => {
    it('should parse buffer, sanitize formulas, resolve duplicates, and separate custom variables', () => {
      // Build test workbook in-memory
      const wsData = [
        ['Work_Email', 'First_Name', 'Company', 'Website', 'Plan_Tier', 'Notes'],
        ['alice@acme.com', 'Alice', 'Acme Inc', 'https://www.acme.com', 'Enterprise', '=HYPERLINK("malicious")'],
        ['bob@gmail.com', 'Bob', 'Solo Creator', '', 'Free', 'No website, freemail'],
        ['alice@acme.com', 'Alice Duplicate', 'Acme Inc', 'acme.com', 'Pro', 'Duplicate in file'],
        ['invalid-email', 'Charlie', 'Bad Data', 'https://bad.com', 'Basic', 'Invalid format'],
        ['', 'Empty Email', 'No Contact', 'https://nocontact.com', 'Basic', 'Missing email'],
        ['david@corp.org', 'David', 'Corp Org', '', 'Starter', 'Corporate email without website'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = spreadsheetImporterService.parseSpreadsheet(buffer);

      expect(result.headers).toEqual(['Work_Email', 'First_Name', 'Company', 'Website', 'Plan_Tier', 'Notes']);
      expect(result.suggestedMapping.email).toBe('Work_Email');
      expect(result.suggestedMapping.firstName).toBe('First_Name');
      expect(result.suggestedMapping.companyName).toBe('Company');
      expect(result.suggestedMapping.website).toBe('Website');

      expect(result.totalRows).toBe(6); // 6 data rows
      expect(result.validRows.length).toBe(3); // Alice, Bob, David
      expect(result.invalidRows.length).toBe(3); // Duplicate Alice, Invalid Charlie, Empty Email
      expect(result.duplicateCount).toBe(1);

      // Verify Row 1: Alice (Acme Inc)
      const alice = result.validRows.find((r) => r.email === 'alice@acme.com');
      expect(alice).toBeDefined();
      expect(alice?.firstName).toBe('Alice');
      expect(alice?.companyName).toBe('Acme Inc');
      expect(alice?.normalizedDomain).toBe('acme.com');
      expect(alice?.customVariables.Plan_Tier).toBe('Enterprise');
      // Verify formula injection sanitized with leading quote
      expect(alice?.customVariables.Notes).toBe('\'=HYPERLINK("malicious")');

      // Verify Row 2: Bob (Freemail - no website)
      const bob = result.validRows.find((r) => r.email === 'bob@gmail.com');
      expect(bob).toBeDefined();
      expect(bob?.normalizedDomain).toBeUndefined(); // Freemail domain is not used as company domain!

      // Verify Row 3: David (Corporate email - no website)
      const david = result.validRows.find((r) => r.email === 'david@corp.org');
      expect(david).toBeDefined();
      expect(david?.normalizedDomain).toBe('corp.org'); // Corporate domain extracted from email!

      // Verify invalid reasons
      expect(result.invalidRows.some((r) => r.reason === 'DUPLICATE_IN_FILE')).toBe(true);
      expect(result.invalidRows.some((r) => r.reason === 'INVALID_EMAIL')).toBe(true);
      expect(result.invalidRows.some((r) => r.reason === 'MISSING_EMAIL')).toBe(true);

      // Verify preview rows limit
      expect(result.previewRows.length).toBe(3);
    });
  });
});
