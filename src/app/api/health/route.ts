import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from '@/scripts/healthcheck';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { verifyDashboardAuth } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  // Check if caller is authenticated via Bearer secret or active session
  const workerAuth = verifyWorkerAuth(req);
  const sessionAuth = verifyDashboardAuth(req);

  const isAuthenticated = workerAuth.authorized || sessionAuth.authorized;

  if (!isAuthenticated) {
    const ip = getClientIp(req);
    const rl = checkRateLimit('health', ip, 60, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // P3-5: Minimal public health ping — never expose DB internals, inboxes, or metric counts
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }

  // Full diagnostics for authenticated operators and schedulers
  const result = await runHealthCheck();
  return NextResponse.json(result);
}
