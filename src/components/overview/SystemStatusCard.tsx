'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, CheckCircle2, Clock } from 'lucide-react';
import { SystemHealthAnalytics } from '@/services/analytics/overview-analytics.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SystemStatusCardProps {
  system: SystemHealthAnalytics;
}

export function SystemStatusCard({ system }: SystemStatusCardProps) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between border border-border bg-surface-100">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-main">
              System Status
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#152B1E] text-[#3FB950] border border-[#238636]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
              <span>{system.overallState}</span>
            </span>
          </div>
        </CardHeader>

        <div className="text-[11px] text-text-muted mb-3 flex items-center justify-between">
          <span>Autonomous background pipeline</span>
          <span className="font-mono">{system.lastRunSummary}</span>
        </div>

        {/* Worker Status List */}
        <div className="space-y-2.5">
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
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-surface-200/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                  <span className="text-text-secondary font-medium">{worker.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={`font-semibold ${textColor}`}>{worker.status}</span>
                  {worker.detail && (
                    <span className="text-text-muted text-[10px]">({worker.detail})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
