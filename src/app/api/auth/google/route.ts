import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';
import { verifyDashboardAuth, generateOAuthState } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Only authenticated dashboard users can initiate connecting a Gmail account
  const auth = verifyDashboardAuth(req);
  if (!auth.authorized) {
    return NextResponse.redirect(new URL('/login?redirect=/gmail', req.url));
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL('/gmail?error=' + encodeURIComponent('Google OAuth is not configured on the server.'), req.url)
    );
  }

  // Generate cryptographically secure signed state parameter and cookie
  const email = auth.email || 'resolviaai@gmail.com';
  const origin = req.nextUrl.origin;
  const { state, cookieHeader } = generateOAuthState(email, origin);

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set(
    'scope',
    'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
  );
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');
  googleAuthUrl.searchParams.set('state', state);

  const res = NextResponse.redirect(googleAuthUrl.toString(), { status: 302 });
  res.headers.set('Set-Cookie', cookieHeader);
  return res;
}
