'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { QuotaAnalytics } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ApiUsageCardProps {
  quota: QuotaAnalytics;
}

export function ApiUsageCard({ quota }: ApiUsageCardProps) {
  // Donut geometry - bold, thick ring matching design system & Verification chart
  const size = 145;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Breakdown values
  const totalLimit = Math.max(1, quota.totalUnitsLimit);
  const searchFraction = quota.searchApiUnits / totalLimit;
  const channelsFraction = quota.channelsApiUnits / totalLimit;
  const otherFraction = quota.otherApiUnits / totalLimit;

  const searchDash = searchFraction * circumference;
  const channelsDash = channelsFraction * circumference;
  const otherDash = otherFraction * circumference;

  // Offsets
  const searchOffset = 0;
  const channelsOffset = -searchDash;
  const otherOffset = -(searchDash + channelsDash);

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-text-main">
            API Usage
          </CardTitle>
        </CardHeader>

        {/* Donut and Legend Grid */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Donut Chart */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth={strokeWidth}
              />

              {/* Search API segment (Orange) */}
              {searchDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#F06536"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${searchDash} ${circumference}`}
                  strokeDashoffset={searchOffset}
                  strokeLinecap="round"
                />
              )}

              {/* Channels API segment (Blue) */}
              {channelsDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#388BFD"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${channelsDash} ${circumference}`}
                  strokeDashoffset={channelsOffset}
                />
              )}

              {/* Other segment (Red) */}
              {otherDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#F85149"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${otherDash} ${circumference}`}
                  strokeDashoffset={otherOffset}
                />
              )}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base sm:text-lg font-bold font-mono text-text-main tabular-nums leading-none">
                {quota.totalUnitsUsed.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-muted font-mono mt-0.5">
                / {quota.totalUnitsLimit.toLocaleString()} units
              </span>
              <span className="text-[9px] font-mono text-text-secondary mt-0.5">
                {quota.totalUnitsPercentage}% used
              </span>
            </div>
          </div>

          {/* Right Legend */}
          <div className="space-y-2 text-xs font-mono flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#F06536] shrink-0" />
                <span className="text-text-secondary">Search API</span>
              </div>
              <span className="font-semibold text-text-main tabular-nums">
                {quota.searchApiUnits.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#388BFD] shrink-0" />
                <span className="text-text-secondary">Channels API</span>
              </div>
              <span className="font-semibold text-text-main tabular-nums">
                {quota.channelsApiUnits.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#F85149] shrink-0" />
                <span className="text-text-secondary">Other</span>
              </div>
              <span className="font-semibold text-text-main tabular-nums">
                {quota.otherApiUnits.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Reset Banner */}
      <div className="pt-2.5 mt-2 border-t border-border flex items-center gap-1.5 text-[11px] text-text-muted">
        <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
        <span className="truncate">
          <strong className="text-text-main font-mono">{quota.unitsRemaining.toLocaleString()}</strong> units remaining · Resets in {quota.resetsInHours}h (Midnight PT)
        </span>
      </div>
    </Card>
  );
}
