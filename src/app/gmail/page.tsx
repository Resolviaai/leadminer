import React from 'react';
import { db } from '../../db/client';
import { gmailAccounts } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Mail, Plus } from 'lucide-react';
import { env } from '../../config/env';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { gmailSendingService } from '../../services/outreach/gmail.service';

export const revalidate = 5;

async function getGmailAccounts() {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await db.select().from(gmailAccounts).orderBy(desc(gmailAccounts.id));
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
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Connected Gmail Inboxes
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage sending accounts, daily quotas, rotation health, and Google OAuth credentials.
          </p>
        </div>

        <div>
          <a
            href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID || 'PENDING'}&redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`}
          >
            <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Gmail Inbox</span>
            </Button>
          </a>
        </div>
      </Card>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-xs text-text-muted">
            No Gmail accounts connected yet. The system is operating in simulated{' '}
            <span className="text-warning font-mono font-semibold">DRY_RUN</span> mode.
          </Card>
        ) : (
          accounts.map((acc) => (
            <Card key={acc.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-text-main">{acc.email}</h2>
                </div>
                <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'destructive'}>
                  {acc.status}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-surface-200 border border-border space-y-2 text-xs text-text-secondary">
                {(() => {
                  const todayTarget = gmailSendingService.getTodayEffectiveLimit(acc.id, acc.dailyLimit);
                  const remaining = Math.max(0, todayTarget - acc.sentToday);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Today's Target (Randomized)</span>
                        <span className="font-mono text-text-main">
                          {todayTarget} emails <span className="text-text-muted text-[10px]">(max: {acc.dailyLimit})</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Sent Today</span>
                        <span className="font-mono text-text-main">{acc.sentToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Remaining Today</span>
                        <span className="font-mono text-primary font-medium">{remaining}</span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between pt-1 border-t border-border/50">
                  <span className="text-text-muted">Last Dispatch</span>
                  <span className="text-text-main">
                    {acc.lastSendAt ? new Date(acc.lastSendAt).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
