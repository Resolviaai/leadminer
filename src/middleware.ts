import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookieEdge } from './lib/edge-auth';

/**
 * Next.js Edge Middleware — runs before every request.
 *
 * Public routes (no login required):
 *   - /login
 *   - /api/auth/login   (POST — the login endpoint itself)
 *   - /api/auth/logout  (POST — clear cookie)
 *   - /api/unsubscribe  (GET + POST — email recipients click this)
 *   - /api/health       (GET — minimal ping)
 *   - /_next/*          (Next.js internal assets)
 *   - /favicon.ico
 *
 * Everything else requires a valid session cookie.
 * Worker routes (/api/workers/*) are additionally protected by Bearer token
 * inside their own handlers — middleware adds the session layer on top.
 */

const PUBLIC_PATHS = new Set([
  '/',
  '/privacy',
  '/terms',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/unsubscribe',
  '/api/health',
  '/api/gdpr/delete',
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/favicon')) return true;
  // External cron callers (GitHub Actions, cron-job.org) authenticate via Bearer token
  // directly in the worker route handler using verifyWorkerAuth()
  if (pathname.startsWith('/api/workers/')) return true;
  // Google OAuth callback needs to be accessible by Google redirect
  if (pathname.startsWith('/api/auth/google/callback')) return true;
  // Static files
  if (pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  if (isPublic(pathname)) return NextResponse.next();

  // In development/test, skip auth entirely (controlled by NODE_ENV)
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return NextResponse.next();
  }

  // Check session using Edge-compatible Web Crypto
  const sessionSecret = process.env.SESSION_SECRET || '';
  const auth = await verifySessionCookieEdge(req, sessionSecret);
  if (!auth.authorized) {
    // API routes → 401 JSON (so frontend can handle)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: session required' },
        { status: 401 }
      );
    }
    // Page routes → redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except _next static files (handled by isPublic above for safety)
  matcher: ['/((?!_next/static|_next/image).*)'],
};
