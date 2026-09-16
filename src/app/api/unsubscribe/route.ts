import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { suppressions, leads, contacts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { telegramService } from '@/services/notifications/telegram.service';

export const dynamic = 'force-dynamic';

async function handleUnsubscribe(email: string, leadIdStr?: string | null) {
  const cleanEmail = email.toLowerCase().trim();
  const leadId = leadIdStr ? parseInt(leadIdStr, 10) : null;

  let channelTitle = 'Direct Unsubscribe';
  let channelId: string | null = null;

  try {
    if (leadId && !isNaN(leadId)) {
      const lead = await db
        .select({ channelTitle: leads.channelTitle, channelId: leads.channelId })
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (lead.length > 0) {
        channelTitle = lead[0].channelTitle;
        channelId = lead[0].channelId;

        await db
          .update(leads)
          .set({
            outreachStatus: 'UNSUBSCRIBED',
            suppressionStatus: true,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, leadId));
      }
    } else {
      const matchContact = await db
        .select({ leadId: contacts.leadId })
        .from(contacts)
        .where(sql`lower(${contacts.email}) = ${cleanEmail}`)
        .limit(1);

      if (matchContact.length > 0) {
        const foundLeadId = matchContact[0].leadId;
        const lead = await db
          .select({ channelTitle: leads.channelTitle, channelId: leads.channelId })
          .from(leads)
          .where(eq(leads.id, foundLeadId))
          .limit(1);

        if (lead.length > 0) {
          channelTitle = lead[0].channelTitle;
          channelId = lead[0].channelId;

          await db
            .update(leads)
            .set({
              outreachStatus: 'UNSUBSCRIBED',
              suppressionStatus: true,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, foundLeadId));
        }
      }
    }

    await db
      .insert(suppressions)
      .values({
        email: cleanEmail,
        channelId: channelId || null,
        reason: 'UNSUBSCRIBED',
        source: 'OPT_OUT_LINK',
      })
      .onConflictDoNothing();

    await telegramService.notifyUnsubscribe(
      channelTitle,
      cleanEmail,
      'One-click unsubscribe or web opt-out link clicked'
    );
  } catch (err: any) {
    console.error('[Unsubscribe Handler Error]:', err.message);
  }

  return { success: true, email: cleanEmail };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const leadId = searchParams.get('leadId');

  if (!email) {
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0b0f17;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Invalid Request</h2><p>No recipient email was specified.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  await handleUnsubscribe(email, leadId);

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed Successfully</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 2.5rem 2rem; max-width: 440px; text-align: center; }
    .icon { width: 48px; height: 48px; margin: 0 auto 1.25rem; border-radius: 50%; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 24px; height: 24px; stroke: #34d399; }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; color: #ffffff; }
    p { font-size: 0.875rem; line-height: 1.5; color: #94a3b8; margin: 0 0 1.25rem; }
    .email-chip { display: inline-block; font-family: ui-monospace, monospace; font-size: 0.8125rem; background: rgba(255,255,255,0.06); padding: 0.25rem 0.625rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <h1>You are unsubscribed</h1>
    <p>We have permanently removed your address from our outreach queue. You will not receive any further automated emails from us.</p>
    <div class="email-chip">${email}</div>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function POST(req: NextRequest) {
  let email: string | null = null;
  let leadId: string | null = null;

  const { searchParams } = new URL(req.url);
  email = searchParams.get('email');
  leadId = searchParams.get('leadId');

  if (!email) {
    try {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await req.json();
        email = body.email;
        leadId = body.leadId?.toString();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        email = formData.get('email')?.toString() || null;
        leadId = formData.get('leadId')?.toString() || null;
      }
    } catch {}
  }

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
  }

  await handleUnsubscribe(email, leadId);

  return NextResponse.json({
    success: true,
    message: `Successfully unsubscribed ${email}`,
  });
}
