'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { OutreachAnalytics } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface OutreachPerformanceCardProps {
  outreach: OutreachAnalytics;
}

export function OutreachPerformanceCard({ outreach }: OutreachPerformanceCardProps) {
  const bars = outreach.dailyBars || [];

  // Chart dimensions
  const chartHeight = 110;
  const maxVal = Math.max(
    ...bars.flatMap((b) => [b.sent, b.replies]),
    10
  );

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-text-main">
            Outreach Performance
          </CardTitle>

          <Link
            href="/sent"
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-200 border border-studio-border-subtle text-text-secondary hover:text-text-main transition-colors select-none"
          >
            View details
          </Link>
        </CardHeader>

        {/* Top 2 Stats */}
        <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/60">
          <div>
            <span className="text-[11px] text-text-muted block">Messages Sent</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-text-main tabular-nums">
                {outreach.sentInPeriod.toLocaleString()}
              </span>
              {outreach.sentPercentageChange !== null && (
                <span className="text-[11px] font-mono text-[#3FB950] font-medium inline-flex items-center">
                  <ArrowUp className="w-2.5 h-2.5 mr-0.5" />
                  {Math.abs(outreach.sentPercentageChange)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-muted truncate block">
              out of {outreach.sentTotalAllTime.toLocaleString()} eligible
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted block">Replies</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-text-main tabular-nums">
                {outreach.totalRepliesInPeriod.toLocaleString()}
              </span>
              {outreach.repliesPercentageChange !== null && (
                <span className="text-[11px] font-mono text-[#3FB950] font-medium inline-flex items-center">
                  <ArrowUp className="w-2.5 h-2.5 mr-0.5" />
                  {Math.abs(outreach.repliesPercentageChange)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-muted truncate block">
              {outreach.replyRate}% reply rate
            </span>
          </div>
        </div>

        {/* Dual Bar Chart */}
        <div className="pt-3">
          {/* Legend */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-text-secondary mb-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F06536]" />
              <span>Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <span>Replies</span>
            </div>
          </div>

          {/* Bars Row */}
          <div className="flex items-end justify-between gap-2 h-[100px] pt-2">
            {bars.map((bar) => {
              const sentHeightPct = Math.max(4, Math.round((bar.sent / maxVal) * 100));
              const replyHeightPct = Math.max(4, Math.round((bar.replies / maxVal) * 100));

              return (
                <div
                  key={bar.day}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-[75px]">
                    {/* Sent Bar */}
                    <div
                      className="w-2 sm:w-2.5 bg-[#F06536] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${sentHeightPct}%` }}
                      title={`Sent: ${bar.sent}`}
                    />
                    {/* Reply Bar */}
                    <div
                      className="w-2 sm:w-2.5 bg-[#D97706] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${replyHeightPct}%` }}
                      title={`Replies: ${bar.replies}`}
                    />
                  </div>

                  <span className="text-[9px] font-mono text-text-muted truncate block">
                    {bar.label.split(' ')[1] || bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
