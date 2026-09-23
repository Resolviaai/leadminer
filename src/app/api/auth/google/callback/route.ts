import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "../../../../../db/client";
import { gmailAccounts } from "../../../../../db/schema";
import { env } from "../../../../../config/env";
import { eq } from "drizzle-orm";
import { encryptionService } from "@/services/security/encryption.service";
import { verifyOAuthState, OAUTH_STATE_COOKIE } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/gmail?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  const state = searchParams.get("state");
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // SEC-03: Strict CSRF protection via cryptographically signed state parameter
  if (!verifyOAuthState(state, cookieState)) {
    console.error("[OAuth Callback] State verification failed: invalid or missing CSRF token");
    return NextResponse.redirect(
      new URL("/gmail?error=invalid_oauth_state", req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/gmail?error=missing_code", req.url));
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
      return NextResponse.redirect(
        new URL("/gmail?error=missing_email", req.url)
      );
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

    const res = NextResponse.redirect(new URL("/gmail?success=connected", req.url));
    res.headers.set(
      "Set-Cookie",
      `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    return res;
  } catch (err: unknown) {
    console.error("[Google OAuth Callback Error]", err);
    return NextResponse.redirect(
      new URL(
        `/gmail?error=${encodeURIComponent(
          err instanceof Error ? err.message : "auth_failed"
        )}`,
        req.url
      )
    );
  }
}