'use client';

import React from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { QuotaAnalytics } from '@/services/analytics/overview-analytics.service';

interface ApiUsageCardProps {
  quota: QuotaAnalytics;
}

export function ApiUsageCard({ quota }: ApiUsageCardProps) {
  // Donut geometry
  const size = 120;
  const strokeWidth = 14;
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
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <h2 className="text-sm font-semibold text-[#F0F6FC]">
            API Usage
          </h2>

          <Link
            href="/settings"
            className="px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors select-none"
          >
            View details
          </Link>
        </div>

        {/* Donut and Legend Grid matching Image 1 & 2 */}
        <div className="flex items-center justify-between gap-4 py-3">
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

              {/* Other segment (Coral) */}
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
              <span className="text-xl font-bold font-mono text-[#F0F6FC] tabular-nums leading-none">
                {quota.totalUnitsUsed.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono mt-0.5">
                / {quota.totalUnitsLimit.toLocaleString()} units
              </span>
              <span className="text-[9px] font-mono text-[#8B949E] mt-0.5">
                {quota.totalUnitsPercentage}% used
              </span>
            </div>
          </div>

          {/* Right Legend */}
          <div className="space-y-2 text-xs font-mono flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F06536] shrink-0" />
                <span className="text-[#8B949E]">Search API</span>
              </div>
              <span className="font-semibold text-[#F0F6FC] tabular-nums">
                {quota.searchApiUnits.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#388BFD] shrink-0" />
                <span className="text-[#8B949E]">Channels API</span>
              </div>
              <span className="font-semibold text-[#F0F6FC] tabular-nums">
                {quota.channelsApiUnits.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F85149] shrink-0" />
                <span className="text-[#8B949E]">Other</span>
              </div>
              <span className="font-semibold text-[#F0F6FC] tabular-nums">
                {quota.otherApiUnits.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Reset Banner */}
      <div className="pt-2.5 mt-2 border-t border-[#30363D]/60 flex items-center gap-1.5 text-[11px] text-[#8B949E]">
        <Clock className="w-3.5 h-3.5 text-[#8B949E] shrink-0" />
        <span className="truncate">
          <strong className="text-[#F0F6FC] font-mono">{quota.unitsRemaining.toLocaleString()}</strong> units remaining · Resets in {quota.resetsInHours}h (Midnight PT)
        </span>
      </div>
    </div>
  );
}
