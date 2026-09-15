import React from 'react';
import { db } from '../../db/client';
import { jobs } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Activity, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getJobsData() {
  try {
    return await db.select().from(jobs).orderBy(desc(jobs.id)).limit(50);
  } catch (e) {
    return [];
  }
}

export default async function JobsPage() {
  const list = await getJobsData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold text-white tracking-tight">Background Worker Jobs</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Execution telemetry, progress checkpoints, and heartbeat tracking across discovery, verification, and outreach workers.
        </p>
      </div>

      <div className="rounded-lg bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Items Processed</th>
                <th className="px-4 py-3 text-right">Items Failed</th>
                <th className="px-4 py-3">Started At</th>
                <th className="px-4 py-3">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No worker jobs logged yet. Jobs are automatically recorded when workers run.
                  </td>
                </tr>
              ) : (
                list.map((j) => (
                  <tr key={j.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-400">#{j.id}</td>
                    <td className="px-4 py-3 font-sans font-medium text-white">{j.jobType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                          j.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : j.status === 'RUNNING'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                            : j.status === 'STOPPED_QUOTA'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{j.itemsProcessed}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{j.itemsFailed}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] font-sans">
                      {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] font-sans">
                      {j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : 'In-flight'}
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
