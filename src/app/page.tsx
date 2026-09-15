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
} from 'lucide-react';
import { db } from '../db/client';
import { keywords, leads, contacts, messages, replies, campaigns, systemSettings } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { quotaManager } from '../services/youtube/quota';
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
    };
  } catch (e) {
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
    };
  }
}

export default async function OverviewPage() {
  const stats = await getDashboardStats();
  const replyRate =
    stats.outreach.sentTotal > 0
      ? ((stats.replies.totalReplies / stats.outreach.sentTotal) * 100).toFixed(1)
      : '0.0';

  const kwPercent = stats.keywords.total > 0
    ? (stats.keywords.completed / stats.keywords.total) * 100
    : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Keywords */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Keyword Queue
            </CardTitle>
            <Layers className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-main tracking-tight font-mono">
                {stats.keywords.total.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary font-mono">
                {stats.keywords.completed.toLocaleString()} done
              </span>
            </div>
            <Progress value={stats.keywords.completed} max={stats.keywords.total || 1} />
            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span>Pending</span>
              <span className="font-mono text-text-secondary">{stats.keywords.pending.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Discovered Leads
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-main tracking-tight font-mono">
                {stats.leads.total.toLocaleString()}
              </span>
              <Badge variant="success" className="text-[10px]">
                {stats.leads.qualified} qualified
              </Badge>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-200 border border-border/40 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${stats.leads.total > 0 ? (stats.leads.qualified / stats.leads.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span>Verified emails</span>
              <span className="font-mono text-text-main font-semibold">{stats.contacts.verified}</span>
            </div>
          </CardContent>
        </Card>

        {/* Outreach */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Outreach Sent
            </CardTitle>
            <Send className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-main tracking-tight font-mono">
                {stats.outreach.sentTotal.toLocaleString()}
              </span>
              <span className="text-xs text-primary font-mono font-medium">
                {stats.outreach.sentToday} today
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-200 border border-border/40 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(100, stats.outreach.sentTotal > 0 ? 100 : 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span>Active campaigns</span>
              <span className="font-mono text-text-secondary">{stats.campaigns.active}</span>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Creator Replies
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-main tracking-tight font-mono">
                {stats.replies.totalReplies.toLocaleString()}
              </span>
              <span className="text-xs text-warning font-mono font-medium">
                {replyRate}% rate
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-200 border border-border/40 overflow-hidden">
              <div
                className="h-full bg-warning rounded-full"
                style={{ width: `${Math.min(100, parseFloat(replyRate) * 5)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span>Status</span>
              <span className="font-mono text-primary font-medium">Monitoring</span>
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
              className="text-xs text-primary hover:text-brand-hover font-medium flex items-center space-x-1"
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
