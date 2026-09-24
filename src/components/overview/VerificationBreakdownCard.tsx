'use client';

import React from 'react';
import Link from 'next/link';
import { VerificationBreakdown } from '@/services/analytics/overview-analytics.service';

interface VerificationBreakdownCardProps {
  verification: VerificationBreakdown;
}

export function VerificationBreakdownCard({ verification }: VerificationBreakdownCardProps) {
  // Donut geometry
  const size = 125;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = Math.max(1, verification.totalEmailsTested);
  const validFrac = verification.valid / total;
  const domainFrac = verification.domainValid / total;
  const invalidFrac = verification.invalid / total;
  const unknownFrac = verification.unknownOrFailed / total;

  const validDash = validFrac * circumference;
  const domainDash = domainFrac * circumference;
  const invalidDash = invalidFrac * circumference;
  const unknownDash = unknownFrac * circumference;

  const validOffset = 0;
  const domainOffset = -validDash;
  const invalidOffset = -(validDash + domainDash);
  const unknownOffset = -(validDash + domainDash + invalidDash);

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <h2 className="text-sm font-semibold text-[#F0F6FC]">
            Verification Results
          </h2>

          <Link
            href="/leads"
            className="px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D] text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors select-none"
          >
            View details
          </Link>
        </div>

        {/* Donut and Legend Grid */}
        <div className="flex items-center justify-between gap-4 py-3">
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
              <span className="text-xl font-bold font-mono text-[#F0F6FC] tabular-nums leading-none">
                {verification.totalEmailsTested.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono mt-0.5">
                Emails found
              </span>
            </div>
          </div>

          {/* Right Legend matching reference images */}
          <div className="space-y-2 text-xs font-mono flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2EA043] shrink-0" />
                <span className="text-[#8B949E]">Valid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F0F6FC] tabular-nums">
                  {verification.valid.toLocaleString()}
                </span>
                <span className="text-[#8B949E] text-[11px] min-w-[38px] text-right">
                  {verification.validPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#388BFD] shrink-0" />
                <span className="text-[#8B949E]">Domain Valid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F0F6FC] tabular-nums">
                  {verification.domainValid.toLocaleString()}
                </span>
                <span className="text-[#8B949E] text-[11px] min-w-[38px] text-right">
                  {verification.domainValidPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F85149] shrink-0" />
                <span className="text-[#8B949E]">Invalid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F0F6FC] tabular-nums">
                  {verification.invalid.toLocaleString()}
                </span>
                <span className="text-[#8B949E] text-[11px] min-w-[38px] text-right">
                  {verification.invalidPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B949E] shrink-0" />
                <span className="text-[#8B949E]">Unknown</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F0F6FC] tabular-nums">
                  {verification.unknownOrFailed.toLocaleString()}
                </span>
                <span className="text-[#8B949E] text-[11px] min-w-[38px] text-right">
                  {verification.unknownPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
