import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export async function GET() {
  try {
    const record = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'kill_switch'))
      .limit(1);

    const enabled = record.length > 0 && record[0].value ? Boolean((record[0].value as any).enabled) : false;
    return NextResponse.json({ success: true, enabled });
  } catch (error: any) {
    return NextResponse.json({ success: false, enabled: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyWorkerAuth(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    let enabled = true;

    // Handle form data or json
    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      enabled = formData.get('enabled') === 'true';
    } else {
      const body = await req.json().catch(() => ({}));
      enabled = Boolean(body.enabled);
    }

    await db
      .insert(systemSettings)
      .values({
        key: 'kill_switch',
        value: { enabled },
        description: 'Global outreach kill switch. Set enabled=true to immediately halt sending.',
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: { enabled },
          updatedAt: new Date(),
        },
      });

    console.log(`[Kill Switch] Outreach kill switch set to: ${enabled ? 'ARMED / ACTIVE' : 'DISARMED'}`);

    if (isJson || req.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({ success: true, enabled });
    }

    return NextResponse.redirect(new URL('/settings', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
