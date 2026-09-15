import React from 'react';
import { db } from '../../db/client';
import { logs } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getLogsData() {
  try {
    return await db.select().from(logs).orderBy(desc(logs.createdAt)).limit(100);
  } catch (e) {
    return [];
  }
}

export default async function LogsPage() {
  const list = await getLogsData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold text-white tracking-tight">System Telemetry & Audit Logs</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time event stream of discoveries, verifications, message dispatches, quota alerts, and worker lifecycles.
        </p>
      </div>

      <div className="rounded-lg bg-white/[0.02] border border-white/10 overflow-hidden font-mono">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider text-[10px] font-sans">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No logs recorded yet. System activities will appear here automatically.
                  </td>
                </tr>
              ) : (
                list.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-4 py-2 font-semibold text-indigo-300 whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-sans font-medium ${
                          log.level === 'INFO'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : log.level === 'WARN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-300 font-sans text-xs">
                      {log.message}
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
