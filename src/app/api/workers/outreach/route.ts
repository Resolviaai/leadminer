// BUG-07: Legacy v1 outreach endpoint RETIRED.
//
// This route previously called runOutreachBatch() which sent emails without
// going through the sequence state machine (no delays, no reply checks,
// no scheduled_emails table, no duplicate-send protection).
//
// All outreach now runs exclusively through the v2 Dispatcher:
//   POST /api/workers/dispatch  →  runDispatcher()
//
// Returning 410 Gone so that any stale cron-job.org triggers or bookmarks
// fail loudly rather than silently sending unsequenced emails.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  console.error(
    '[RETIRED] POST /api/workers/outreach called. ' +
    'This legacy v1 endpoint has been disabled. ' +
    'Use POST /api/workers/dispatch instead.'
  );
  return NextResponse.json(
    {
      error: 'ENDPOINT_RETIRED',
      message:
        'The legacy v1 outreach worker has been retired. ' +
        'All email sending now runs through the v2 Dispatcher at POST /api/workers/dispatch.',
    },
    { status: 410 }
  );
}
