'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Settings2,
  Database,
  Send,
  FileCheck,
  ChevronDown,
} from 'lucide-react';
import {
  OverviewDashboardData,
} from '@/services/analytics/overview-analytics.service';

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

  const { funnel, system, quota, outreach, dataQuality } = data;

  const DRAWERS = [
    {
      key: 'pipeline' as const,
      icon: <BarChart3 className="w-4 h-4 text-[#F06536]" />,
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
      {/* 5 Drawers Row matching Image 1 & 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {DRAWERS.map((d) => {
          const isOpen = openDrawer === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDrawer(d.key)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
                isOpen
                  ? 'bg-[#21262D] border-[#F06536]/70 shadow-md'
                  : 'bg-[#161B22] border-[#30363D] hover:bg-[#1C2128] hover:border-[#8B949E]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="p-1.5 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  {d.icon}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8B949E] transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#F06536]' : ''
                  }`}
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-[#F0F6FC] block truncate">
                  {d.title}
                </span>
                <span className="text-[11px] text-[#8B949E] block truncate mt-0.5">
                  {d.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Drawer Details View */}
      {openDrawer && (
        <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Drawer 1: Pipeline Details */}
          {openDrawer === 'pipeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363D]/60 text-xs">
                <span className="font-semibold text-[#F0F6FC]">
                  Granular Stage Audit (All 11 Pipeline Gates)
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  Overall Conversion: {funnel.overallConversionRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {funnel.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-2.5 rounded-lg bg-[#0D1117] border border-[#30363D]"
                  >
                    <span className="text-[10px] text-[#8B949E] block truncate font-mono uppercase">
                      {stage.name}
                    </span>
                    <div className="text-sm font-bold font-mono text-[#F0F6FC] tabular-nums mt-0.5">
                      {stage.count.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-[#8B949E] font-mono block mt-0.5">
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
              <div className="flex items-center justify-between pb-2 border-b border-[#30363D]/60 text-xs">
                <span className="font-semibold text-[#F0F6FC]">
                  Background Cron Worker Runtimes & Errors
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  Success Rate: {system.successRate}% · Avg Duration: {system.avgDurationSeconds}s
                </span>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#30363D]/60 text-[11px] font-mono uppercase text-[#8B949E]">
                      <th className="pb-2 font-medium">Worker Type</th>
                      <th className="pb-2 font-medium text-right">Runs Executed</th>
                      <th className="pb-2 font-medium text-right">Completed</th>
                      <th className="pb-2 font-medium text-right">Failed</th>
                      <th className="pb-2 font-medium text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363D]/40 font-mono">
                    {system.jobsByType.map((job) => {
                      const successPct =
                        job.total > 0 ? Math.round((job.completed / job.total) * 100) : 100;
                      return (
                        <tr key={job.jobType} className="hover:bg-[#1C2128]">
                          <td className="py-2 font-semibold text-[#F0F6FC]">{job.jobType}</td>
                          <td className="py-2 text-right text-[#8B949E] tabular-nums">
                            {job.total.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-[#3FB950] tabular-nums">
                            {job.completed.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-[#F85149] tabular-nums">
                            {job.failed.toLocaleString()}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                successPct === 100
                                  ? 'bg-[#152B1E] text-[#3FB950] border border-[#238636]/30'
                                  : 'bg-[#2A1D17] text-[#F59E0B] border border-[#D29922]/30'
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
              <div className="flex items-center justify-between pb-2 border-b border-[#30363D]/60 text-xs">
                <span className="font-semibold text-[#F0F6FC]">
                  API Quota Allocation & Key Rotation
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  Resets in {quota.resetsInHours}h at Midnight Pacific Time
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Search Calls</span>
                  <span className="text-base font-bold text-[#F0F6FC] tabular-nums">
                    {quota.searchCallsUsedToday} / {quota.searchCallsDailyLimit}
                  </span>
                  <span className="text-[10px] text-[#F06536] block mt-0.5">
                    {quota.searchCallsPercentage}% used
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">General Units</span>
                  <span className="text-base font-bold text-[#F0F6FC] tabular-nums">
                    {quota.generalQuotaUsedToday.toLocaleString()} / {quota.generalQuotaDailyLimit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    {quota.generalQuotaPercentage}% used
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Rotating API Keys</span>
                  <span className="text-base font-bold text-[#3FB950] tabular-nums">
                    {quota.availableKeysCount} Active Key(s)
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Automated rotation
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Kill Switch</span>
                  <span
                    className={`text-base font-bold tabular-nums ${
                      quota.isKillSwitchActive ? 'text-[#F85149]' : 'text-[#3FB950]'
                    }`}
                  >
                    {quota.isKillSwitchActive ? 'ENGAGED' : 'ARMED (SAFE)'}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Hardware block state
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Drawer 4: Outreach Details */}
          {openDrawer === 'outreach' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363D]/60 text-xs">
                <span className="font-semibold text-[#F0F6FC]">
                  Outreach Dispatch & Deliverability Telemetry
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  {outreach.replyRate}% Total Reply Rate
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Sent in Period</span>
                  <span className="text-base font-bold text-[#F0F6FC] tabular-nums">
                    {outreach.sentInPeriod.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    {outreach.sentTotalAllTime.toLocaleString()} all-time
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Direct Replies</span>
                  <span className="text-base font-bold text-[#BC8CFF] tabular-nums">
                    {outreach.totalRepliesInPeriod.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Creator inbound responses
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Connected Inboxes</span>
                  <span className="text-base font-bold text-[#3FB950] tabular-nums">
                    {outreach.activeAccountsCount} Active
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    of {outreach.totalAccountsCount} total accounts
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Pending Scheduled</span>
                  <span className="text-base font-bold text-[#388BFD] tabular-nums">
                    {outreach.pendingScheduled.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Awaiting dispatch window
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Drawer 5: Data Quality Details */}
          {openDrawer === 'quality' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363D]/60 text-xs">
                <span className="font-semibold text-[#F0F6FC]">
                  Data Quality, Deduplication & Suppression Guards
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  Enrichment Rate: {dataQuality.enrichmentRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Duplicates Removed</span>
                  <span className="text-base font-bold text-[#F0F6FC] tabular-nums">
                    {dataQuality.duplicatesRemoved.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    {dataQuality.duplicateRate}% deduplication
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Videos Tracked</span>
                  <span className="text-base font-bold text-[#F0F6FC] tabular-nums">
                    {dataQuality.totalVideosTracked.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Metadata indexed
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Aggregate Views</span>
                  <span className="text-base font-bold text-[#F0F6FC] tabular-nums">
                    {dataQuality.totalViewsTracked.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Audience footprint
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <span className="text-[10px] text-[#8B949E] uppercase block">Suppression Guard</span>
                  <span className="text-base font-bold text-[#F85149] tabular-nums">
                    {dataQuality.suppressedCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#8B949E] block mt-0.5">
                    Opt-out / unsubscribed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
