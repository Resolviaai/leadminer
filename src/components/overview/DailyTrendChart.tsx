'use client';

import React, { useState } from 'react';
import { DailyTrendPoint } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

interface DailyTrendChartProps {
  trends: DailyTrendPoint[];
}

interface SeriesConfig {
  key: keyof Omit<DailyTrendPoint, 'date' | 'label'>;
  label: string;
  color: string;
}

const SERIES: SeriesConfig[] = [
  { key: 'channelsDiscovered', label: 'Channels', color: '#F06536' },
  { key: 'emailsFound', label: 'Emails Found', color: '#388BFD' },
  { key: 'emailsVerified', label: 'Verified', color: '#2EA043' },
  { key: 'messagesSent', label: 'Sent', color: '#A371F7' },
  { key: 'repliesReceived', label: 'Replies', color: '#F778BA' },
];

export function DailyTrendChart({ trends }: DailyTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(
    trends.length > 0 ? Math.floor(trends.length / 2) : null
  );

  if (!trends || trends.length === 0) {
    return (
      <Card className="p-5 text-center text-text-muted text-xs bg-surface-100 border border-border">
        No daily trend data available for this timeframe.
      </Card>
    );
  }

  // Chart dimensions
  const width = 640;
  const height = 260;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Maximum value for Y axis
  const rawMax = Math.max(
    ...trends.flatMap((t) => SERIES.map((s) => Number(t[s.key] || 0))),
    10
  );
  // Round up to clean ceiling (e.g. 50, 100, 500, 1000, 2000)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const maxVal = Math.ceil(rawMax / magnitude) * magnitude;

  const getX = (idx: number) => {
    if (trends.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (idx / (trends.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / maxVal) * innerHeight;
  };

  // Helper for formatting Y labels
  const formatYLabel = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    return num.toString();
  };

  const hoveredPoint = hoveredIndex !== null ? trends[hoveredIndex] : null;

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold text-text-main">
              Daily Activity
            </CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Key metrics over time
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Series Legend */}
            <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-text-secondary">
              {SERIES.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-200 border border-studio-border-subtle text-xs text-text-secondary cursor-pointer hover:text-text-main transition-colors select-none">
              <span>All metrics</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </div>
          </div>
        </CardHeader>

        {/* SVG Multi-Line Chart with Scrubber */}
        <div className="relative pt-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              const labelVal = Math.round(maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    fill="#707070"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {formatYLabel(labelVal)}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Day Labels */}
            {trends.map((t, idx) => {
              const x = getX(idx);
              return (
                <text
                  key={t.date}
                  x={x}
                  y={height - 10}
                  fill={hoveredIndex === idx ? '#EDEDED' : '#707070'}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {t.label}
                </text>
              );
            })}

            {/* Render Lines for each Series */}
            {SERIES.map((s) => {
              const points = trends.map((t, idx) => ({
                x: getX(idx),
                y: getY(Number(t[s.key] || 0)),
              }));

              const pathStr = points.reduce((acc, pt, idx) => {
                if (idx === 0) return `M ${pt.x},${pt.y}`;
                // Smooth line
                const prev = points[idx - 1];
                const cx = (prev.x + pt.x) / 2;
                return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
              }, '');

              return (
                <g key={s.key}>
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIndex === idx ? '4' : '2.5'}
                      fill={s.color}
                      stroke="#161B22"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              );
            })}

            {/* Vertical Scrubber Cursor Line */}
            {hoveredIndex !== null && (
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={paddingTop + innerHeight}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="3 3"
              />
            )}

            {/* Interactive Hit Areas */}
            {trends.map((t, idx) => {
              const x = getX(idx);
              const colWidth = innerWidth / Math.max(1, trends.length - 1);
              return (
                <rect
                  key={`hit-${t.date}`}
                  x={x - colWidth / 2}
                  y={paddingTop}
                  width={colWidth}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip (Matching Image 1 & 2) */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none rounded-xl border border-studio-border-strong bg-[#1F242C]/95 p-3 shadow-2xl backdrop-blur text-xs space-y-2 transition-all z-20"
              style={{
                top: '15px',
                left: `${Math.min(Math.max(15, (getX(hoveredIndex!) / width) * 100 - 15), 65)}%`,
              }}
            >
              <div className="font-semibold text-text-main text-[11px] pb-1 border-b border-white/10 font-mono">
                {hoveredPoint.label}, {new Date(hoveredPoint.date).getFullYear()}
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {SERIES.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-text-secondary">{s.label}</span>
                    </div>
                    <span className="font-bold text-text-main tabular-nums">
                      {Number(hoveredPoint[s.key] || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
