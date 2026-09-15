import React from 'react';
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
} from 'lucide-react';
import { runHealthCheck } from '../../scripts/healthcheck';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            System Settings & Diagnostics
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Emergency outreach safety controls, quota allocations, and live infrastructure diagnostics.
        </p>
      </Card>

      {/* Emergency Kill Switch Banner */}
      <Card className="p-5 sm:p-6 bg-surface-100 border-danger/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-danger font-semibold text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>EMERGENCY OUTREACH KILL SWITCH</span>
          </div>
          <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
            When engaged, all outbound Gmail sending is aborted instantly before every individual email dispatch across all campaigns.
            Discovery and lead extraction workers continue safely.
          </p>
        </div>

        <form action="/api/kill-switch" method="POST">
          <input type="hidden" name="enabled" value={isKillSwitchActive ? 'false' : 'true'} />
          <Button
            type="submit"
            variant={isKillSwitchActive ? 'default' : 'destructive'}
            className="w-full sm:w-auto h-10 px-5 text-xs font-semibold"
          >
            {isKillSwitchActive ? 'DISARM KILL SWITCH (RESUME)' : 'STOP ALL OUTREACH'}
          </Button>
        </form>
      </Card>

      {/* System Health Diagnostics */}
      <Card className="p-4 sm:p-5 space-y-4">
        <CardTitle className="text-sm font-semibold text-text-main">
          Infrastructure Diagnostics
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

          {/* Gemini AI */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Gemini Personalizer</span>
              </span>
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.gemini.message}
            </p>
          </div>

          {/* Gmail OAuth */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Gmail OAuth Sender</span>
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
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              {health.components.telegram.message}
            </p>
          </div>

          {/* Runtime Mode */}
          <div className="p-3.5 rounded-lg bg-surface-200 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-warning" />
                <span>Pipeline Dry-Run</span>
              </span>
              <Badge variant="warning" className="text-[10px] font-mono">
                ACTIVE
              </Badge>
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              Emails simulated safely in logs without real dispatch.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
