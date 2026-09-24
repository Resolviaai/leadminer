'use client';

import React, { useState, useTransition } from 'react';
import {
  Calendar,
  RefreshCw,
  ChevronDown,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  OverviewDashboardData,
  TimeRangeOption,
} from '@/services/analytics/overview-analytics.service';
import { TopKpiCards } from './TopKpiCards';
import { FunnelVisualization } from './FunnelVisualization';
import { DailyTrendChart } from './DailyTrendChart';
import { SystemStatusCard } from './SystemStatusCard';
import { ApiUsageCard } from './ApiUsageCard';
import { InsightsAnomalies } from './InsightsAnomalies';
import { VerificationBreakdownCard } from './VerificationBreakdownCard';
import { OutreachPerformanceCard } from './OutreachPerformanceCard';
import { ContentSourcesCard } from './ContentSourcesCard';
import { ProgressiveDisclosureSections } from './ProgressiveDisclosureSections';

interface OverviewDashboardClientProps {
  initialData: OverviewDashboardData;
}

const RANGE_OPTIONS: Array<{ key: TimeRangeOption; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: '3d', label: '3D' },
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
  { key: 'custom', label: 'Custom' },
];

export function OverviewDashboardClient({ initialData }: OverviewDashboardClientProps) {
  const [data, setData] = useState<OverviewDashboardData>(initialData);
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>(
    initialData.timeRange.selected || '7d'
  );
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom date picker states
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState<string>(
    initialData.timeRange.start.slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState<string>(
    initialData.timeRange.end.slice(0, 10)
  );

  const fetchAnalytics = async (
    range: TimeRangeOption,
    startDate?: string,
    endDate?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('range', range);
      if (range === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/analytics/overview?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const json: OverviewDashboardData = await res.json();
      startTransition(() => {
        setData(json);
        setSelectedRange(range);
      });
    } catch (err: any) {
      console.error('[Dashboard fetch error]:', err);
      setError(err?.message || 'Failed to refresh analytics from database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRange = (range: TimeRangeOption) => {
    if (range === 'custom') {
      setShowCustomModal(true);
      return;
    }
    fetchAnalytics(range);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    setShowCustomModal(false);
    fetchAnalytics('custom', customStart, customEnd);
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full pb-16">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            Overview
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Live view of your lead discovery, verification and outreach pipeline.
          </p>
        </div>

        {/* Right Time Range Controls matching reference image */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dropdown pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 border border-studio-border text-xs text-text-secondary cursor-pointer hover:text-text-main select-none">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span>{data.timeRange.label}</span>
            <ChevronDown className="w-3 h-3 text-text-muted ml-0.5" />
          </div>

          {/* Time Filter Pills: [ Today ] [ 3D ] [ 7D ] [ 14D ] [ 30D ] [ Custom ] */}
          <div className="flex items-center p-0.5 bg-surface-100 rounded-lg border border-studio-border">
            {RANGE_OPTIONS.map((opt) => {
              const isActive = selectedRange === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSelectRange(opt.key)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-surface-200 text-text-main font-semibold shadow-sm border border-studio-border-strong'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              fetchAnalytics(
                selectedRange,
                selectedRange === 'custom' ? customStart : undefined,
                selectedRange === 'custom' ? customEnd : undefined
              )
            }
            title="Refresh database analytics"
            className="p-1.5 rounded-lg bg-surface-100 border border-studio-border text-text-secondary hover:text-text-main transition-colors cursor-pointer select-none active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-rose-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedRange)}
            className="underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── 1. TOP ROW: 6 KPI CARDS ─── */}
      <TopKpiCards kpis={data.kpis} />

      {/* ─── 2. MIDDLE SECTION: 2 COLUMNS LEFT + 1 COLUMN RIGHT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Side: Pipeline Funnel + Daily Activity (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3.5">
          <div className="flex-1">
            <FunnelVisualization
              stages={data.funnel.stages}
              overallConversionRate={data.funnel.overallConversionRate}
            />
          </div>
          <div className="flex-1">
            <DailyTrendChart trends={data.trends} />
          </div>
        </div>

        {/* Right Side: System Status + API Usage + Insights (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          <SystemStatusCard system={data.system} />
          <ApiUsageCard quota={data.quota} />
          <InsightsAnomalies insights={data.insights} />
        </div>
      </div>

      {/* ─── 3. LOWER SECTION: 3 METRIC CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <VerificationBreakdownCard verification={data.verification} />
        <OutreachPerformanceCard outreach={data.outreach} />
        <ContentSourcesCard sources={data.contentSources} />
      </div>

      {/* ─── 4. BOTTOM SECTION: 5 EXPANDABLE DIAGNOSTIC DRAWERS ─── */}
      <ProgressiveDisclosureSections data={data} />

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-xl border border-studio-border-strong bg-surface-100 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-sm font-semibold text-text-main">Custom Date Filter</span>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3 text-xs">
              <div>
                <label className="text-text-secondary block mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-text-main font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-text-secondary block mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-200 px-3 py-2 text-text-main font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-brand-hover text-white transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
