'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DailyTrendPoint } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, Check } from 'lucide-react';

interface DailyTrendChartProps {
  trends: DailyTrendPoint[];
}

type MetricKey = 'channelsDiscovered' | 'emailsFound' | 'emailsVerified' | 'messagesSent' | 'repliesReceived';
type MetricFilterKey = 'all' | MetricKey;

interface SeriesConfig {
  key: MetricKey;
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

const METRIC_OPTIONS: Array<{ key: MetricFilterKey; label: string; color?: string }> = [
  { key: 'all', label: 'All metrics' },
  { key: 'channelsDiscovered', label: 'Channels', color: '#F06536' },
  { key: 'emailsFound', label: 'Emails Found', color: '#388BFD' },
  { key: 'emailsVerified', label: 'Verified', color: '#2EA043' },
  { key: 'messagesSent', label: 'Sent', color: '#A371F7' },
  { key: 'repliesReceived', label: 'Replies', color: '#F778BA' },
];

export function DailyTrendChart({ trends }: DailyTrendChartProps) {
  // Only show tooltip on hover or click - starts null
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Functional metric filter dropdown
  const [selectedMetric, setSelectedMetric] = useState<MetricFilterKey>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  if (!trends || trends.length === 0) {
    return (
      <Card className="p-5 text-center text-text-muted text-xs bg-surface-100 border border-border">
        No daily trend data available for this timeframe.
      </Card>
    );
  }

  // Active series controlled by the dropdown
  const activeSeries = selectedMetric === 'all'
    ? SERIES
    : SERIES.filter((s) => s.key === selectedMetric);

  // Chart dimensions
  const width = 640;
  const height = 260;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Maximum value for Y axis (dynamically re-scales when filtering by metric)
  const rawMax = Math.max(
    ...trends.flatMap((t) => activeSeries.map((s) => Number(t[s.key] || 0))),
    5
  );
  // Round up to clean ceiling
  const magnitude = Math.max(1, Math.pow(10, Math.floor(Math.log10(rawMax))));
  const maxVal = Math.max(5, Math.ceil(rawMax / magnitude) * magnitude);

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
  const selectedOptionLabel = METRIC_OPTIONS.find((m) => m.key === selectedMetric)?.label || 'All metrics';

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
            {/* Interactive Series Legend */}
            <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-text-secondary">
              {SERIES.map((s) => {
                const isSeriesActive = selectedMetric === 'all' || selectedMetric === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelectedMetric((prev) => (prev === s.key ? 'all' : s.key))}
                    className={`flex items-center gap-1.5 transition-opacity cursor-pointer select-none ${
                      isSeriesActive ? 'opacity-100 font-medium text-text-main' : 'opacity-40 hover:opacity-75'
                    }`}
                    title={`Filter chart by ${s.label}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Functional Dropdown controlling the chart */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-200 border border-studio-border text-xs text-text-secondary cursor-pointer hover:text-text-main transition-colors select-none"
              >
                <span>{selectedOptionLabel}</span>
                <ChevronDown
                  className={`w-3 h-3 text-text-muted transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-studio-border bg-surface-200/95 backdrop-blur-md p-1 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  {METRIC_OPTIONS.map((opt) => {
                    const isSelected = selectedMetric === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSelectedMetric(opt.key);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left select-none cursor-pointer ${
                          isSelected
                            ? 'bg-surface-300 text-text-main font-semibold'
                            : 'text-text-secondary hover:bg-surface-300/60 hover:text-text-main'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {opt.color ? (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: opt.color }}
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full shrink-0 bg-text-muted" />
                          )}
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* SVG Multi-Line Chart with Scrubber (Tooltip only on hover/click) */}
        <div
          className="relative pt-2"
          onMouseLeave={() => setHoveredIndex(null)}
        >
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

            {/* Render Lines for Active Series */}
            {activeSeries.map((s) => {
              const points = trends.map((t, idx) => ({
                x: getX(idx),
                y: getY(Number(t[s.key] || 0)),
              }));

              const pathStr = points.reduce((acc, pt, idx) => {
                if (idx === 0) return `M ${pt.x},${pt.y}`;
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
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIndex === idx ? '5' : '3.5'}
                      fill={s.color}
                      stroke="#1C1C1C"
                      strokeWidth="2"
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
                stroke="rgba(255, 255, 255, 0.25)"
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
                  onClick={() => setHoveredIndex((prev) => (prev === idx ? null : idx))}
                />
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip - ONLY renders on hover or click */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none rounded-xl border border-studio-border bg-surface-200/95 p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 transition-all z-20 animate-in fade-in duration-100"
              style={{
                top: '15px',
                left: `${Math.min(Math.max(15, (getX(hoveredIndex!) / width) * 100 - 15), 65)}%`,
              }}
            >
              <div className="font-semibold text-text-main text-[11px] pb-1.5 border-b border-border/80 font-mono">
                {hoveredPoint.label}, {new Date(hoveredPoint.date).getFullYear()}
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {activeSeries.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
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
