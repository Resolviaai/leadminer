'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Settings2,
  Database,
  Send,
  FileCheck,
  ChevronDown,
  Activity,
  Layers,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import {
  OverviewDashboardData,
} from '@/services/analytics/overview-analytics.service';
import { Card } from '@/components/ui/card';

interface ProgressiveDisclosureSectionsProps {
  data: OverviewDashboardData;
}

type DrawerKey = 'pipeline' | 'system' | 'quota' | 'outreach' | 'quality' | null;

export function ProgressiveDisclosureSections({ data }: ProgressiveDisclosureSectionsProps) {
  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDrawer = (key: DrawerKey) => {
    setOpenDrawer((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDrawer(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenDrawer(null);
      }
    }

    if (openDrawer !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDrawer]);

  const { funnel, system, quota, outreach, dataQuality, verification } = data;

  const DRAWERS = [
    {
      key: 'pipeline' as const,
      icon: <BarChart3 className="w-4 h-4 text-primary" />,
      title: 'Pipeline Details',
      subtitle: 'Detailed breakdown of each stage',
    },
    {
      key: 'system' as const,
      icon: <Settings2 className="w-4 h-4 text-[#388BFD]" />,
      title: 'System Details',
      subtitle: 'Jobs, errors, processing time',
    },
    {
      key: 'quota' as const,
      icon: <Database className="w-4 h-4 text-[#F59E0B]" />,
      title: 'API / Quota Details',
      subtitle: 'Usage, limits and reset information',
    },
    {
      key: 'outreach' as const,
      icon: <Send className="w-4 h-4 text-[#58A6FF]" />,
      title: 'Outreach Details',
      subtitle: 'Eligible, sent, failed, replies',
    },
    {
      key: 'quality' as const,
      icon: <FileCheck className="w-4 h-4 text-[#2EA043]" />,
      title: 'Data Quality Details',
      subtitle: 'Duplicates, skipped, missing data',
    },
  ];

  return (
    <div ref={containerRef} className="space-y-3">
      {/* 5 Drawers Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {DRAWERS.map((d) => {
          const isOpen = openDrawer === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDrawer(d.key)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
                isOpen
                  ? 'bg-surface-200 border-primary/50 shadow-md'
                  : 'bg-surface-100 border-border hover:bg-surface-200/50 hover:border-studio-border-strong'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="p-1 rounded bg-surface-200/80 border border-studio-border-subtle">
                  {d.icon}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-text-main block truncate">
                  {d.title}
                </span>
                <span className="text-[10px] text-text-muted block truncate mt-0.5">
                  {d.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Drawer Details View */}
      {openDrawer && (
        <Card className="p-4 sm:p-5 border border-studio-border-strong bg-surface-100 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Drawer 1: Pipeline Details */}
          {openDrawer === 'pipeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-semibold text-text-main">
                  Granular Stage Audit (All 11 Pipeline Gates)
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  Overall Conversion: {funnel.overallConversionRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {funnel.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-2.5 rounded-lg bg-surface-200/60 border border-studio-border-subtle"
                  >
                    <span className="text-[10px] text-text-muted block truncate font-mono uppercase">
                      {stage.name}
                    </span>
                    <div className="text-sm font-bold font-mono text-text-main tabular-nums mt-0.5">
                      {stage.count.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-text-secondary font-mono block mt-0.5">
                      {stage.conversionFromPrev !== null ? `${stage.conversionFromPrev}% conv` : '100%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawer 2: System Details */}
          {openDrawer === 'system' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-semibold text-text-main">
                  Background Cron Worker Runtimes & Errors
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  Success Rate: {system.successRate}% · Avg Duration: {system.avgDurationSeconds}s
                </span>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-mono uppercase text-text-muted">
                      <th className="pb-2 font-medium">Worker Type</th>
                      <th className="pb-2 font-medium text-right">Runs Executed</th>
                      <th className="pb-2 font-medium text-right">Completed</th>
                      <th className="pb-2 font-medium text-right">Failed</th>
                      <th className="pb-2 font-medium text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-mono">
                    {system.jobsByType.map((job) => {
                      const successPct =
                        job.total > 0 ? Math.round((job.completed / job.total) * 100) : 100;
                      return (
                        <tr key={job.jobType} className="hover:bg-surface-200/40">
                          <td className="py-2 font-semibold text-text-main">{job.jobType}</td>
                          <td className="py-2 text-right text-text-secondary tabular-nums">
                            {job.total.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-emerald-400 tabular-nums">
                            {job.completed.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-rose-400 tabular-nums">
                            {job.failed.toLocaleString()}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                successPct === 100
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                                  : 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                              }`}
                            >
                              {successPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drawer 3: API / Quota Details */}
          {openDrawer === 'quota' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-semibold text-text-main">
                  API Quota Allocation & Key Rotation
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  Resets in {quota.resetsInHours}h at Midnight Pacific Time
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Search Calls</span>
                  <span className="text-base font-bold text-text-main tabular-nums">
                    {quota.searchCallsUsedToday} / {quota.searchCallsDailyLimit}
                  </span>
                  <span className="text-[10px] text-primary block mt-0.5">
                    {quota.searchCallsPercentage}% used
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">General Units</span>
                  <span className="text-base font-bold text-text-main tabular-nums">
                    {quota.generalQuotaUsedToday.toLocaleString()} / {quota.generalQuotaDailyLimit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">
                    {quota.generalQuotaPercentage}% used
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Rotating API Keys</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">
                    {quota.availableKeysCount} Active Key(s)
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Automated rotation
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Kill Switch</span>
                  <span
                    className={`text-base font-bold tabular-nums ${
                      quota.isKillSwitchActive ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {quota.isKillSwitchActive ? 'ENGAGED' : 'ARMED (SAFE)'}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Hardware block state
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Drawer 4: Outreach Details */}
          {openDrawer === 'outreach' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-semibold text-text-main">
                  Outreach Dispatch & Deliverability Telemetry
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  {outreach.replyRate}% Total Reply Rate
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Sent in Period</span>
                  <span className="text-base font-bold text-text-main tabular-nums">
                    {outreach.sentInPeriod.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {outreach.sentTotalAllTime.toLocaleString()} all-time
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Direct Replies</span>
                  <span className="text-base font-bold text-violet-400 tabular-nums">
                    {outreach.totalRepliesInPeriod.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Creator inbound responses
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Connected Inboxes</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">
                    {outreach.activeAccountsCount} Active
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    of {outreach.totalAccountsCount} total accounts
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Pending Scheduled</span>
                  <span className="text-base font-bold text-sky-400 tabular-nums">
                    {outreach.pendingScheduled.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Awaiting dispatch window
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Drawer 5: Data Quality Details */}
          {openDrawer === 'quality' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-semibold text-text-main">
                  Data Quality, Deduplication & Suppression Guards
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  Enrichment Rate: {dataQuality.enrichmentRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Duplicates Removed</span>
                  <span className="text-base font-bold text-text-main tabular-nums">
                    {dataQuality.duplicatesRemoved.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {dataQuality.duplicateRate}% deduplication
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Videos Tracked</span>
                  <span className="text-base font-bold text-text-main tabular-nums">
                    {dataQuality.totalVideosTracked.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Metadata indexed
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Aggregate Views</span>
                  <span className="text-base font-bold text-text-main tabular-nums">
                    {dataQuality.totalViewsTracked.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Audience footprint
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-200/60 border border-studio-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase block">Suppression Guard</span>
                  <span className="text-base font-bold text-rose-400 tabular-nums">
                    {dataQuality.suppressedCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Opt-out / unsubscribed
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
