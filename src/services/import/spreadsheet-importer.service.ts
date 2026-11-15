import * as XLSX from 'xlsx';

export interface ColumnMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  industry?: string;
  country?: string;
}

export interface ParsedLeadRow {
  rowNumber: number;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  normalizedDomain?: string;
  industry?: string;
  country?: string;
  customVariables: Record<string, any>;
  raw: Record<string, any>;
}

export interface InvalidLeadRow {
  rowNumber: number;
  email?: string;
  reason: 'MISSING_EMAIL' | 'INVALID_EMAIL' | 'DUPLICATE_IN_FILE' | 'EMPTY_ROW';
  message: string;
  raw: Record<string, any>;
}

export interface SpreadsheetParseResult {
  headers: string[];
  suggestedMapping: ColumnMapping;
  totalRows: number;
  validRows: ParsedLeadRow[];
  invalidRows: InvalidLeadRow[];
  duplicateCount: number;
  previewRows: ParsedLeadRow[];
}

export const FREEMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'mail.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
  'fastmail.com',
]);

const HEADER_PATTERNS = {
  email: /^(email|e-mail|mail|email_address|contact_email|work_email|primary_email)$/i,
  firstName: /^(first_name|firstname|fname|first|given_name)$/i,
  lastName: /^(last_name|lastname|lname|last|surname|family_name)$/i,
  companyName: /^(company|company_name|organization|org|account_name|business_name|channel_title|title)$/i,
  website: /^(website|domain|url|company_website|site|web|link)$/i,
  industry: /^(industry|sector|category|vertical)$/i,
  country: /^(country|country_code|nation|geo|region|location)$/i,
};

/**
 * Sanitize formula injection triggers (CWE-1236)
 * Prefixes sensitive leading characters (=, +, -, @, \t, \r) with a single quote.
 */
export function sanitizeCellValue(val: any): any {
  if (typeof val !== 'string') return val;
  if (/^[=+\-@\t\r]/.test(val)) {
    return `'${val}`;
  }
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Normalize website or raw domain to clean root hostname
 * e.g. "https://www.Acme-Corp.com/about?ref=1" -> "acme-corp.com"
 */
export function normalizeDomain(rawUrlOrDomain?: string | null): string | null {
  if (!rawUrlOrDomain || typeof rawUrlOrDomain !== 'string') return null;
  let clean = rawUrlOrDomain.trim().toLowerCase();
  if (!clean) return null;

  // Strip leading protocols
  clean = clean.replace(/^[a-zA-Z]+:\/\//, '');
  // Strip paths, query params, hashes, port
  clean = clean.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  // Strip www.
  clean = clean.replace(/^www\./, '');
  // Strip trailing or leading dots
  clean = clean.replace(/^\.+|\.+$/g, '');

  if (!clean || clean.length > 255 || !clean.includes('.')) {
    return null;
  }
  return clean;
}

/**
 * RFC 5322 compliant email validator (practical web standard)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean.length < 5 || clean.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
}

export class SpreadsheetImporterService {
  /**
   * Automatically detect column mappings based on fuzzy header name matching
   */
  public detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = { email: '' };

    for (const h of headers) {
      const cleanHeader = h.trim();
      if (!cleanHeader) continue;

      if (!mapping.email && HEADER_PATTERNS.email.test(cleanHeader)) {
        mapping.email = cleanHeader;
      } else if (!mapping.firstName && HEADER_PATTERNS.firstName.test(cleanHeader)) {
        mapping.firstName = cleanHeader;
      } else if (!mapping.lastName && HEADER_PATTERNS.lastName.test(cleanHeader)) {
        mapping.lastName = cleanHeader;
      } else if (!mapping.companyName && HEADER_PATTERNS.companyName.test(cleanHeader)) {
        mapping.companyName = cleanHeader;
      } else if (!mapping.website && HEADER_PATTERNS.website.test(cleanHeader)) {
        mapping.website = cleanHeader;
      } else if (!mapping.industry && HEADER_PATTERNS.industry.test(cleanHeader)) {
        mapping.industry = cleanHeader;
      } else if (!mapping.country && HEADER_PATTERNS.country.test(cleanHeader)) {
        mapping.country = cleanHeader;
      }
    }

    return mapping;
  }

  /**
   * Parse CSV or Excel buffer, validate email addresses, detect duplicates, and extract custom variables
   */
  public parseSpreadsheet(
    buffer: Buffer | Uint8Array,
    customMapping?: Partial<ColumnMapping>
  ): SpreadsheetParseResult {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Spreadsheet contains no sheets');
    }

    // Default to the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found in workbook`);
    }

    // Parse sheet as raw json rows (header: 1 returns array of rows)
    const rawMatrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false });
    if (!rawMatrix || rawMatrix.length === 0) {
      return {
        headers: [],
        suggestedMapping: { email: '' },
        totalRows: 0,
        validRows: [],
        invalidRows: [],
        duplicateCount: 0,
        previewRows: [],
      };
    }

    // Extract headers from first non-empty row
    const headerRow = rawMatrix[0];
    const headers: string[] = headerRow.map((cell: any) => String(cell || '').trim()).filter(Boolean);

    // Auto-detect or apply mapping
    const detected = this.detectColumnMapping(headers);
    const activeMapping: ColumnMapping = {
      email: customMapping?.email || detected.email,
      firstName: customMapping?.firstName || detected.firstName,
      lastName: customMapping?.lastName || detected.lastName,
      companyName: customMapping?.companyName || detected.companyName,
      website: customMapping?.website || detected.website,
      industry: customMapping?.industry || detected.industry,
      country: customMapping?.country || detected.country,
    };

    // Convert subsequent rows into objects keyed by header
    const rowsAsObjects = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      raw: false,
      defval: '',
    });

    const validRows: ParsedLeadRow[] = [];
    const invalidRows: InvalidLeadRow[] = [];
    const seenEmails = new Set<string>();
    let duplicateCount = 0;

    for (let i = 0; i < rowsAsObjects.length; i++) {
      const rowNumber = i + 2; // Row 1 is header
      const rawRow = rowsAsObjects[i];

      // Sanitize all row values against formula injection
      const sanitizedRaw: Record<string, any> = {};
      for (const [key, val] of Object.entries(rawRow)) {
        sanitizedRaw[key] = sanitizeCellValue(val);
      }

      // Check if row is completely empty
      const hasAnyValue = Object.values(sanitizedRaw).some((v) => v !== '' && v !== null && v !== undefined);
      if (!hasAnyValue) {
        continue;
      }

      // Extract email via mapping
      const rawEmail = activeMapping.email ? sanitizedRaw[activeMapping.email] : undefined;
      const cleanEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

      if (!cleanEmail) {
        invalidRows.push({
          rowNumber,
          reason: 'MISSING_EMAIL',
          message: `Missing email address in column "${activeMapping.email || 'email'}"`,
          raw: sanitizedRaw,
        });
        continue;
      }

      if (!isValidEmail(cleanEmail)) {
        invalidRows.push({
          rowNumber,
          email: cleanEmail,
          reason: 'INVALID_EMAIL',
          message: `Invalid email syntax: "${cleanEmail}"`,
          raw: sanitizedRaw,
        });
        continue;
      }

      // In-file duplicate detection
      if (seenEmails.has(cleanEmail)) {
        duplicateCount++;
        invalidRows.push({
          rowNumber,
          email: cleanEmail,
          reason: 'DUPLICATE_IN_FILE',
          message: `Duplicate email within spreadsheet: "${cleanEmail}"`,
          raw: sanitizedRaw,
        });
        continue;
      }
      seenEmails.add(cleanEmail);

      // Extract standard fields
      const firstName = activeMapping.firstName ? sanitizedRaw[activeMapping.firstName] || undefined : undefined;
      const lastName = activeMapping.lastName ? sanitizedRaw[activeMapping.lastName] || undefined : undefined;
      const companyName = activeMapping.companyName ? sanitizedRaw[activeMapping.companyName] || undefined : undefined;
      const website = activeMapping.website ? sanitizedRaw[activeMapping.website] || undefined : undefined;
      const industry = activeMapping.industry ? sanitizedRaw[activeMapping.industry] || undefined : undefined;
      const country = activeMapping.country ? sanitizedRaw[activeMapping.country] || undefined : undefined;

      // Domain normalization with Freemail protection
      let domain: string | null = normalizeDomain(website);
      const emailDomain = cleanEmail.split('@')[1];

      // If website was missing or invalid, check if email is corporate
      if (!domain && emailDomain && !FREEMAIL_DOMAINS.has(emailDomain)) {
        domain = emailDomain;
      }

      // Collect remaining columns into customVariables
      const mappedColSet = new Set(Object.values(activeMapping).filter(Boolean));
      const customVariables: Record<string, any> = {};
      for (const [k, v] of Object.entries(sanitizedRaw)) {
        if (!mappedColSet.has(k) && v !== '' && v !== null && v !== undefined) {
          customVariables[k] = v;
        }
      }

      validRows.push({
        rowNumber,
        email: cleanEmail,
        firstName,
        lastName,
        companyName,
        website,
        normalizedDomain: domain || undefined,
        industry,
        country,
        customVariables,
        raw: sanitizedRaw,
      });
    }

    return {
      headers,
      suggestedMapping: detected,
      totalRows: rowsAsObjects.length,
      validRows,
      invalidRows,
      duplicateCount,
      previewRows: validRows.slice(0, 5),
    };
  }
}

export const spreadsheetImporterService = new SpreadsheetImporterService();
