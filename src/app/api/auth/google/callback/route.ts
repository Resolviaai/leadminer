import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "../../../../../db/client";
import { gmailAccounts } from "../../../../../db/schema";
import { env } from "../../../../../config/env";
import { eq } from "drizzle-orm";

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

    // Check if account already exists in database
    const existing = await db
      .select()
      .from(gmailAccounts)
      .where(eq(gmailAccounts.email, email))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(gmailAccounts)
        .set({
          status: "ACTIVE",
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || existing[0].refreshToken,
          tokenExpiresAt: expiresAt,
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(gmailAccounts.id, existing[0].id));
    } else {
      await db.insert(gmailAccounts).values({
        email,
        status: "ACTIVE",
        dailyLimit: 25,
        sentToday: 0,
        credentialReference: `oauth2:${email}`,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: expiresAt,
      });
    }

    return NextResponse.redirect(new URL("/gmail?success=connected", req.url));
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