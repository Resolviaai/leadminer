import { NextRequest, NextResponse } from 'next/server';
import { overviewAnalyticsService, TimeRangeOption } from '@/services/analytics/overview-analytics.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') || '7d') as TimeRangeOption;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await overviewAnalyticsService.getOverviewAnalytics(range, startDate, endDate);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API/analytics/overview] Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate overview analytics', message: error?.message || 'Internal database error' },
      { status: 500 }
    );
  }
}
