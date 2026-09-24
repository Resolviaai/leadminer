'use client';

import React from 'react';
import { Cpu } from 'lucide-react';
import { SystemHealthAnalytics } from '@/services/analytics/overview-analytics.service';

interface SystemStatusCardProps {
  system: SystemHealthAnalytics;
}

export function SystemStatusCard({ system }: SystemStatusCardProps) {
  return (
    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 flex flex-row items-center justify-between border-b border-[#30363D]/60">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#8B949E]" />
            <h2 className="text-sm font-semibold text-[#F0F6FC]">
              System Status
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#152B1E] text-[#3FB950] border border-[#238636]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
              <span>{system.overallState}</span>
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#8B949E] my-2.5 flex items-center justify-between">
          <span>Autonomous background pipeline</span>
          <span className="font-mono text-[#8B949E]">{system.lastRunSummary}</span>
        </div>

        {/* Worker Status List matching Image 1 & 2 */}
        <div className="space-y-2 pt-1">
          {system.workers.map((worker) => {
            const isGreen = worker.statusColor === 'emerald';
            const isAmber = worker.statusColor === 'amber';
            const isRose = worker.statusColor === 'rose';

            let dotColor = 'bg-[#3FB950]';
            let textColor = 'text-[#3FB950]';

            if (isAmber) {
              dotColor = 'bg-[#F59E0B]';
              textColor = 'text-[#F59E0B]';
            } else if (isRose) {
              dotColor = 'bg-[#F85149]';
              textColor = 'text-[#F85149]';
            }

            return (
              <div
                key={worker.id}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[#21262D] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                  <span className="text-[#C9D1D9] font-medium">{worker.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={`font-semibold ${textColor}`}>{worker.status}</span>
                  {worker.detail && (
                    <span className="text-[#8B949E] text-[10px]">({worker.detail})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
