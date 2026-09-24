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
          iconBg: 'bg-[#21262D]',
          iconColor: 'text-[#F06536]',
        };

        const isPositive = (kpi.percentageChange ?? 0) >= 0;
        const changeVal = kpi.percentageChange !== null ? Math.abs(kpi.percentageChange) : null;
        const showPct = changeVal !== null && changeVal <= 500 && kpi.previousValue > 0;

        const CardContent = (
          <div className="flex items-start gap-3">
            {/* Left: Square Icon Box matching reference image */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconColor} border border-white/[0.04] mt-0.5`}
            >
              {config.icon}
            </div>

            {/* Right: Content block */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#8B949E] leading-tight truncate block">
                {kpi.label}
              </span>

              <div className="text-2xl font-bold tracking-tight text-[#F0F6FC] font-mono tabular-nums leading-none my-1.5">
                {kpi.formattedValue}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {showPct ? (
                  <span
                    className={`inline-flex items-center font-mono font-semibold ${
                      isPositive ? 'text-[#3FB950]' : 'text-[#F85149]'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3 mr-0.5 inline shrink-0" />
                    ) : (
                      <ArrowDown className="w-3 h-3 mr-0.5 inline shrink-0" />
                    )}
                    {changeVal}%
                  </span>
                ) : kpi.previousValue === 0 && kpi.value > 0 ? (
                  <span className="text-[#3FB950] font-mono text-[11px] font-semibold">
                    ↑ New
                  </span>
                ) : null}
                <span className="text-[11px] text-[#8B949E] truncate">
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
              className="group relative rounded-xl border border-[#30363D] bg-[#161B22] p-3.5 hover:border-[#F06536]/50 hover:bg-[#1C2128] transition-all active:scale-[0.99] select-none"
            >
              {CardContent}
            </Link>
          );
        }

        return (
          <div
            key={kpi.id}
            className="rounded-xl border border-[#30363D] bg-[#161B22] p-3.5"
          >
            {CardContent}
          </div>
        );
      })}
    </div>
  );
}
