import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/client';
import { suppressions, leads, contacts, scheduledEmails, leadSequenceProgress, logs } from '../../../../db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limiter';
import { verifyUnsubscribeToken } from '../../../../lib/unsubscribe-token';
import { verifyDashboardAuth } from '../../../../lib/api-auth';

export const dynamic = 'force-dynamic';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function performGdprErasure(email: string, reason = 'GDPR_RIGHT_TO_ERASURE') {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Always record in suppressions table so this email can NEVER be imported or emailed again
  await db
    .insert(suppressions)
    .values({
      email: cleanEmail,
      reason: 'GDPR_ERASURE',
      source: reason,
    })
    .onConflictDoNothing();

  // 2. Find matching contacts
  const matchedContacts = await db
    .select({ id: contacts.id, leadId: contacts.leadId })
    .from(contacts)
    .where(sql`lower(${contacts.email}) = ${cleanEmail}`);

  const contactIds = matchedContacts.map((c) => c.id);
  const leadIds = Array.from(new Set(matchedContacts.map((c) => c.leadId)));

  if (leadIds.length > 0) {
    // 3. Cancel any pending scheduled emails for these leads
    await db
      .update(scheduledEmails)
      .set({
        status: 'CANCELLED',
        error: 'Cancelled due to GDPR Right to Erasure request',
        updatedAt: new Date(),
      })
      .where(inArray(scheduledEmails.leadId, leadIds));

    // 4. Cancel active sequence progress
    await db
      .update(leadSequenceProgress)
      .set({
        status: 'CANCELLED_REPLY',
        nextStepDueAt: null,
        updatedAt: new Date(),
      })
      .where(inArray(leadSequenceProgress.leadId, leadIds));

    // 5. Anonymize lead personal metadata
    await db
      .update(leads)
      .set({
        channelTitle: '[REDACTED - GDPR ERASURE]',
        description: null,
        website: null,
        phone: null,
        contactPageUrl: null,
        rawPayload: null,
        suppressionStatus: true,
        outreachStatus: 'UNSUBSCRIBED',
        updatedAt: new Date(),
      })
      .where(inArray(leads.id, leadIds));
  }

  // 6. Delete all matching contact records
  if (contactIds.length > 0) {
    await db
      .delete(contacts)
      .where(inArray(contacts.id, contactIds));
  }

  // 7. Audit Log
  try {
    await db.insert(logs).values({
      eventType: 'GDPR_ERASURE',
      level: 'INFO',
      message: `GDPR erasure executed for ${cleanEmail}. Redacted ${leadIds.length} leads, deleted ${contactIds.length} contacts.`,
      metadata: { email: cleanEmail, leadIdsCount: leadIds.length, contactIdsCount: contactIds.length },
    });
  } catch {
    // Non-fatal
  }

  return { leadIdsCount: leadIds.length, contactIdsCount: contactIds.length };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit('gdpr_post', ip, 10, 3600000); // 10 per hour
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  try {
    const body = await req.json();
    const { email, confirmation, token, leadId } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    if (confirmation !== true) {
      return NextResponse.json(
        { error: 'Confirmation is required to execute permanent GDPR erasure.' },
        { status: 400 }
      );
    }

    // TASK-01 / N-P0-1: Mandatory authorization check.
    // GDPR erasure is destructive. Require either:
    // 1) An active authenticated dashboard session (admin), OR
    // 2) A valid HMAC signature token matching the email and leadId.
    const dashboardAuth = verifyDashboardAuth(req);
    let isAuthorized = dashboardAuth.authorized;

    if (!isAuthorized && token && leadId) {
      const isValid = verifyUnsubscribeToken(email, Number(leadId), token);
      if (isValid) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.warn(`[GDPR] Unauthorized erasure attempt rejected for ${email} (IP: ${ip})`);
      return NextResponse.json(
        { error: 'Unauthorized: valid signature token or admin session required to perform GDPR erasure' },
        { status: 403 }
      );
    }

    const result = await performGdprErasure(email);

    return NextResponse.json({
      success: true,
      message: 'All personal data erased and email permanently suppressed in accordance with GDPR Article 17.',
      erased: result,
    });
  } catch (err: any) {
    console.error('[GDPR Delete API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit('gdpr_get', ip, 30, 60000);
  if (!rl.allowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const leadIdParam = searchParams.get('leadId') || '';

  const safeEmail = escapeHtml(emailParam);
  const safeToken = escapeHtml(tokenParam);
  const safeLeadId = escapeHtml(leadIdParam);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GDPR Data Erasure Request</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0b0f17;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #ffffff;
      letter-spacing: -0.025em;
    }
    p {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .notice {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.8125rem;
      color: #fca5a5;
      line-height: 1.4;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    input[type="email"] {
      width: 100%;
      padding: 0.625rem 0.875rem;
      background: #070a0f;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: #ffffff;
      font-size: 0.875rem;
      outline: none;
    }
    input[type="email"]:focus {
      border-color: #6366f1;
    }
    .checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.8125rem;
      color: #94a3b8;
    }
    .checkbox-group input {
      margin-top: 0.2rem;
    }
    button {
      width: 100%;
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    button:hover {
      background: #b91c1c;
    }
    #status {
      margin-top: 1rem;
      font-size: 0.875rem;
      text-align: center;
      display: none;
    }
    .success { color: #34d399; }
    .error { color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <h1>GDPR Right to Erasure</h1>
    <p>Under GDPR Article 17, you have the right to request permanent erasure of your personal data from our systems.</p>

    <div class="notice">
      Submitting this request will permanently delete all contact records associated with your email and add your email to our suppression list to prevent any future contact.
    </div>

    <form id="gdprForm">
      <input type="hidden" id="token" value="${safeToken}">
      <input type="hidden" id="leadId" value="${safeLeadId}">

      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" value="${safeEmail}" required placeholder="you@domain.com">
      </div>

      <div class="checkbox-group">
        <input type="checkbox" id="confirm" required>
        <label for="confirm">I confirm that I am the owner of this email address and request the permanent erasure of all my personal data.</label>
      </div>

      <button type="submit" id="submitBtn">Permanently Erase My Data</button>
      <div id="status"></div>
    </form>
  </div>

  <script>
    document.getElementById('gdprForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const token = document.getElementById('token').value;
      const leadId = document.getElementById('leadId').value;
      const statusDiv = document.getElementById('status');
      const submitBtn = document.getElementById('submitBtn');

      submitBtn.disabled = true;
      submitBtn.innerText = 'Processing Erasure...';
      statusDiv.style.display = 'none';

      try {
        const res = await fetch('/api/gdpr/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, confirmation: true, token, leadId })
        });
        const data = await res.json();
        if (res.ok) {
          statusDiv.className = 'success';
          statusDiv.innerText = 'Your data has been successfully erased. Your email is permanently suppressed.';
          document.getElementById('gdprForm').reset();
        } else {
          statusDiv.className = 'error';
          statusDiv.innerText = data.error || 'Failed to process request. Please try again.';
          submitBtn.disabled = false;
          submitBtn.innerText = 'Permanently Erase My Data';
        }
      } catch (err) {
        statusDiv.className = 'error';
        statusDiv.innerText = 'Network error. Please try again.';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Permanently Erase My Data';
      }
      statusDiv.style.display = 'block';
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
