import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaignLeads, leads, contacts, campaigns } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { verifyWorkerAuth } from '@/lib/worker-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const [camp] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!camp) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get('status');

    // Build conditions
    const conditions = [eq(campaignLeads.campaignId, campaignId)];
    if (statusFilter && statusFilter !== 'ALL') {
      conditions.push(eq(campaignLeads.status, statusFilter as any));
    }

    const whereClause = and(...conditions);

    // Run count and query in parallel
    const [countResult, leadRows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(campaignLeads)
        .where(whereClause),
      db
        .select({
          id: campaignLeads.id,
          campaignId: campaignLeads.campaignId,
          leadId: campaignLeads.leadId,
          status: campaignLeads.status,
          currentStepNumber: campaignLeads.currentStepNumber,
          customVariables: campaignLeads.customVariables,
          disqualifiedReason: campaignLeads.disqualifiedReason,
          enrolledAt: campaignLeads.enrolledAt,
          lastContactedAt: campaignLeads.lastContactedAt,
          companyName: leads.companyName,
          firstName: leads.firstName,
          lastName: leads.lastName,
          channelTitle: leads.channelTitle,
          channelUrl: leads.channelUrl,
          website: leads.website,
          industry: leads.industry,
          country: leads.country,
          sourceProvider: leads.sourceProvider,
          email: contacts.email,
          emailStatus: contacts.emailStatus,
        })
        .from(campaignLeads)
        .innerJoin(leads, eq(campaignLeads.leadId, leads.id))
        .leftJoin(contacts, eq(campaignLeads.primaryContactId, contacts.id))
        .where(whereClause)
        .orderBy(desc(campaignLeads.enrolledAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      campaignId,
      total,
      page,
      limit,
      leads: leadRows,
    });
  } catch (err: any) {
    console.error('[Campaign Leads API Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch campaign leads' },
      { status: 500 }
    );
  }
}
