import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Users,
  Send,
  MessageSquare,
  Radio,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../db/client';
import { keywords, leads, contacts, messages, replies, campaigns, systemSettings } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { quotaManager } from '../../services/youtube/quota';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const revalidate = 5;

async function getDashboardStats() {
  try {
    // All DB queries in parallel — eliminates sequential waterfall
    const [
      [kwStats],
      [leadStats],
      [contactStats],
      [messageStats],
      [replyStats],
      [campaignStats],
      quota,
      killSwitchRecord,
    ] = await Promise.all([
      db.select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'PENDING')::int`,
        completed: sql<number>`count(*) filter (where status = 'COMPLETED')::int`,
        failed: sql<number>`count(*) filter (where status = 'FAILED')::int`,
      }).from(keywords),

      db.select({
        total: sql<number>`count(*)::int`,
        qualified: sql<number>`count(*) filter (where qualification_status = 'QUALIFIED')::int`,
      }).from(leads),

      db.select({
        verified: sql<number>`count(*) filter (where email_status = 'VALID')::int`,
      }).from(contacts),

      db.select({
        sentTotal: sql<number>`count(*) filter (where send_status = 'SENT')::int`,
        sentToday: sql<number>`count(*) filter (where send_status = 'SENT' and sent_at >= current_date)::int`,
      }).from(messages),

      db.select({
        totalReplies: sql<number>`count(*)::int`,
      }).from(replies),

      db.select({
        active: sql<number>`count(*) filter (where status = 'ACTIVE')::int`,
      }).from(campaigns),

      quotaManager.syncQuotaState(),

      db.select().from(systemSettings).where(eq(systemSettings.key, 'kill_switch')).limit(1),
    ]);

    const isKillSwitchActive = Boolean((killSwitchRecord[0]?.value as any)?.enabled);

    return {
      keywords: kwStats || { total: 0, pending: 0, completed: 0, failed: 0 },
      leads: leadStats || { total: 0, qualified: 0 },
      contacts: contactStats || { verified: 0 },
      outreach: messageStats || { sentTotal: 0, sentToday: 0 },
      replies: replyStats || { totalReplies: 0 },
      campaigns: campaignStats || { active: 0 },
      quota,
      isKillSwitchActive,
      dbError: false,
      dbErrorMessage: null as string | null,
    };
  } catch (e: any) {
    return {
      keywords: { total: 0, pending: 0, completed: 0, failed: 0 },
      leads: { total: 0, qualified: 0 },
      contacts: { verified: 0 },
      outreach: { sentTotal: 0, sentToday: 0 },
      replies: { totalReplies: 0 },
      campaigns: { active: 0 },
      quota: {
        searchCallsDailyLimit: 100,
        searchCallsUsedToday: 0,
        generalQuotaDailyLimit: 10000,
        generalQuotaUsedToday: 0,
        lastResetPt: new Date().toISOString(),
      },
      isKillSwitchActive: false,
      dbError: true,
      dbErrorMessage: e?.message || 'Database connection error',
    };
  }
}

export default async function OverviewPage() {
  const stats = await getDashboardStats();
  const replyRate =
    stats.outreach.sentTotal > 0
      ? ((stats.replies.totalReplies / stats.outreach.sentTotal) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {stats.dbError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-sm text-red-200">Database Connection Degraded or Offline</div>
            <p className="text-red-300/80">
              LeadMiner could not establish a connection to PostgreSQL ({stats.dbErrorMessage || 'Connection refused or timeout'}).
              Metrics shown below are cached zero fallbacks and do not reflect current production state.
            </p>
          </div>
        </div>
      )}

      {/* Grid: 4 Metric Cards (2x2 on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Keywords */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="p-3 pb-1.5 sm:p-4 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase tracking-wider truncate">
              Keyword Queue
            </CardTitle>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 space-y-2 sm:space-y-2.5">
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold text-text-main tracking-tight font-mono tabular-nums">
                {stats.keywords.total.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-text-secondary font-mono tabular-nums">
                {stats.keywords.completed.toLocaleString()} done
              </span>
            </div>
            <Progress value={stats.keywords.completed} max={stats.keywords.total || 1} className="h-1.5 sm:h-2" />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-text-muted pt-0.5">
              <span>Pending</span>
              <span className="font-mono tabular-nums text-text-secondary">{stats.keywords.pending.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="p-3 pb-1.5 sm:p-4 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase tracking-wider truncate">
              Discovered Leads
            </CardTitle>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 space-y-2 sm:space-y-2.5">
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold text-text-main tracking-tight font-mono tabular-nums">
                {stats.leads.total.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-mono tabular-nums font-medium">
                {stats.leads.qualified} qualified
              </span>
            </div>
            <Progress value={stats.leads.qualified} max={stats.leads.total || 1} className="h-1.5 sm:h-2" />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-text-muted pt-0.5">
              <span>Verified emails</span>
              <span className="font-mono tabular-nums text-text-main font-semibold">{stats.contacts.verified}</span>
            </div>
          </CardContent>
        </Card>

        {/* Outreach */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="p-3 pb-1.5 sm:p-4 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase tracking-wider truncate">
              Outreach Sent
            </CardTitle>
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 space-y-2 sm:space-y-2.5">
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold text-text-main tracking-tight font-mono tabular-nums">
                {stats.outreach.sentTotal.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-primary font-mono font-medium tabular-nums">
                {stats.outreach.sentToday} today
              </span>
            </div>
            <Progress
              value={stats.outreach.sentTotal}
              max={Math.max(1, stats.outreach.sentTotal)}
              className="h-1.5 sm:h-2"
            />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-text-muted pt-0.5">
              <span>Active campaigns</span>
              <span className="font-mono tabular-nums text-text-secondary">{stats.campaigns.active}</span>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="p-3 pb-1.5 sm:p-4 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase tracking-wider truncate">
              Creator Replies
            </CardTitle>
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 space-y-2 sm:space-y-2.5">
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold text-text-main tracking-tight font-mono tabular-nums">
                {stats.replies.totalReplies.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs text-warning font-mono font-medium tabular-nums">
                {replyRate}% rate
              </span>
            </div>
            <Progress
              value={parseFloat(replyRate)}
              max={20}
              className="h-1.5 sm:h-2"
              indicatorClassName="bg-warning"
            />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-text-muted pt-0.5">
              <span>Inbox status</span>
              <span className={`font-mono font-medium ${stats.dbError ? 'text-red-400' : 'text-primary'}`}>
                {stats.dbError ? 'Degraded / Error' : 'Active'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Section: Quota & System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YouTube Quota Bucket */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-text-main">
              <Radio className="w-4 h-4 text-primary" />
              <span>YouTube API Quota Allocation</span>
            </div>
            <span className="text-[11px] text-text-muted">Resets Midnight PT</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                <span>Dedicated search.list Calls</span>
                <span className="font-mono text-text-main font-medium">
                  {stats.quota.searchCallsUsedToday} / {stats.quota.searchCallsDailyLimit}
                </span>
              </div>
              <Progress
                value={stats.quota.searchCallsUsedToday}
                max={stats.quota.searchCallsDailyLimit}
                indicatorClassName="bg-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                <span>General Quota Units</span>
                <span className="font-mono text-text-main font-medium">
                  {stats.quota.generalQuotaUsedToday} / {stats.quota.generalQuotaDailyLimit}
                </span>
              </div>
              <Progress
                value={stats.quota.generalQuotaUsedToday}
                max={stats.quota.generalQuotaDailyLimit}
                indicatorClassName="bg-primary"
              />
            </div>
          </div>
        </Card>

        {/* Global Kill Switch State */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-text-main">
              <ShieldAlert className={`w-4 h-4 ${stats.isKillSwitchActive ? 'text-danger' : 'text-primary'}`} />
              <span>Outreach Safety & Kill-Switch</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Real-time hardware kill switch. When engaged, all outbound email dispatching stops instantly across all workers.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  stats.isKillSwitchActive ? 'bg-danger animate-ping' : 'bg-primary'
                }`}
              />
              <span className="text-xs font-medium text-text-main">
                {stats.isKillSwitchActive
                  ? 'KILL SWITCH ENGAGED (DISPATCH BLOCKED)'
                  : 'Outreach Armed (Safe Mode)'}
              </span>
            </div>
            <Link
              href="/settings"
              className="text-xs text-primary hover:text-brand-hover font-semibold flex items-center space-x-1 min-h-[44px] min-w-[44px] px-2 -mr-2 justify-end active:scale-95 transition-transform"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
