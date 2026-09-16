import React from 'react';
import { db } from '../../db/client';
import { gmailAccounts } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Mail, Plus, Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { env } from '../../config/env';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  const totalSentToday = accounts.reduce((sum, acc) => sum + (acc.sentToday || 0), 0);
  const totalCapacity = accounts.reduce((sum, acc) => sum + (acc.dailyLimit || 0), 0);
  const activeCount = accounts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Card */}
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

        <div className="w-full sm:w-auto">
          <a
            href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID || 'PENDING'}&redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`}
            className="block w-full sm:w-auto"
          >
            <Button
              size="sm"
              variant="default"
              className="gap-2 w-full sm:w-auto h-11 px-4 text-xs font-semibold active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Connect Gmail Inbox</span>
            </Button>
          </a>
        </div>
      </Card>

      {/* Summary Chips (Mobile & Desktop) */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="p-3 sm:p-3.5 text-center">
            <span className="text-[10px] sm:text-xs text-text-muted block">Inboxes</span>
            <span className="text-base sm:text-lg font-bold font-mono text-text-main">
              {activeCount} <span className="text-[10px] text-emerald-400 font-normal">active</span>
            </span>
          </Card>
          <Card className="p-3 sm:p-3.5 text-center">
            <span className="text-[10px] sm:text-xs text-text-muted block">Sent Today</span>
            <span className="text-base sm:text-lg font-bold font-mono text-primary tabular-nums">
              {totalSentToday}
            </span>
          </Card>
          <Card className="p-3 sm:p-3.5 text-center">
            <span className="text-[10px] sm:text-xs text-text-muted block">Daily Capacity</span>
            <span className="text-base sm:text-lg font-bold font-mono text-text-main tabular-nums">
              {totalCapacity}
            </span>
          </Card>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {accounts.length === 0 ? (
          <Card className="col-span-full p-10 text-center text-xs text-text-muted space-y-3">
            <Mail className="w-8 h-8 text-text-muted mx-auto opacity-40" />
            <p className="font-semibold text-text-secondary text-sm">No Gmail accounts connected yet</p>
            <p className="text-[11px] text-text-muted max-w-sm mx-auto">
              The system is operating in simulated{' '}
              <span className="text-warning font-mono font-semibold">DRY_RUN</span> mode. Connect your first inbox to begin live outreach.
            </p>
          </Card>
        ) : (
          accounts.map((acc) => {
            const todayTarget = gmailSendingService.getTodayEffectiveLimit(acc.id, acc.dailyLimit);
            const remaining = Math.max(0, todayTarget - acc.sentToday);
            const progressPercent = todayTarget > 0 ? Math.min(100, (acc.sentToday / todayTarget) * 100) : 0;
            const letter = (acc.email[0] || 'G').toUpperCase();

            return (
              <Card key={acc.id} className="p-4 sm:p-5 space-y-4 hover:border-primary/40 transition-colors">
                {/* Account Header */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/90 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                      {letter}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-sm font-semibold text-text-main truncate" title={acc.email}>
                        {acc.email}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>OAuth 2.0 Connected</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={acc.status === 'ACTIVE' ? 'success' : 'destructive'}
                    className="shrink-0 text-[10px] font-mono uppercase"
                  >
                    {acc.status}
                  </Badge>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Today's Quota Progress</span>
                    <span className="font-mono tabular-nums font-medium text-text-main">
                      {acc.sentToday} / {todayTarget} emails
                    </span>
                  </div>
                  <Progress value={acc.sentToday} max={todayTarget || 1} className="h-2" />
                </div>

                {/* 3 Metric Chips */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-surface-200 border border-border/60">
                    <span className="text-[10px] text-text-muted block">Sent Today</span>
                    <span className="text-xs font-mono font-bold text-primary tabular-nums">
                      {acc.sentToday}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-200 border border-border/60">
                    <span className="text-[10px] text-text-muted block">Remaining</span>
                    <span className="text-xs font-mono font-bold text-text-main tabular-nums">
                      {remaining}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-200 border border-border/60">
                    <span className="text-[10px] text-text-muted block">Daily Limit</span>
                    <span className="text-xs font-mono font-bold text-text-muted tabular-nums">
                      {acc.dailyLimit}
                    </span>
                  </div>
                </div>

                {/* Footer: Last Dispatch */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last Dispatch</span>
                  </span>
                  <span className="font-mono text-text-secondary">
                    {acc.lastSendAt ? new Date(acc.lastSendAt).toLocaleString() : 'Never'}
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
