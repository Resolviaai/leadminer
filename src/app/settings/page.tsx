import React from 'react';
import { db } from '../../db/client';
import { systemSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { Settings, ShieldAlert, ShieldCheck, Radio, Sparkles, Database, Mail, Bell, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { runHealthCheck } from '../../scripts/healthcheck';

export const dynamic = 'force-dynamic';

async function getSettingsAndHealth() {
  const health = await runHealthCheck();

  let isKillSwitchActive = false;
  try {
    const record = await db.select().from(systemSettings).where(eq(systemSettings.key, 'kill_switch')).limit(1);
    if (record.length > 0 && record[0].value) {
      isKillSwitchActive = Boolean((record[0].value as any).enabled);
    }
  } catch (e) {
    // default false
  }

  return { health, isKillSwitchActive };
}

export default async function SettingsPage() {
  const { health, isKillSwitchActive } = await getSettingsAndHealth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold text-white tracking-tight">System Settings & Health Controls</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Emergency outreach safety controls, quota allocations, and live infrastructure diagnostics.
        </p>
      </div>

      {/* Emergency Kill Switch Banner */}
      <div className="p-6 rounded-lg bg-red-950/20 border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm mb-1">
            <ShieldAlert className="w-5 h-5" />
            <span>EMERGENCY OUTREACH KILL SWITCH</span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            When enabled, all outbound Gmail sending is aborted instantly before every individual email dispatch across all campaigns.
            Discovery and lead extraction workers continue safely.
          </p>
        </div>

        <form action="/api/kill-switch" method="POST">
          <input type="hidden" name="enabled" value={isKillSwitchActive ? 'false' : 'true'} />
          <button
            type="submit"
            className={`px-4 py-2.5 rounded font-semibold text-xs tracking-wide transition-all ${
              isKillSwitchActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
            }`}
          >
            {isKillSwitchActive ? 'DISARM KILL SWITCH (RESUME OUTREACH)' : 'STOP ALL OUTREACH'}
          </button>
        </form>
      </div>

      {/* System Health Diagnostics */}
      <div className="p-5 rounded-lg bg-white/[0.02] border border-white/10">
        <h2 className="text-sm font-semibold text-white mb-4">Infrastructure Diagnostics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Database */}
          <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>PostgreSQL / Supabase</span>
              </span>
              {health.components.database.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">{health.components.database.message}</p>
          </div>

          {/* YouTube API */}
          <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>YouTube Data API v3</span>
              </span>
              {health.components.youtube.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {health.components.youtube.message} ({health.components.youtube.remainingSearches} search calls left)
            </p>
          </div>

          {/* Gemini AI */}
          <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini Personalizer</span>
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">{health.components.gemini.message}</p>
          </div>

          {/* Gmail OAuth */}
          <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Gmail OAuth Sender</span>
              </span>
              {health.components.gmail.status === 'OK' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">{health.components.gmail.message}</p>
          </div>

          {/* Telegram */}
          <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                <span>Telegram Bot Alert</span>
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">{health.components.telegram.message}</p>
          </div>

          {/* Runtime Mode */}
          <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Pipeline Dry-Run</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Emails simulated safely in logs without real dispatch.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
