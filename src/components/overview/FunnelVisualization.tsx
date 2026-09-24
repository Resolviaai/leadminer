'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { FunnelStage } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelVisualizationProps {
  stages: FunnelStage[];
  overallConversionRate: number;
}

/**
 * Generates an SVG path for a symmetric trapezoid with smoothly rounded corners.
 */
function getTrapezoidPath(
  xTL: number,
  xTR: number,
  xBR: number,
  xBL: number,
  h: number = 24,
  r: number = 3.5
): string {
  const dxL = (xBL - xTL) * (r / h);
  const dxR = (xTR - xBR) * (r / h);

  return (
    `M ${xTL + r},0 ` +
    `L ${xTR - r},0 ` +
    `Q ${xTR},0 ${xTR - dxR},${r} ` +
    `L ${xBR + dxR},${h - r} ` +
    `Q ${xBR},${h} ${xBR - r},${h} ` +
    `L ${xBL + r},${h} ` +
    `Q ${xBL},${h} ${xBL - dxL},${h - r} ` +
    `L ${xTL + dxL},${r} ` +
    `Q ${xTL},0 ${xTL + r},0 Z`
  );
}

export function FunnelVisualization({ stages }: FunnelVisualizationProps) {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  const totalRows = stages.length;
  const totalH = Math.max(1, (totalRows - 1) * 32 + 24);

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

        {/* Global SVG Definitions for gradients */}
        <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
          <defs>
            <linearGradient id="funnel-orange-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E55A2B" />
              <stop offset="100%" stopColor="#F06536" />
            </linearGradient>
          </defs>
        </svg>

        {/* Funnel Rows */}
        <div className="space-y-1.5 pt-2">
          {stages.map((stage, index) => {
            const isHovered = hoveredStageId === stage.id;
            const pct = stage.conversionFromPrev !== null ? stage.conversionFromPrev : 100;

            // Geometry calculations for collinear inverted cone silhouette
            const yt = index * 32;
            const yb = yt + 24;
            const xTL = Number((10 + 110 * (yt / totalH)).toFixed(1));
            const xBL = Number((10 + 110 * (yb / totalH)).toFixed(1));
            const xTR = Number((390 - 110 * (yt / totalH)).toFixed(1));
            const xBR = Number((390 - 110 * (yb / totalH)).toFixed(1));

            const wTop = xTR - xTL;
            const wBot = xBR - xBL;
            const wAvg = (wTop + wBot) / 2;

            const trapezoidPath = getTrapezoidPath(xTL, xTR, xBR, xBL, 24, 3.5);
            const minLeft = Math.min(xTL, xBL);
            const fillWidth = pct >= 99.5
              ? 450
              : Math.max(6, 6 + wAvg * (pct / 100));

            // Subtle warm opacity shift down the funnel
            const fillOpacity = Math.max(0.70, 1 - index * 0.035);

            return (
              <div
                key={stage.id}
                onMouseEnter={() => setHoveredStageId(stage.id)}
                onMouseLeave={() => setHoveredStageId(null)}
                title={`${stage.name}: ${stage.count.toLocaleString()} (${pct}% yield) - ${stage.description}`}
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

                {/* Center: Trapezoid Funnel Row */}
                <div className="col-span-5 sm:col-span-6 flex items-center justify-center h-6">
                  <svg
                    viewBox="0 0 400 24"
                    className="w-full h-5 sm:h-6 transition-all duration-300"
                    preserveAspectRatio="none"
                  >
                    <clipPath id={`funnel-clip-${stage.id}`}>
                      <path d={trapezoidPath} />
                    </clipPath>

                    {/* Funnel Track Background */}
                    <path
                      d={trapezoidPath}
                      fill="rgba(240, 101, 54, 0.08)"
                    />

                    {/* Active Fill (Left-Aligned within Funnel Track) */}
                    {pct > 0 && (
                      <g clipPath={`url(#funnel-clip-${stage.id})`}>
                        <rect
                          x={minLeft - 6}
                          y="0"
                          width={fillWidth}
                          height="24"
                          rx="3"
                          fill="url(#funnel-orange-grad)"
                          fillOpacity={fillOpacity}
                          className="transition-all duration-500"
                        />
                      </g>
                    )}

                    {/* Crisp Outer Border */}
                    <path
                      d={trapezoidPath}
                      fill="none"
                      stroke={isHovered ? 'rgba(240, 101, 54, 0.65)' : 'rgba(240, 101, 54, 0.25)'}
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Right: Count and Percentage */}
                <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-3 font-mono text-right tabular-nums">
                  <span className="text-text-main font-bold">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-text-muted text-[11px] min-w-[40px]">
                    {pct}%
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
