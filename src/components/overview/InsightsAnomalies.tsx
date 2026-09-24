'use client';

import React from 'react';
import { ArrowUp, AlertTriangle, ShieldCheck, Lightbulb } from 'lucide-react';
import { InsightItem } from '@/services/analytics/overview-analytics.service';

interface InsightsAnomaliesProps {
  insights: InsightItem[];
}

export function InsightsAnomalies({ insights }: InsightsAnomaliesProps) {
  const getIconWrapper = (idx: number) => {
    switch (idx) {
      case 0:
        return (
          <div className="w-6 h-6 rounded-full bg-[#152B1E] text-[#3FB950] border border-[#238636]/40 flex items-center justify-center shrink-0">
            <ArrowUp className="w-3.5 h-3.5" />
          </div>
        );
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-[#2A1D17] text-[#F59E0B] border border-[#D29922]/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3 h-3" />
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-[#152336] text-[#388BFD] border border-[#388BFD]/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-[#262015] text-[#D29922] border border-[#D29922]/40 flex items-center justify-center shrink-0">
            <Lightbulb className="w-3 h-3" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <h2 className="text-sm font-semibold text-[#F0F6FC]">
            Insights
          </h2>
          <span className="text-xs text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer select-none">
            See all
          </span>
        </div>

        <div className="space-y-3 pt-3">
          {insights.slice(0, 4).map((item, idx) => (
            <div key={item.id} className="flex items-start gap-2.5">
              {getIconWrapper(idx)}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#F0F6FC] leading-tight truncate">
                  {item.title}
                </div>
                <div className="text-[11px] text-[#8B949E] leading-relaxed truncate mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
