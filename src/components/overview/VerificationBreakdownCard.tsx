'use client';

import React from 'react';
import { VerificationBreakdown } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface VerificationBreakdownCardProps {
  verification: VerificationBreakdown;
}

export function VerificationBreakdownCard({ verification }: VerificationBreakdownCardProps) {
  // Donut geometry - bold, thick ring matching reference design
  const size = 145;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const sumCategories =
    verification.valid +
    verification.domainValid +
    verification.invalid +
    verification.unknownOrFailed;
  const total = Math.max(1, sumCategories || verification.totalEmailsTested);
  const validFrac = verification.valid / total;
  const domainFrac = verification.domainValid / total;
  const invalidFrac = verification.invalid / total;
  const unknownFrac = verification.unknownOrFailed / total;

  const validPct = total > 0 ? Number(((verification.valid / total) * 100).toFixed(1)) : 0;
  const domainPct = total > 0 ? Number(((verification.domainValid / total) * 100).toFixed(1)) : 0;
  const invalidPct = total > 0 ? Number(((verification.invalid / total) * 100).toFixed(1)) : 0;
  const unknownPct = total > 0 ? Number(((verification.unknownOrFailed / total) * 100).toFixed(1)) : 0;

  const validDash = validFrac * circumference;
  const domainDash = domainFrac * circumference;
  const invalidDash = invalidFrac * circumference;
  const unknownDash = unknownFrac * circumference;

  const validOffset = 0;
  const domainOffset = -validDash;
  const invalidOffset = -(validDash + domainDash);
  const unknownOffset = -(validDash + domainDash + invalidDash);

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-text-main">
            Verification Results
          </CardTitle>
        </CardHeader>

        {/* Donut and Legend Grid */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Donut Chart */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth={strokeWidth}
              />

              {/* Valid (Green) */}
              {validDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#2EA043"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${validDash} ${circumference}`}
                  strokeDashoffset={validOffset}
                />
              )}

              {/* Domain Valid (Blue) */}
              {domainDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#388BFD"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${domainDash} ${circumference}`}
                  strokeDashoffset={domainOffset}
                />
              )}

              {/* Invalid (Red) */}
              {invalidDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#F85149"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${invalidDash} ${circumference}`}
                  strokeDashoffset={invalidOffset}
                />
              )}

              {/* Unknown (Gray) */}
              {unknownDash > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#8B949E"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${unknownDash} ${circumference}`}
                  strokeDashoffset={unknownOffset}
                />
              )}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl font-bold font-mono text-text-main tabular-nums leading-none">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-muted font-mono mt-1">
                Emails found
              </span>
            </div>
          </div>

          {/* Right Legend matching reference images */}
          <div className="space-y-2 text-xs font-mono flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2EA043] shrink-0" />
                <span className="text-text-secondary">Valid</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-text-main tabular-nums">
                  {verification.valid.toLocaleString()}
                </span>
                <span className="text-text-muted text-[11px] min-w-[38px] text-right">
                  {validPct}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#388BFD] shrink-0" />
                <span className="text-text-secondary">Domain Valid</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-text-main tabular-nums">
                  {verification.domainValid.toLocaleString()}
                </span>
                <span className="text-text-muted text-[11px] min-w-[38px] text-right">
                  {domainPct}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F85149] shrink-0" />
                <span className="text-text-secondary">Invalid</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-text-main tabular-nums">
                  {verification.invalid.toLocaleString()}
                </span>
                <span className="text-text-muted text-[11px] min-w-[38px] text-right">
                  {invalidPct}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B949E] shrink-0" />
                <span className="text-text-secondary">Unknown</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-text-main tabular-nums">
                  {verification.unknownOrFailed.toLocaleString()}
                </span>
                <span className="text-text-muted text-[11px] min-w-[38px] text-right">
                  {unknownPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
