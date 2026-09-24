'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Key, Clock, ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { QuotaAnalytics } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface QuotaUsageCardProps {
  quota: QuotaAnalytics;
}

export function QuotaUsageCard({ quota }: QuotaUsageCardProps) {
  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
      <CheckCircle2 className="w-3 h-3" />
      Healthy
    </span>
  );

  if (quota.status === 'EXHAUSTED') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/40 text-rose-400 border border-rose-800/40">
        <ShieldAlert className="w-3 h-3" />
        Quota Exhausted
      </span>
    );
  } else if (quota.status === 'WARNING') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/40 text-amber-400 border border-amber-800/40">
        <Clock className="w-3 h-3" />
        High Utilization
      </span>
    );
  }

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-main">
              API Quota & Hardware State
            </CardTitle>
          </div>
          {statusBadge}
        </CardHeader>

        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          YouTube Data API v3 token allocation and fail-closed safety state.
        </p>

        <div className="space-y-4">
          {/* Dedicated Search Calls */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="text-text-secondary">Dedicated Search Queries</span>
              <span className="font-mono text-text-main font-medium tabular-nums">
                {quota.searchCallsUsedToday} / {quota.searchCallsDailyLimit}
                <span className="text-text-muted ml-1.5">({quota.searchCallsPercentage}%)</span>
              </span>
            </div>
            <Progress
              value={quota.searchCallsUsedToday}
              max={quota.searchCallsDailyLimit}
              className="h-2"
              indicatorClassName={
                quota.searchCallsPercentage >= 90
                  ? 'bg-rose-500'
                  : quota.searchCallsPercentage >= 75
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }
            />
          </div>

          {/* General Quota Units */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="text-text-secondary">General Quota Units (Channel + Video)</span>
              <span className="font-mono text-text-main font-medium tabular-nums">
                {quota.generalQuotaUsedToday.toLocaleString()} / {quota.generalQuotaDailyLimit.toLocaleString()}
                <span className="text-text-muted ml-1.5">({quota.generalQuotaPercentage}%)</span>
              </span>
            </div>
            <Progress
              value={quota.generalQuotaUsedToday}
              max={quota.generalQuotaDailyLimit}
              className="h-2"
              indicatorClassName={
                quota.generalQuotaPercentage >= 90
                  ? 'bg-rose-500'
                  : quota.generalQuotaPercentage >= 75
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }
            />
          </div>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 text-text-muted">
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-text-secondary" />
            <span>{quota.availableKeysCount} Key(s) Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            <span>Resets Midnight PT</span>
          </span>
        </div>

        <Link
          href="/settings"
          className="text-primary hover:text-brand-hover font-semibold inline-flex items-center gap-1 min-h-[36px] items-center"
        >
          <span>Safety Settings</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}
