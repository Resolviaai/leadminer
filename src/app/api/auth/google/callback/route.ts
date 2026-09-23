import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "../../../../../db/client";
import { gmailAccounts } from "../../../../../db/schema";
import { env } from "../../../../../config/env";
import { eq } from "drizzle-orm";
import { encryptionService } from "@/services/security/encryption.service";
import { parseAndVerifyOAuthState, createSessionCookie, OAUTH_STATE_COOKIE } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  const verification = parseAndVerifyOAuthState(state, cookieState);
  const operatorEmail = verification.email || 'resolviaai@gmail.com';

  // Determine target origin: if origin was provided and valid, use it; otherwise fallback to req.nextUrl.origin
  let targetOrigin = req.nextUrl.origin;
  if (verification.origin) {
    try {
      const parsed = new URL(verification.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        targetOrigin = parsed.origin;
      }
    } catch {
      // fallback
    }
  }

  const makeRedirect = (pathAndQuery: string) => {
    let destinationUrl: URL;
    try {
      destinationUrl = new URL(pathAndQuery, targetOrigin);
    } catch {
      destinationUrl = new URL(pathAndQuery, req.url);
    }

    const res = NextResponse.redirect(destinationUrl.toString(), { status: 302 });

    // Always re-issue the operator session cookie on the redirect response
    // so the operator is NEVER redirected to /login!
    res.headers.append('Set-Cookie', createSessionCookie(operatorEmail));

    // Clear the OAuth state cookie
    const isProd = env.NODE_ENV === 'production';
    res.headers.append(
      'Set-Cookie',
      `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`
    );

    return res;
  };

  if (error) {
    console.error("[OAuth Callback] Google returned error:", error);
    return makeRedirect(`/gmail?error=${encodeURIComponent(error)}`);
  }

  // SEC-03: Strict CSRF protection via cryptographically signed state parameter
  if (!verification.valid) {
    console.error("[OAuth Callback] State verification failed: invalid, tampered, or expired CSRF token");
    return makeRedirect("/gmail?error=invalid_oauth_state");
  }

  if (!code) {
    return makeRedirect("/gmail?error=missing_code");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email address from Gmail profile
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress;

    if (!email) {
      return makeRedirect("/gmail?error=missing_email");
    }

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    const now = new Date();

    // Extract stable Google user ID (sub) from token info if available
    let googleAccountId: string | null = null;
    if (tokens.access_token) {
      try {
        const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);
        googleAccountId = tokenInfo.sub || null;
      } catch (e: any) {
        console.warn('[OAuth Callback] Could not fetch tokenInfo.sub:', e.message);
      }
    }

    // Check if account already exists in database
    const existing = await db
      .select()
      .from(gmailAccounts)
      .where(eq(gmailAccounts.email, email))
      .limit(1);

    const encryptedAccessToken = tokens.access_token ? encryptionService.encrypt(tokens.access_token) : null;
    const encryptedRefreshToken = tokens.refresh_token ? encryptionService.encrypt(tokens.refresh_token) : null;

    if (existing.length > 0) {
      await db
        .update(gmailAccounts)
        .set({
          status: "ACTIVE",
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken || existing[0].refreshToken,
          tokenExpiresAt: expiresAt,
          tokenGrantedAt: now,
          googleAccountId: googleAccountId || existing[0].googleAccountId,
          lastError: null,
          updatedAt: now,
        })
        .where(eq(gmailAccounts.id, existing[0].id));
    } else {
      await db.insert(gmailAccounts).values({
        email,
        status: "ACTIVE",
        dailyLimit: 25,
        sentToday: 0,
        credentialReference: `oauth2:${email}`,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        tokenGrantedAt: now,
        googleAccountId: googleAccountId,
      });
    }

    return makeRedirect(`/gmail?success=connected&email=${encodeURIComponent(email)}`);
  } catch (err: unknown) {
    console.error("[Google OAuth Callback Error]", err);
    const errMessage = err instanceof Error ? err.message : "auth_failed";
    return makeRedirect(`/gmail?error=${encodeURIComponent(errMessage)}`);
  }
}