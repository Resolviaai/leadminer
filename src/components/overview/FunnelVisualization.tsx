'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { FunnelStage } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface FunnelVisualizationProps {
  stages: FunnelStage[];
  overallConversionRate: number;
}

export function FunnelVisualization({ stages }: FunnelVisualizationProps) {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // Maximum value for proportional width calculation
  const maxVal = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold text-text-main">
              Lead Pipeline
            </CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              From keywords to replies. See where leads drop off.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-200 border border-studio-border-subtle text-xs text-text-secondary cursor-pointer hover:text-text-main transition-colors select-none">
            <span>Conversion funnel</span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </div>
        </CardHeader>

        {/* Funnel Table & Centered Bars */}
        <div className="space-y-2 pt-2">
          {stages.map((stage) => {
            // Proportional width from 10% to 100%
            const widthPct = Math.max(10, Math.round((stage.count / maxVal) * 100));
            const isHovered = hoveredStageId === stage.id;

            return (
              <div
                key={stage.id}
                onMouseEnter={() => setHoveredStageId(stage.id)}
                onMouseLeave={() => setHoveredStageId(null)}
                className={`grid grid-cols-12 items-center gap-2 py-1 px-1.5 rounded-lg transition-colors text-xs ${
                  isHovered ? 'bg-surface-200/60' : 'hover:bg-surface-200/30'
                }`}
              >
                {/* Left: Stage Label */}
                <div className="col-span-4 sm:col-span-3 text-text-secondary font-medium truncate flex items-center gap-1">
                  <span className="truncate" title={stage.name}>
                    {stage.name}
                  </span>
                  {stage.linkHref && isHovered && (
                    <Link
                      href={stage.linkHref}
                      className="text-primary hover:text-brand-hover inline-block shrink-0"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Center: Centered Funnel Bar */}
                <div className="col-span-5 sm:col-span-6 flex items-center justify-center h-5">
                  <div
                    className="h-4 rounded-sm transition-all duration-500 shadow-sm"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: stage.barColor || '#F06536',
                    }}
                  />
                </div>

                {/* Right: Count and Percentage */}
                <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-3 font-mono text-right tabular-nums">
                  <span className="text-text-main font-bold">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-text-muted text-[11px] min-w-[38px]">
                    {stage.conversionFromPrev !== null ? `${stage.conversionFromPrev}%` : '100%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
