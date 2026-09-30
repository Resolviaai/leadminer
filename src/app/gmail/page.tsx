import React from 'react';
import { db } from '../../db/client';
import { gmailAccounts } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { env } from '../../config/env';
import { GmailAccountsClient, GmailAccountItem } from '@/components/gmail/GmailAccountsClient';
import { warmupService } from '../../services/outreach/warmup.service';

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
          googleAccountId: gmailAccounts.googleAccountId,
          createdAt: gmailAccounts.createdAt,
        })
        .from(gmailAccounts)
        .orderBy(desc(gmailAccounts.id));

      const enriched: GmailAccountItem[] = await Promise.all(
        records.map(async (acc) => {
          let warmup;
          try {
            warmup = await warmupService.getAccountWarmupStatus(acc.id, acc.googleAccountId, acc.dailyLimit);
          } catch {
            warmup = undefined;
          }
          return {
            id: acc.id,
            email: acc.email,
            status: acc.status,
            dailyLimit: acc.dailyLimit,
            sentToday: acc.sentToday,
            lastSendAt: acc.lastSendAt,
            tokenGrantedAt: acc.tokenGrantedAt,
            createdAt: acc.createdAt,
            warmup,
          };
        })
      );

      return enriched;
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
    <React.Suspense fallback={<div className="p-6 text-sm text-text-muted">Loading connected inboxes...</div>}>
      <GmailAccountsClient
        initialAccounts={accounts}
        googleClientId={env.GOOGLE_CLIENT_ID}
        googleRedirectUri={env.GOOGLE_REDIRECT_URI}
      />
    </React.Suspense>
  );
}
