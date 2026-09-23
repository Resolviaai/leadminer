import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/client';
import { suppressions, leads, contacts } from '../../../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { telegramService } from '../../../services/notifications/telegram.service';
import { verifyUnsubscribeToken } from '../../../lib/unsubscribe-token';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleUnsubscribe(email: string, leadIdStr?: string | null) {
  const cleanEmail = email.toLowerCase().trim();
  const leadId = leadIdStr ? parseInt(leadIdStr, 10) : null;

  let channelTitle = 'Direct Unsubscribe';
  let channelId: string | null = null;
  let verifiedLeadId: number | null = null;

  // BUG-29: Validate leadId matches the email in contacts table before updating lead status
  if (leadId && !isNaN(leadId)) {
    const contactCheck = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.leadId, leadId), sql`lower(${contacts.email}) = ${cleanEmail}`))
      .limit(1);

    if (contactCheck.length > 0) {
      verifiedLeadId = leadId;
    } else {
      console.warn(`[Unsubscribe] leadId ${leadId} does not match contact ${cleanEmail}. Suppressing email only.`);
    }
  }

  // If no verified leadId from param, look up lead by contact email
  if (!verifiedLeadId) {
    const matchContact = await db
      .select({ leadId: contacts.leadId })
      .from(contacts)
      .where(sql`lower(${contacts.email}) = ${cleanEmail}`)
      .limit(1);

    if (matchContact.length > 0) {
      verifiedLeadId = matchContact[0].leadId;
    }
  }

  if (verifiedLeadId) {
    const lead = await db
      .select({ channelTitle: leads.channelTitle, channelId: leads.channelId })
      .from(leads)
      .where(eq(leads.id, verifiedLeadId))
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
        .where(eq(leads.id, verifiedLeadId));
    }
  }

  // Always record suppression in suppressions table
  await db
    .insert(suppressions)
    .values({
      email: cleanEmail,
      channelId: channelId || null,
      reason: 'UNSUBSCRIBED',
      source: 'OPT_OUT_LINK',
    })
    .onConflictDoNothing();

  try {
    await telegramService.notifyUnsubscribe(
      channelTitle,
      cleanEmail,
      'One-click unsubscribe or web opt-out link clicked'
    );
  } catch (tErr: any) {
    console.warn('[Unsubscribe Telegram Alert Non-Fatal]:', tErr.message);
  }

  return { success: true, email: cleanEmail };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip)) {
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Too Many Requests</h2><p>Please wait a moment before trying again.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const leadId = searchParams.get('leadId') || '';
  const token = searchParams.get('token') || '';

  if (!email) {
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Invalid Request</h2><p>No recipient email was specified.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    );
  }

  const cleanEmail = email.toLowerCase().trim();

  // Validate HMAC signature if provided or required
  if (token && !verifyUnsubscribeToken(cleanEmail, leadId, token)) {
    console.warn(`[Unsubscribe Audit] Invalid token attempt for ${cleanEmail} from IP ${ip}`);
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Security Check Failed</h2><p>Invalid or expired unsubscribe signature.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 403 }
    );
  }

  const escapedEmail = escapeHtml(cleanEmail);
  const escapedLeadId = escapeHtml(leadId);
  const escapedToken = escapeHtml(token);

  // BUG-04 & BUG-28: Render confirmation form on GET without modifying database.
  // Prevents automated email security scanners and link prefetchers from auto-unsubscribing recipients!
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Unsubscribe</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #161616; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #1C1C1C; border: 1px solid #2E2E2E; border-radius: 12px; padding: 2.5rem 2rem; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .icon { width: 48px; height: 48px; margin: 0 auto 1.25rem; border-radius: 50%; background: rgba(196,106,58,0.12); border: 1px solid rgba(196,106,58,0.25); display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 24px; height: 24px; stroke: #C46A3A; }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; color: #ffffff; }
    p { font-size: 0.875rem; line-height: 1.5; color: #94a3b8; margin: 0 0 1.25rem; }
    .email-chip { display: inline-block; font-family: ui-monospace, monospace; font-size: 0.8125rem; background: #232323; padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #2E2E2E; color: #cbd5e1; margin-bottom: 1.5rem; word-break: break-all; }
    .btn-submit { display: block; width: 100%; background: #C46A3A; color: #ffffff; font-weight: 600; font-size: 0.875rem; padding: 0.75rem 1rem; border-radius: 8px; border: none; cursor: pointer; transition: background 0.2s; }
    .btn-submit:hover { background: #D17A45; }
    .btn-submit:active { transform: scale(0.98); }
    .secondary-note { font-size: 0.75rem; color: #64748b; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
      </svg>
    </div>
    <h1>Unsubscribe Confirmation</h1>
    <p>Please confirm that you would like to stop receiving outreach emails at:</p>
    <div class="email-chip">${escapedEmail}</div>
    <form method="POST" action="/api/unsubscribe">
      <input type="hidden" name="email" value="${escapedEmail}" />
      <input type="hidden" name="leadId" value="${escapedLeadId}" />
      <input type="hidden" name="token" value="${escapedToken}" />
      <button type="submit" class="btn-submit">Confirm Unsubscribe</button>
    </form>
    <div class="secondary-note">Once confirmed, you will be permanently suppressed from all future campaigns.</div>
  </div>
</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // BUG-27: Security headers for raw HTML page
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip)) {
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Too Many Requests</h2><p>Please wait a moment before trying again.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 429 }
    );
  }

  let email: string | null = null;
  let leadId: string | null = null;
  let token: string | null = null;
  let isHtmlRequest = false;

  const contentType = req.headers.get('content-type') || '';
  const acceptHeader = req.headers.get('accept') || '';

  if (acceptHeader.includes('text/html') || contentType.includes('application/x-www-form-urlencoded')) {
    isHtmlRequest = true;
  }

  const { searchParams } = new URL(req.url);
  email = searchParams.get('email');
  leadId = searchParams.get('leadId');
  token = searchParams.get('token');

  if (!email || !token) {
    try {
      if (contentType.includes('application/json')) {
        const body = await req.json();
        email = email || body.email;
        leadId = leadId || body.leadId?.toString();
        token = token || body.token;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        email = email || formData.get('email')?.toString() || null;
        leadId = leadId || formData.get('leadId')?.toString() || null;
        token = token || formData.get('token')?.toString() || null;
      }
    } catch {}
  }

  if (!email) {
    if (isHtmlRequest) {
      return new NextResponse(
        '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Invalid Request</h2><p>No recipient email was specified.</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Validate HMAC signature (P2-1)
  const isProduction = process.env.NODE_ENV === 'production';
  if (token) {
    if (!verifyUnsubscribeToken(cleanEmail, leadId, token)) {
      console.warn(`[Unsubscribe Audit] REJECTED invalid token for ${cleanEmail} (leadId: ${leadId}) from IP ${ip}`);
      if (isHtmlRequest) {
        return new NextResponse(
          '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Security Check Failed</h2><p>Invalid or expired unsubscribe signature.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: 'Invalid or expired unsubscribe signature' }, { status: 403 });
    }
  } else if (isProduction) {
    console.warn(`[Unsubscribe Audit] REJECTED missing token in production for ${cleanEmail} from IP ${ip}`);
    if (isHtmlRequest) {
      return new NextResponse(
        '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#161616;color:#e2e8f0;padding:2rem;text-align:center;"><h2>Security Check Failed</h2><p>Unsubscribe link signature required.</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: 'Unsubscribe signature token required' }, { status: 403 });
  }

  const escapedEmail = escapeHtml(cleanEmail);

  try {
    console.log(`[Unsubscribe Audit] Processing confirmed opt-out for ${cleanEmail} (leadId: ${leadId}) from IP ${ip}`);
    // BUG-04: Perform the actual database mutation on POST!
    await handleUnsubscribe(cleanEmail, leadId);

    if (isHtmlRequest) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed Successfully</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #161616; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #1C1C1C; border: 1px solid #2E2E2E; border-radius: 12px; padding: 2.5rem 2rem; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .icon { width: 48px; height: 48px; margin: 0 auto 1.25rem; border-radius: 50%; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 24px; height: 24px; stroke: #34d399; }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; color: #ffffff; }
    p { font-size: 0.875rem; line-height: 1.5; color: #94a3b8; margin: 0 0 1.25rem; }
    .email-chip { display: inline-block; font-family: ui-monospace, monospace; font-size: 0.8125rem; background: #232323; padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #2E2E2E; color: #cbd5e1; word-break: break-all; }
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
    <div class="email-chip">${escapedEmail}</div>
  </div>
</body>
</html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed ${cleanEmail}`,
    });
  } catch (err: any) {
    // BUG-04: Fail-honest! On DB error, return 500 error instead of false success!
    console.error('[Unsubscribe Handler Error]:', err.message);

    if (isHtmlRequest) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #161616; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #1C1C1C; border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 2.5rem 2rem; max-width: 440px; text-align: center; }
    .icon { width: 48px; height: 48px; margin: 0 auto 1.25rem; border-radius: 50%; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 24px; height: 24px; stroke: #f87171; }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; color: #ffffff; }
    p { font-size: 0.875rem; line-height: 1.5; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1>Processing Error</h1>
    <p>We encountered a temporary database issue processing your unsubscribe request. Please try again in a few moments.</p>
  </div>
</body>
</html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Database error processing unsubscribe request' },
      { status: 500 }
    );
  }
}
