import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaigns, logs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // P0-2: Require dashboard session or worker bearer token for mutating route
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

    // P3-2: Support idempotent targetStatus in body
    let targetStatus: 'ACTIVE' | 'PAUSED' | undefined;
    try {
      if (req.headers.get('content-type')?.includes('application/json')) {
        const body = await req.json();
        if (body.targetStatus === 'ACTIVE' || body.targetStatus === 'PAUSED') {
          targetStatus = body.targetStatus;
        }
      }
    } catch {
      // Empty body or non-JSON form post
    }

    const nextStatus = targetStatus ?? (camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');

    // Idempotent: if already in requested state, do not double-update or log redundant transitions
    if (camp.status === nextStatus) {
      if (
        req.headers.get('accept')?.includes('application/json') ||
        req.headers.get('content-type')?.includes('application/json')
      ) {
        return NextResponse.json({ success: true, status: nextStatus, unchanged: true });
      }
      return NextResponse.redirect(new URL('/campaigns', req.url), { status: 303 });
    }

    await db
      .update(campaigns)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    // Audit log state change
    try {
      await db.insert(logs).values({
        eventType: 'CAMPAIGN_TOGGLED',
        level: 'INFO',
        message: `Campaign #${campaignId} (${camp.name}) status changed from ${camp.status} to ${nextStatus}`,
        metadata: {
          campaignId,
          campaignName: camp.name,
          previousStatus: camp.status,
          newStatus: nextStatus,
          operator: sessionAuth.email || 'system_worker',
        },
      });
    } catch (logErr) {
      console.warn('Failed to insert campaign toggle audit log:', logErr);
    }

    if (
      req.headers.get('accept')?.includes('application/json') ||
      req.headers.get('content-type')?.includes('application/json')
    ) {
      return NextResponse.json({ success: true, status: nextStatus });
    }

    return NextResponse.redirect(new URL('/campaigns', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
