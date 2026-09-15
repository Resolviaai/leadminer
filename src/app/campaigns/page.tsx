import React from 'react';
import { db } from '../../db/client';
import { campaigns, templates } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Target, Sparkles, Play, Pause, Send } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getCampaignsData() {
  try {
    const list = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        dailyLimit: campaigns.dailyLimit,
        minSubscribers: campaigns.minSubscribers,
        maxSubscribers: campaigns.maxSubscribers,
        enableGemini: campaigns.enableGeminiPersonalization,
        templateName: templates.name,
      })
      .from(campaigns)
      .leftJoin(templates, eq(campaigns.templateId, templates.id))
      .orderBy(desc(campaigns.id));

    return list;
  } catch (e) {
    return [];
  }
}

export default async function CampaignsPage() {
  const list = await getCampaignsData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-semibold text-white tracking-tight">Outreach Campaigns</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure lead criteria, template assignments, daily rate limits, and Gemini hooks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <form action="/api/workers/outreach" method="POST">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Outreach Batch</span>
            </button>
          </form>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.length === 0 ? (
          <div className="col-span-2 p-8 rounded-lg bg-white/[0.02] border border-white/10 text-center text-slate-500 text-xs">
            No campaigns configured. Run <code className="text-indigo-400">npm run db:seed</code> to create the default campaign.
          </div>
        ) : (
          list.map((camp) => (
            <div key={camp.id} className="p-5 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-white">{camp.name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      camp.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mt-3">
                  <div className="flex justify-between">
                    <span>Template:</span>
                    <span className="text-slate-200">{camp.templateName || 'Default'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <span className="font-mono text-slate-200">{camp.dailyLimit} emails/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audience Criteria:</span>
                    <span className="font-mono text-slate-200">
                      {camp.minSubscribers?.toLocaleString()} - {camp.maxSubscribers?.toLocaleString()} subs
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span>Gemini AI Hook:</span>
                    <span className="flex items-center space-x-1 text-indigo-400 font-medium text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      <span>{camp.enableGemini ? 'Enabled (with fallback)' : 'Disabled'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">ID: {camp.id}</span>
                <div className="flex space-x-2">
                  <form action={`/api/campaigns/${camp.id}/toggle`} method="POST">
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      {camp.status === 'ACTIVE' ? (
                        <>
                          <Pause className="w-3 h-3 text-amber-400" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
