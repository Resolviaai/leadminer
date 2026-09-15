import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaigns } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const [camp] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!camp) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const nextStatus = camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await db
      .update(campaigns)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    return NextResponse.redirect(new URL('/campaigns', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
