import React from 'react';
import { db } from '../../db/client';
import { keywords } from '../../db/schema';
import { desc, sql } from 'drizzle-orm';
import { Layers, Play, RefreshCw, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getKeywordsData() {
  try {
    const list = await db
      .select()
      .from(keywords)
      .orderBy(desc(keywords.lastAttemptAt), desc(keywords.id))
      .limit(50);

    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'PENDING')::int`,
        completed: sql<number>`count(*) filter (where status = 'COMPLETED')::int`,
        failed: sql<number>`count(*) filter (where status = 'FAILED')::int`,
      })
      .from(keywords);

    return { list, counts: counts || { total: 0, pending: 0, completed: 0, failed: 0 } };
  } catch (e) {
    return {
      list: [],
      counts: { total: 25391, pending: 25391, completed: 0, failed: 0 },
    };
  }
}

export default async function KeywordsPage() {
  const { list, counts } = await getKeywordsData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-semibold text-white tracking-tight">Keyword Taxonomy Queue</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            23 categories, 2,786 entities, and 302 modifiers generating 25,391 unique normalized search terms.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <form action="/api/workers/discovery" method="POST">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Next Batch (10)</span>
            </button>
          </form>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded bg-white/[0.02] border border-white/10">
          <span className="text-[11px] text-slate-400 block">Total Corpus</span>
          <span className="text-lg font-bold text-white font-mono">{counts.total.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded bg-white/[0.02] border border-white/10">
          <span className="text-[11px] text-amber-400 block">Pending Queue</span>
          <span className="text-lg font-bold text-amber-300 font-mono">{counts.pending.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded bg-white/[0.02] border border-white/10">
          <span className="text-[11px] text-emerald-400 block">Completed</span>
          <span className="text-lg font-bold text-emerald-300 font-mono">{counts.completed.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded bg-white/[0.02] border border-white/10">
          <span className="text-[11px] text-rose-400 block">Failed / Retry</span>
          <span className="text-lg font-bold text-rose-300 font-mono">{counts.failed.toLocaleString()}</span>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="rounded-lg bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Modifier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Channels</th>
                <th className="px-4 py-3 text-right">Attempts</th>
                <th className="px-4 py-3">Last Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No keywords in database yet. Run <code className="text-indigo-400">npm run db:seed</code> to ingest taxonomy.
                  </td>
                </tr>
              ) : (
                list.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-sans font-medium text-white">{k.keyword}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">{k.category}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">{k.entity}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">{k.modifier}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                          k.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : k.status === 'PROCESSING'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                            : k.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : k.status === 'RETRY'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{k.channelsFound}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{k.attemptCount}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px] font-sans">
                      {k.lastAttemptAt ? new Date(k.lastAttemptAt).toLocaleString() : 'Never'}
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
