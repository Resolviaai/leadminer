import React from 'react';
import { db } from '../../db/client';
import { gmailAccounts } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { env } from '../../config/env';
import { GmailAccountsClient, GmailAccountItem } from '@/components/gmail/GmailAccountsClient';

export const dynamic = 'force-dynamic';

async function getGmailAccounts(): Promise<GmailAccountItem[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const records = await db
        .select({
          id: gmailAccounts.id,
          email: gmailAccounts.email,
          status: gmailAccounts.status,
          dailyLimit: gmailAccounts.dailyLimit,
          sentToday: gmailAccounts.sentToday,
          lastSendAt: gmailAccounts.lastSendAt,
          tokenGrantedAt: gmailAccounts.tokenGrantedAt,
          createdAt: gmailAccounts.createdAt,
        })
        .from(gmailAccounts)
        .orderBy(desc(gmailAccounts.id));
      return records as GmailAccountItem[];
    } catch (e) {
      console.error(`[getGmailAccounts attempt ${attempt} error]:`, e);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }
  return [];
}

export default async function GmailAccountsPage() {
  const accounts = await getGmailAccounts();

  return (
    <GmailAccountsClient
      initialAccounts={accounts}
      googleClientId={env.GOOGLE_CLIENT_ID}
      googleRedirectUri={env.GOOGLE_REDIRECT_URI}
    />
  );
}
