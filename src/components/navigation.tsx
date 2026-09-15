'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Users,
  Target,
  FileText,
  Mail,
  Inbox,
  Activity,
  Terminal,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Radio,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Keywords', href: '/keywords', icon: Layers },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
];

const secondaryNavItems = [
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Gmail Accounts', href: '/gmail', icon: Mail },
  { name: 'Replies', href: '/replies', icon: Inbox },
  { name: 'Jobs', href: '/jobs', icon: Activity },
  { name: 'Logs', href: '/logs', icon: Terminal },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const allNavItems = [...mainNavItems, ...secondaryNavItems];

export function Navigation({ dryRun = true }: { dryRun?: boolean }) {
  const pathname = usePathname();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ==================================================== */}
      {/* 1. DESKTOP SIDEBAR (hidden on mobile, visible on md+) */}
      {/* ==================================================== */}
      <aside className="hidden md:flex w-64 bg-[#0B0F17] border-r border-white/10 flex-col shrink-0 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              LM
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">LeadMiner</span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">YouTube Lead Platform</span>
            </div>
          </div>
          {dryRun && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              DRY RUN
            </span>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                  active
                    ? 'bg-indigo-600/15 text-white font-semibold border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-500'}`} strokeWidth={1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Kill Switch Card */}
        <div className="p-3 border-t border-white/10">
          <div className="p-3 rounded bg-red-950/20 border border-red-900/30">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Outreach Safe</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Kill switch is armed. Instant stop available in Settings.
            </p>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. MOBILE TOP APP BAR (< md)                         */}
      {/* ==================================================== */}
      <header className="md:hidden sticky top-0 z-40 h-14 bg-[#0B0F17]/95 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            LM
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">LeadMiner</span>
        </Link>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </div>
          {dryRun && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              DRY RUN
            </span>
          )}
        </div>
      </header>

      {/* ==================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< md)               */}
      {/* ==================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-white/10 flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all active:scale-95 ${
                active ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={active ? 2.2 : 1.75} />
              <span className={`text-[10px] tracking-tight ${active ? 'font-semibold text-white' : 'font-normal'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all active:scale-95 ${
            isMobileMoreOpen || secondaryNavItems.some((s) => isActive(s.href))
              ? 'text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="More navigation options"
        >
          <Menu className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
          <span className="text-[10px] tracking-tight font-normal">More</span>
        </button>
      </nav>

      {/* ==================================================== */}
      {/* 4. MOBILE BOTTOM SHEET DRAWER                        */}
      {/* ==================================================== */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMoreOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative bg-[#0D121D] border-t border-white/10 rounded-t-2xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">All Modules</span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMoreOpen(false)}
                    className={`flex items-center space-x-3 p-3 rounded-xl border min-h-[48px] transition-all active:scale-95 ${
                      active
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                        : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} strokeWidth={1.75} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Kill Switch Shortcut */}
            <div className="p-3.5 rounded-xl bg-red-950/25 border border-red-900/40 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-medium text-slate-200">Kill Switch Ready</span>
              </div>
              <Link
                href="/settings"
                onClick={() => setIsMobileMoreOpen(false)}
                className="px-2.5 py-1.5 rounded bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-600/30 transition-colors"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
