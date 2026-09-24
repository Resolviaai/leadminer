'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { FunnelStage } from '@/services/analytics/overview-analytics.service';

interface FunnelVisualizationProps {
  stages: FunnelStage[];
  overallConversionRate: number;
}

export function FunnelVisualization({ stages }: FunnelVisualizationProps) {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // Maximum value for proportional width calculation
  const maxVal = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header matching Image 1 & 2 */}
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <div>
            <h2 className="text-sm font-semibold text-[#F0F6FC]">
              Lead Pipeline
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">
              From keywords to replies. See where leads drop off.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors cursor-pointer select-none">
            <span>Conversion funnel</span>
            <ChevronDown className="w-3 h-3 text-[#8B949E]" />
          </div>
        </div>

        {/* Funnel Rows */}
        <div className="space-y-1.5 pt-3">
          {stages.map((stage) => {
            // Proportional width from 8% to 100%
            const widthPct = Math.max(8, Math.round((stage.count / maxVal) * 100));
            const isHovered = hoveredStageId === stage.id;

            return (
              <div
                key={stage.id}
                onMouseEnter={() => setHoveredStageId(stage.id)}
                onMouseLeave={() => setHoveredStageId(null)}
                className={`grid grid-cols-12 items-center gap-2 py-1 px-1.5 rounded-lg transition-colors text-xs relative ${
                  isHovered ? 'bg-[#21262D]' : 'hover:bg-[#1C2128]'
                }`}
              >
                {/* Left: Stage Label */}
                <div className="col-span-4 sm:col-span-4 text-[#C9D1D9] font-medium truncate flex items-center gap-1">
                  <span className="truncate" title={stage.name}>
                    {stage.name}
                  </span>
                  {stage.linkHref && isHovered && (
                    <Link
                      href={stage.linkHref}
                      className="text-[#F06536] hover:text-[#FA7035] inline-block shrink-0"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Center: Centered Funnel Bar */}
                <div className="col-span-4 sm:col-span-5 flex items-center justify-center h-4">
                  <div
                    className="h-3.5 rounded-[3px] transition-all duration-500 shadow-sm"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: stage.barColor || '#F06536',
                    }}
                  />
                </div>

                {/* Right: Count and Percentage */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2.5 font-mono text-right tabular-nums">
                  <span className="text-[#F0F6FC] font-bold text-xs">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-[#8B949E] text-[11px] min-w-[38px] text-right">
                    {stage.conversionFromPrev !== null ? `${stage.conversionFromPrev}%` : '100%'}
                  </span>
                </div>

                {/* Hover Drop-off Tooltip (Critique #5 & #7) */}
                {isHovered && stage.dropoffCount > 0 && (
                  <div className="absolute right-0 -top-7 z-20 pointer-events-none bg-[#0D1117] border border-[#30363D] text-[10px] font-mono text-[#8B949E] px-2 py-0.5 rounded shadow-lg">
                    <span className="text-[#F85149] font-semibold">
                      ▼ {stage.dropoffCount.toLocaleString()} dropped ({stage.dropoffRate}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
