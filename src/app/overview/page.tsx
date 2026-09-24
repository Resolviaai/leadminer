import React from 'react';
import { overviewAnalyticsService } from '@/services/analytics/overview-analytics.service';
import { OverviewDashboardClient } from '@/components/overview/OverviewDashboardClient';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OverviewPage() {
  try {
    const initialData = await overviewAnalyticsService.getOverviewAnalytics('7d');
    return <OverviewDashboardClient initialData={initialData} />;
  } catch (error: any) {
    console.error('[OverviewPage SSR Error]:', error);
    return (
      <div className="max-w-7xl mx-auto w-full p-6 space-y-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 text-rose-300 space-y-2">
          <div className="flex items-center gap-2.5 font-semibold text-sm text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Operational Telemetry Temporarily Unavailable</span>
          </div>
          <p className="text-xs text-rose-300/80 leading-relaxed">
            LeadMiner could not establish a connection to the PostgreSQL analytics database ({error?.message || 'Connection timeout'}).
            Check that the database is running and refresh the page.
          </p>
        </div>
      </div>
    );
  }
}
