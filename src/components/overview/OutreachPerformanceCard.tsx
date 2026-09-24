'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { OutreachAnalytics } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface OutreachPerformanceCardProps {
  outreach: OutreachAnalytics;
}

export function OutreachPerformanceCard({ outreach }: OutreachPerformanceCardProps) {
  const bars = outreach.dailyBars || [];

  // Responsive bar sizing and gap depending on number of days
  const barWidthClass =
    bars.length <= 8
      ? 'w-3 sm:w-4 md:w-5'
      : bars.length <= 16
      ? 'w-2 sm:w-2.5 md:w-3'
      : 'w-1 sm:w-1.5 md:w-2';

  const barGapClass =
    bars.length <= 8
      ? 'gap-1 sm:gap-1.5'
      : bars.length <= 16
      ? 'gap-0.5 sm:gap-1'
      : 'gap-0.5';

  const labelStep =
    bars.length <= 8
      ? 1
      : bars.length <= 16
      ? 2
      : Math.ceil(bars.length / 7);

  // Chart dimensions
  const chartHeight = 110;
  const maxVal = Math.max(
    ...bars.flatMap((b) => [b.sent, b.replies]),
    10
  );

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-border bg-surface-100 overflow-hidden">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-text-main">
            Outreach Performance
          </CardTitle>
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

        {/* Dual Bar Chart with Y-Axis and Substantial Bars matching Reference Image */}
        <div className="pt-3">
          {/* Legend */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-text-secondary mb-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F39462]" />
              <span>Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C8531E]" />
              <span>Replies</span>
            </div>
          </div>

          {/* Chart Area with Y-axis labels and grid */}
          <div className="flex items-end gap-2.5 h-[115px] pt-1 select-none">
            {/* Y-Axis Ticks */}
            <div className="flex flex-col justify-between h-[90px] text-[9px] font-mono text-text-muted text-right pb-4 shrink-0 w-6">
              <span>{maxVal}</span>
              <span>{Math.round(maxVal * 0.66)}</span>
              <span>{Math.round(maxVal * 0.33)}</span>
              <span>0</span>
            </div>

            {/* Bars Grid */}
            <div className="flex-1 min-w-0 flex items-end justify-between gap-1 sm:gap-1.5 h-full border-b border-border/80 pb-0.5 overflow-hidden">
              {bars.map((bar, idx) => {
                const sentHeightPct = bar.sent > 0 ? Math.max(6, Math.round((bar.sent / maxVal) * 100)) : 0;
                const replyHeightPct = bar.replies > 0 ? Math.max(6, Math.round((bar.replies / maxVal) * 100)) : 0;
                const showLabel = idx % labelStep === 0 || idx === bars.length - 1;

                return (
                  <div
                    key={bar.day}
                    className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1 group"
                  >
                    <div className={`w-full flex items-end justify-center ${barGapClass} h-[90px]`}>
                      {/* Sent Bar (Light Orange) */}
                      {sentHeightPct > 0 && (
                        <div
                          className={`${barWidthClass} bg-[#F39462] rounded-t-sm transition-all duration-300 group-hover:brightness-110 shadow-sm`}
                          style={{ height: `${sentHeightPct}%` }}
                          title={`Sent: ${bar.sent}`}
                        />
                      )}
                      {/* Reply Bar (Deep Orange) */}
                      {replyHeightPct > 0 && (
                        <div
                          className={`${barWidthClass} bg-[#C8531E] rounded-t-sm transition-all duration-300 group-hover:brightness-110 shadow-sm`}
                          style={{ height: `${replyHeightPct}%` }}
                          title={`Replies: ${bar.replies}`}
                        />
                      )}
                    </div>

                    <span
                      className={`text-[9px] font-mono text-text-muted truncate block mt-0.5 ${
                        showLabel ? '' : 'invisible select-none'
                      }`}
                    >
                      {bar.label.split(' ')[1] || bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
