import React from 'react';
import { db } from '../../db/client';
import { gmailAccounts } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Mail, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { env } from '../../config/env';

export const dynamic = 'force-dynamic';

async function getGmailAccounts() {
  try {
    return await db.select().from(gmailAccounts).orderBy(desc(gmailAccounts.id));
  } catch (e) {
    return [];
  }
}

export default async function GmailAccountsPage() {
  const accounts = await getGmailAccounts();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-semibold text-white tracking-tight">Connected Gmail Inboxes</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage sending accounts, daily quotas, rotation health, and Google OAuth credentials.
          </p>
        </div>

        <div>
          <a
            href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID || 'PENDING'}&redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Gmail Inbox</span>
          </a>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-2 p-8 rounded-lg bg-white/[0.02] border border-white/10 text-center text-slate-500 text-xs">
            No Gmail accounts connected yet. The system is operating in simulated <span className="text-amber-400 font-mono">DRY_RUN</span> mode.
          </div>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="p-5 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-semibold text-white">{acc.email}</h2>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      acc.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mt-3">
                  <div className="flex justify-between">
                    <span>Daily Sending Limit:</span>
                    <span className="font-mono text-slate-200">{acc.dailyLimit} emails/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sent Today:</span>
                    <span className="font-mono text-slate-200">{acc.sentToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Today:</span>
                    <span className="font-mono text-emerald-400">{Math.max(0, acc.dailyLimit - acc.sentToday)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Dispatch:</span>
                    <span className="text-slate-300">
                      {acc.lastSendAt ? new Date(acc.lastSendAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
