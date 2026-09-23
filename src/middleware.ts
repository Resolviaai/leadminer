import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookieEdge, createSessionCookieEdge } from './lib/edge-auth';

/**
 * Next.js Edge Middleware — runs before every request.
 *
 * Public routes (no login required):
 *   - / (Landing page)
 *   - /privacy
 *   - /terms
 *   - /login
 *   - /manifest.json    (PWA manifest)
 *   - /sw.js            (PWA service worker)
 *   - /api/auth/login   (POST — the login endpoint itself)
 *   - /api/auth/logout  (POST — clear cookie)
 *   - /api/unsubscribe  (GET + POST — email recipients click this)
 *   - /api/health       (GET — minimal ping)
 *   - /api/gdpr/delete  (GET + POST — GDPR erasure portal)
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
  '/manifest.json',
  '/sw.js',
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
  // Static files and PWA assets
  if (pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|json|woff2?)$/)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // In development/test, skip auth entirely (controlled by NODE_ENV)
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return NextResponse.next();
  }

  // Check session using Edge-compatible Web Crypto
  const sessionSecret = process.env.SESSION_SECRET || '';
  const auth = await verifySessionCookieEdge(req, sessionSecret);

  // If already authenticated and visiting /login, redirect straight to dashboard
  if (auth.authorized && pathname === '/login') {
    const target = req.nextUrl.searchParams.get('redirect');
    const destination = target && target !== '/' ? target : '/overview';
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // Skip public paths for unauthenticated visitors
  if (isPublic(pathname)) return NextResponse.next();

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

  const res = NextResponse.next();

  // Rolling session: if session was issued more than 24h ago, refresh with a new 30-day cookie
  if (auth.authorized && auth.email && auth.iat && Date.now() - auth.iat > 24 * 60 * 60 * 1000) {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const refreshedCookie = await createSessionCookieEdge(auth.email, sessionSecret, isProduction);
      res.headers.set('Set-Cookie', refreshedCookie);
    } catch {
      // Non-fatal if refresh signing fails
    }
  }

  return res;
}

export const config = {
  // Run on every route except _next static files (handled by isPublic above for safety)
  matcher: ['/((?!_next/static|_next/image).*)'],
};
