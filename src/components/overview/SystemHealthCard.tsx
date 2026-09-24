'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { SystemHealthAnalytics } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SystemHealthCardProps {
  system: SystemHealthAnalytics;
}

export function SystemHealthCard({ system }: SystemHealthCardProps) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-text-main">
              Background Operations & Worker Health
            </CardTitle>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${
              system.failedJobs === 0
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                : 'text-amber-400 bg-amber-950/40 border-amber-800/40'
            }`}
          >
            {system.successRate}% Job Success
          </span>
        </CardHeader>

        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          Telemetry across discovery, enrichment, verification, and dispatch cron workers.
        </p>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="p-2 rounded-lg bg-surface-200/50 border border-studio-border-subtle">
            <span className="text-[10px] text-text-muted uppercase block">Total Jobs</span>
            <span className="text-sm sm:text-base font-bold font-mono text-text-main tabular-nums">
              {system.totalJobsInPeriod.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-surface-200/50 border border-studio-border-subtle">
            <span className="text-[10px] text-text-muted uppercase block">Avg Duration</span>
            <span className="text-sm sm:text-base font-bold font-mono text-sky-400 tabular-nums">
              {system.avgDurationSeconds}s
            </span>
          </div>

          <div className="p-2 rounded-lg bg-surface-200/50 border border-studio-border-subtle">
            <span className="text-[10px] text-text-muted uppercase block">Failures</span>
            <span
              className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                system.failedJobs > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {system.failedJobs}
            </span>
          </div>
        </div>

        {/* Incident / Error Feed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-text-secondary mb-1">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-text-muted" />
              <span>Recent Operational Errors & Alerts</span>
            </span>
            <span className="text-text-muted font-mono">{system.recentErrors.length} logged</span>
          </div>

          {system.recentErrors.length === 0 ? (
            <div className="p-3 rounded-lg bg-surface-200/30 border border-studio-border-subtle flex items-center gap-2 text-xs text-emerald-400/90">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero critical error events recorded in selected timeframe. System fully healthy.</span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {system.recentErrors.map((err) => {
                const dateStr = new Date(err.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={err.id}
                    className="p-2 rounded bg-surface-200/70 border border-studio-border-subtle text-[11px] font-mono flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold truncate">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{err.eventType}</span>
                      </div>
                      <p className="text-text-secondary text-[10px] truncate mt-0.5">
                        {err.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-text-muted shrink-0">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs">
        <Link
          href="/jobs"
          className="text-primary hover:text-brand-hover font-semibold inline-flex items-center gap-1 min-h-[36px]"
        >
          <span>Job Queue</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/logs"
          className="text-text-secondary hover:text-text-main font-semibold inline-flex items-center gap-1 min-h-[36px]"
        >
          <span>Full Activity Logs</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}
