import React from 'react';
import { db } from '../../db/client';
import { replies, leads, campaigns } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Inbox, MessageSquare, ExternalLink, ShieldOff, Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getRepliesData() {
  try {
    const list = await db
      .select({
        id: replies.id,
        threadId: replies.threadId,
        messageId: replies.messageId,
        senderEmail: replies.senderEmail,
        snippet: replies.snippet,
        receivedAt: replies.receivedAt,
        processed: replies.processed,
        channelTitle: leads.channelTitle,
        channelUrl: leads.channelUrl,
        campaignName: campaigns.name,
      })
      .from(replies)
      .leftJoin(leads, eq(replies.leadId, leads.id))
      .leftJoin(campaigns, eq(leads.id, campaigns.id))
      .orderBy(desc(replies.receivedAt))
      .limit(50);

    return list;
  } catch (e) {
    return [];
  }
}

export default async function RepliesPage() {
  const list = await getRepliesData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div className="flex items-center space-x-2">
          <Inbox className="w-5 h-5 text-rose-400" />
          <h1 className="text-lg font-semibold text-white tracking-tight">Creator Replies Inbox</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Inbound responses detected from outreach threads. High-signal replies automatically trigger Telegram alerts.
        </p>
      </div>

      <div className="rounded-lg bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Channel / Sender</th>
                <th className="px-4 py-3">Reply Message Snippet</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No creator replies recorded yet. Incoming responses will appear here automatically.
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{r.channelTitle || 'Unknown Channel'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{r.senderEmail}</div>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="text-slate-200 line-clamp-2 italic text-[11px]">
                        "{r.snippet || 'No preview available'}"
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">{r.campaignName || 'General'}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {r.receivedAt ? new Date(r.receivedAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`https://mail.google.com/mail/u/0/#inbox/${r.threadId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-indigo-400 text-xs font-medium transition-colors"
                      >
                        <span>Gmail</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
