import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from '@/scripts/healthcheck';
import { verifyWorkerAuth } from '@/lib/worker-auth';
import { verifyDashboardAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  // Check if caller is authenticated via Bearer secret or active session
  const workerAuth = verifyWorkerAuth(req);
  const sessionAuth = verifyDashboardAuth(req);

  const isAuthenticated = workerAuth.authorized || sessionAuth.authorized;

  if (!isAuthenticated) {
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
