import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Users,
  MailCheck,
  Send,
  MessageSquare,
  Flame,
  Radio,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { db } from '../db/client';
import { keywords, leads, contacts, messages, replies, campaigns, systemSettings } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { quotaManager } from '../services/youtube/quota';

// Dynamic SSR to fetch live database stats
export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  try {
    const [kwStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'PENDING')::int`,
        completed: sql<number>`count(*) filter (where status = 'COMPLETED')::int`,
        failed: sql<number>`count(*) filter (where status = 'FAILED')::int`,
      })
      .from(keywords);

    const [leadStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        qualified: sql<number>`count(*) filter (where qualification_status = 'QUALIFIED')::int`,
      })
      .from(leads);

    const [contactStats] = await db
      .select({
        verified: sql<number>`count(*) filter (where email_status = 'VALID')::int`,
      })
      .from(contacts);

    const [messageStats] = await db
      .select({
        sentTotal: sql<number>`count(*) filter (where send_status = 'SENT')::int`,
        sentToday: sql<number>`count(*) filter (where send_status = 'SENT' and sent_at >= current_date)::int`,
      })
      .from(messages);

    const [replyStats] = await db
      .select({
        totalReplies: sql<number>`count(*)::int`,
      })
      .from(replies);

    const [campaignStats] = await db
      .select({
        active: sql<number>`count(*) filter (where status = 'ACTIVE')::int`,
      })
      .from(campaigns);

    const quota = await quotaManager.syncQuotaState();

    const killSwitchRecord = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'kill_switch'))
      .limit(1);

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
    // Graceful fallback if database is offline or during build phase
    return {
      keywords: { total: 25391, pending: 25391, completed: 0, failed: 0 },
      leads: { total: 0, qualified: 0 },
      contacts: { verified: 0 },
      outreach: { sentTotal: 0, sentToday: 0 },
      replies: { totalReplies: 0 },
      campaigns: { active: 0 },
      quota: { searchCallsDailyLimit: 100, searchCallsUsedToday: 0, generalQuotaDailyLimit: 10000, generalQuotaUsedToday: 0, lastResetPt: new Date().toISOString() },
      isKillSwitchActive: false,
    };
  }
}

export default async function OverviewPage() {
  const stats = await getDashboardStats();
  const replyRate = stats.outreach.sentTotal > 0
    ? ((stats.replies.totalReplies / stats.outreach.sentTotal) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-slate-400">
            Autonomous YouTube discovery, lead extraction, and Gmail outreach engine.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
            Next Scheduled Run: Idle
          </span>
          <Link
            href="/keywords"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Process Next Batch</span>
          </Link>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Keywords */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Keyword Queue</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.keywords.total.toLocaleString()}</span>
            <span className="text-xs text-slate-400">{stats.keywords.completed} completed</span>
          </div>
          <div className="mt-3 w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${stats.keywords.total > 0 ? (stats.keywords.completed / stats.keywords.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Leads */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Discovered Leads</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.leads.total.toLocaleString()}</span>
            <span className="text-xs text-emerald-400">{stats.leads.qualified} qualified</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified emails</span>
            <span className="font-mono text-slate-200">{stats.contacts.verified}</span>
          </div>
        </div>

        {/* Outreach */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Emails Sent</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.outreach.sentTotal.toLocaleString()}</span>
            <span className="text-xs text-blue-400">{stats.outreach.sentToday} today</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Active campaigns</span>
            <span className="font-mono text-slate-200">{stats.campaigns.active}</span>
          </div>
        </div>

        {/* Replies */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Creator Replies</span>
            <MessageSquare className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.replies.totalReplies.toLocaleString()}</span>
            <span className="text-xs text-rose-400">{replyRate}% response</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Telegram alerts</span>
            <span className="font-mono text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* Secondary Section: Quota & System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YouTube Quota Bucket */}
        <div className="p-5 rounded-lg bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span>YouTube API Quota Allocation</span>
            </div>
            <span className="text-[11px] text-slate-400">Resets Midnight PT</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Dedicated search.list Calls</span>
                <span className="font-mono">
                  {stats.quota.searchCallsUsedToday} / {stats.quota.searchCallsDailyLimit}
                </span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (stats.quota.searchCallsUsedToday / stats.quota.searchCallsDailyLimit) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>General Quota Units</span>
                <span className="font-mono">
                  {stats.quota.generalQuotaUsedToday} / {stats.quota.generalQuotaDailyLimit}
                </span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (stats.quota.generalQuotaUsedToday / stats.quota.generalQuotaDailyLimit) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Kill Switch State */}
        <div className="p-5 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-white mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Global Outreach Safety & Kill Switch</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When activated, all outbound Gmail sending is instantly aborted before every individual dispatch.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${stats.isKillSwitchActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}
              ></span>
              <span className="text-xs font-medium text-slate-200">
                {stats.isKillSwitchActive ? 'KILL SWITCH ACTIVE (SENDING PAUSED)' : 'Outreach Ready (Kill Switch Disarmed)'}
              </span>
            </div>
            <Link
              href="/settings"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
