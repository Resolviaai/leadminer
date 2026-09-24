'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Mail,
  ShieldCheck,
  Send,
  Reply,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
} from 'lucide-react';
import { KpiMetric } from '@/services/analytics/overview-analytics.service';

interface TopKpiCardsProps {
  kpis: KpiMetric[];
}

interface KpiStyleConfig {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const KPI_CONFIG: Record<string, KpiStyleConfig> = {
  keywords_searched: {
    icon: <Search className="w-4 h-4" />,
    iconBg: 'bg-[#2A1D17]',
    iconColor: 'text-[#F06536]',
  },
  unique_channels: {
    icon: <Users className="w-4 h-4" />,
    iconBg: 'bg-[#152336]',
    iconColor: 'text-[#388BFD]',
  },
  emails_found: {
    icon: <Mail className="w-4 h-4" />,
    iconBg: 'bg-[#291F18]',
    iconColor: 'text-[#E3A37D]',
  },
  verified_emails: {
    icon: <ShieldCheck className="w-4 h-4" />,
    iconBg: 'bg-[#152B1E]',
    iconColor: 'text-[#2EA043]',
  },
  emails_sent: {
    icon: <Send className="w-4 h-4" />,
    iconBg: 'bg-[#16253B]',
    iconColor: 'text-[#58A6FF]',
  },
  replies: {
    icon: <Reply className="w-4 h-4" />,
    iconBg: 'bg-[#2E181B]',
    iconColor: 'text-[#F85149]',
  },
};

export function TopKpiCards({ kpis }: TopKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const config = KPI_CONFIG[kpi.id] || {
          icon: <Search className="w-4 h-4" />,
          iconBg: 'bg-surface-200',
          iconColor: 'text-primary',
        };

        const isPositive = (kpi.percentageChange ?? 0) >= 0;
        const changeVal = kpi.percentageChange !== null ? Math.abs(kpi.percentageChange) : null;

        const CardContent = (
          <div className="flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconColor} border border-white/[0.04]`}
              >
                {config.icon}
              </div>
              <span className="text-[11px] font-medium text-text-secondary leading-tight truncate">
                {kpi.label}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-text-main font-mono tabular-nums leading-none mb-1.5">
                {kpi.formattedValue}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {changeVal !== null && (
                  <span
                    className={`inline-flex items-center text-[11px] font-mono font-medium ${
                      isPositive ? 'text-[#3FB950]' : 'text-[#F85149]'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3 mr-0.5 inline" />
                    ) : (
                      <ArrowDown className="w-3 h-3 mr-0.5 inline" />
                    )}
                    {changeVal}%*
                  </span>
                )}
                <span className="text-[11px] text-text-muted truncate">
                  {kpi.subtext}
                </span>
              </div>
            </div>
          </div>
        );

        if (kpi.drilldownHref) {
          return (
            <Link
              key={kpi.id}
              href={kpi.drilldownHref}
              className="group relative rounded-xl border border-border bg-surface-100 p-3.5 hover:border-primary/50 hover:bg-surface-200/40 transition-all active:scale-[0.99] select-none"
            >
              {CardContent}
            </Link>
          );
        }

        return (
          <div
            key={kpi.id}
            className="rounded-xl border border-border bg-surface-100 p-3.5"
          >
            {CardContent}
          </div>
        );
      })}
    </div>
  );
}
