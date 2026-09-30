import React from 'react';
import Link from 'next/link';
import { db } from '../../db/client';
import { systemSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
  Settings,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Sparkles,
  Database,
  Mail,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  ExternalLink,
  Cpu,
  Activity,
} from 'lucide-react';
import { runHealthCheck } from '../../scripts/healthcheck';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KillSwitchCard } from '@/components/settings/KillSwitchCard';

export const revalidate = 5;

async function getSettingsAndHealth() {
  const health = await runHealthCheck();

  let isKillSwitchActive = false;
  try {
    const record = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'kill_switch'))
      .limit(1);
    if (record.length > 0 && record[0].value) {
      isKillSwitchActive = Boolean((record[0].value as any).enabled);
    }
  } catch (e) {
    // default false
  }

  return { health, isKillSwitchActive };
}

export default async function SettingsPage() {
  const { health, isKillSwitchActive } = await getSettingsAndHealth();

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Settings & System Status
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Safety controls, sending limits, and connection health for all services.
        </p>
      </Card>

      {/* Emergency Kill Switch Banner */}
      <KillSwitchCard initialActive={isKillSwitchActive} />

      {/* System Health Diagnostics */}
      <Card className="p-4 sm:p-5 space-y-4">
        <CardTitle className="text-sm font-semibold text-text-main">
          Connected Services Health
        </CardTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Database */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span>PostgreSQL / Supabase</span>
              </span>
              {health.components.database.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <XCircle className="w-4 h-4 text-danger" />
              )}
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.database.message}
            </p>
          </div>

          {/* YouTube API */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span>YouTube Data API v3</span>
              </span>
              {health.components.youtube.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.youtube.message} ({health.components.youtube.remainingSearches} search calls left)
            </p>
          </div>

          {/* Gemini AI Quota */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Gemini 3.1 Flash-Lite</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                15 RPM Guard
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Daily Quota (RPD):</span>
                <span className="font-mono text-text-main font-semibold">
                  {health.components.gemini.usedToday} / {health.components.gemini.limit}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-300 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    health.components.gemini.usedToday >= health.components.gemini.limit
                      ? 'bg-rose-500'
                      : health.components.gemini.usedToday > health.components.gemini.limit * 0.8
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((health.components.gemini.usedToday / health.components.gemini.limit) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[10px] text-text-muted">
              {health.components.gemini.remainingToday} requests remaining today (resets at 00:00 PST).
            </p>
          </div>

          {/* TypeSafe Jev System One */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>TypeSafe Jev (System One)</span>
              </span>
              {health.components.jev.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Evaluations Today:</span>
              <span className="font-mono text-text-main font-semibold">
                {health.components.jev.callsToday} calls
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Cache Hit Ratio:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {health.components.jev.cacheHitRate}% ({health.components.jev.cacheHitsToday} hits)
              </span>
            </div>
            <p className="text-[10px] text-text-muted">
              1,200 RPM launch quota ($0.042 / 1M input tokens, free output tokens).
            </p>
          </div>

          {/* Workers Freshness & State */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span>Background Workers</span>
              </span>
              {health.components.workers.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : health.components.workers.status === 'STALE' ? (
                <AlertTriangle className="w-4 h-4 text-warning" />
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-300 text-text-muted">IDLE</span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.workers.message}
            </p>
            {health.components.workers.lastActivityAt && (
              <p className="text-[10px] font-mono text-text-muted">
                Last recorded: {new Date(health.components.workers.lastActivityAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Gmail OAuth */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Gmail Inboxes</span>
              </span>
              {health.components.gmail.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.gmail.message}
            </p>
          </div>

          {/* Telegram */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span>Telegram Bot Alert</span>
              </span>
              {health.components.telegram.configured ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.telegram.message}
            </p>
          </div>

          {/* Runtime Mode */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <ShieldCheck className={`w-3.5 h-3.5 ${health.components.mode.dryRun ? 'text-warning' : 'text-primary'}`} />
                <span>{health.components.mode.dryRun ? 'Pipeline Dry-Run' : 'Live Sending Mode'}</span>
              </span>
              <Badge variant={health.components.mode.dryRun ? 'warning' : 'success'} className="text-[10px] font-mono">
                {health.components.mode.dryRun ? 'SIMULATION' : 'LIVE'}
              </Badge>
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.mode.dryRun
                ? 'Emails simulated safely in logs without real dispatch.'
                : 'Real email dispatch enabled. Outbound emails are sent live to creators.'}
            </p>
          </div>
        </div>
      </Card>

      {/* PWA & Public Site Card */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>Public Landing Page & PWA</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              The public marketing landing page is available anytime without disturbing your mobile PWA session.
            </p>
          </div>
          <Link
            href="/?view=landing"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-200 hover:bg-surface-300 text-xs font-medium text-text-main transition-all shrink-0"
          >
            <span>View Landing Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
