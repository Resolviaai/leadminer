'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import { OutreachAnalytics } from '@/services/analytics/overview-analytics.service';

interface OutreachPerformanceCardProps {
  outreach: OutreachAnalytics;
}

export function OutreachPerformanceCard({ outreach }: OutreachPerformanceCardProps) {
  const bars = outreach.dailyBars || [];

  // Chart dimensions
  const maxVal = Math.max(
    ...bars.flatMap((b) => [b.sent, b.replies]),
    10
  );

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <h2 className="text-sm font-semibold text-[#F0F6FC]">
            Outreach Performance
          </h2>

          <Link
            href="/sent"
            className="px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors select-none"
          >
            View details
          </Link>
        </div>

        {/* Top 2 Stats matching Image 1 & 2 */}
        <div className="grid grid-cols-2 gap-4 py-3 border-b border-[#30363D]/60">
          <div>
            <span className="text-[11px] text-[#8B949E] block">Messages Sent</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#F0F6FC] tabular-nums">
                {outreach.sentInPeriod.toLocaleString()}
              </span>
              {outreach.sentPercentageChange !== null && (
                <span className="text-[11px] font-mono text-[#3FB950] font-semibold inline-flex items-center">
                  <ArrowUp className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                  {Math.abs(outreach.sentPercentageChange)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#8B949E] truncate block mt-0.5">
              out of {outreach.sentTotalAllTime.toLocaleString()} eligible
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#8B949E] block">Replies</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#F0F6FC] tabular-nums">
                {outreach.totalRepliesInPeriod.toLocaleString()}
              </span>
              {outreach.repliesPercentageChange !== null && (
                <span className="text-[11px] font-mono text-[#3FB950] font-semibold inline-flex items-center">
                  <ArrowUp className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                  {Math.abs(outreach.repliesPercentageChange)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#8B949E] truncate block mt-0.5">
              {outreach.replyRate}% reply rate
            </span>
          </div>
        </div>

        {/* Dual Bar Chart */}
        <div className="pt-3">
          {/* Legend */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-[#8B949E] mb-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F06536]" />
              <span>Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B949E]" />
              <span>Replies</span>
            </div>
          </div>

          {/* Bars Row */}
          <div className="flex items-end justify-between gap-1.5 h-[90px] pt-1">
            {bars.map((bar) => {
              const sentHeightPct = Math.max(6, Math.round((bar.sent / maxVal) * 100));
              const replyHeightPct = Math.max(6, Math.round((bar.replies / maxVal) * 100));

              return (
                <div
                  key={bar.day}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-[68px]">
                    {/* Sent Bar */}
                    <div
                      className="w-2 sm:w-2.5 bg-[#F06536] rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${sentHeightPct}%` }}
                      title={`Sent: ${bar.sent}`}
                    />
                    {/* Reply Bar */}
                    <div
                      className="w-2 sm:w-2.5 bg-[#8B949E] rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${replyHeightPct}%` }}
                      title={`Replies: ${bar.replies}`}
                    />
                  </div>

                  <span className="text-[9px] font-mono text-[#8B949E] truncate block">
                    {bar.label.split(' ')[1] || bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
