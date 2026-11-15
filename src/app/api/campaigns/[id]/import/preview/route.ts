import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaigns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { spreadsheetImporterService, ColumnMapping } from '@/services/import/spreadsheet-importer.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sessionAuth = verifyDashboardAuth(req);
  const workerAuth = verifyWorkerAuth(req);
  if (!sessionAuth.authorized && !workerAuth.authorized) {
    return sessionAuth.response || workerAuth.response!;
  }

  try {
    const campaignId = Number(params.id);
    if (!campaignId || isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const [camp] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!camp) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    let buffer: Buffer | null = null;
    let customMapping: Partial<ColumnMapping> | undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      const mappingRaw = formData.get('mapping') as string | null;
      if (mappingRaw) {
        try {
          customMapping = JSON.parse(mappingRaw);
        } catch {
          // ignore mapping parse error
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.fileBase64) {
        return NextResponse.json({ error: 'Missing fileBase64 in request body' }, { status: 400 });
      }
      buffer = Buffer.from(body.fileBase64, 'base64');
      customMapping = body.mapping;
    } else {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Use multipart/form-data or application/json' },
        { status: 415 }
      );
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    // Limit maximum upload size to 10MB to protect memory
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum 10MB limit' }, { status: 413 });
    }

    const parseResult = spreadsheetImporterService.parseSpreadsheet(buffer, customMapping);

    return NextResponse.json({
      success: true,
      campaignId,
      headers: parseResult.headers,
      suggestedMapping: parseResult.suggestedMapping,
      totalRows: parseResult.totalRows,
      validCount: parseResult.validRows.length,
      invalidCount: parseResult.invalidRows.length,
      duplicateCount: parseResult.duplicateCount,
      previewRows: parseResult.previewRows,
      sampleErrors: parseResult.invalidRows.slice(0, 10),
    });
  } catch (err: any) {
    console.error('[Campaign Import Preview Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to parse spreadsheet' },
      { status: 500 }
    );
  }
}
