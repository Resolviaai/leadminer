import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyDashboardAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) return auth.response!;

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
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) return auth.response!;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // TASK-03 / P0-4: Strict boolean validation — reject strings, numbers, missing fields.
  // {"enabled":"false"} or {} must not arm/disarm the kill switch.
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'Invalid payload: "enabled" must be a JSON boolean (true or false), not a string or other type' },
      { status: 400 }
    );
  }

  const enabled: boolean = body.enabled;

  try {
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

    console.log(`[Kill Switch] Set to: ${enabled ? 'ARMED / ACTIVE' : 'DISARMED'} by ${auth.email}`);
    return NextResponse.json({ success: true, enabled });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

