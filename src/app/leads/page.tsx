import React from 'react';
import { db } from '../../db/client';
import { leads, contacts, keywords } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Users, ExternalLink, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getLeadsData() {
  try {
    const list = await db
      .select({
        id: leads.id,
        channelId: leads.channelId,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        subscriberCount: leads.subscriberCount,
        qualificationStatus: leads.qualificationStatus,
        outreachStatus: leads.outreachStatus,
        discoveredAt: leads.discoveredAt,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
        sourceKeyword: keywords.keyword,
        category: keywords.category,
      })
      .from(leads)
      .leftJoin(contacts, eq(leads.id, contacts.leadId))
      .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
      .orderBy(desc(leads.discoveredAt))
      .limit(50);

    return list;
  } catch (e) {
    return [];
  }
}

export default async function LeadsPage() {
  const list = await getLeadsData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-white tracking-tight">Discovered Creator Leads</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated channels, extracted emails, verification status, and outreach qualification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <form action="/api/workers/verification" method="POST">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Verify & Qualify Batch</span>
            </button>
          </form>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-lg bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3 text-right">Subscribers</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Qualification</th>
                <th className="px-4 py-3">Outreach Status</th>
                <th className="px-4 py-3">Source Keyword</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No leads discovered yet. Run the discovery worker from the Keywords page.
                  </td>
                </tr>
              ) : (
                list.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-white">{lead.channelTitle}</span>
                        <a
                          href={lead.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                      {lead.subscriberCount ? lead.subscriberCount.toLocaleString() : '0'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-200">
                      {lead.email || <span className="text-slate-500 font-sans text-[11px]">None found</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          lead.emailStatus === 'VALID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : lead.emailStatus === 'INVALID' || lead.emailStatus === 'DISPOSABLE'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        <span>{lead.emailStatus || 'NONE'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                          lead.qualificationStatus === 'QUALIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : lead.qualificationStatus === 'DISQUALIFIED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {lead.qualificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                          lead.outreachStatus === 'REPLIED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold'
                            : lead.outreachStatus === 'CONTACTED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {lead.outreachStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px] font-sans">
                      {lead.sourceKeyword || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
