'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationCenter } from './notifications/NotificationCenter';
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
  Zap,
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
      <aside className="hidden md:flex w-64 bg-surface-100 border-r border-border flex-col shrink-0 h-screen sticky top-0">
        {/* Brand Header with exact h-14 to align with topbar */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs tracking-wider">
              LM
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-text-main block">LeadMiner</span>
              <span className="text-[11px] text-text-muted block -mt-0.5">YouTube Outreach</span>
            </div>
          </div>
          {dryRun && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-medium">
              DRY RUN
            </span>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Platform
          </div>
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-surface-200 text-text-main font-semibold border-l-2 border-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-200/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${active ? 'text-primary' : 'text-text-muted'}`}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ==================================================== */}
      {/* 2. MOBILE TOP APP BAR (< md)                         */}
      {/* ==================================================== */}
      <header className="md:hidden sticky top-0 z-40 h-14 bg-surface-100/90 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            LM
          </div>
          <span className="font-semibold text-sm text-text-main tracking-tight">LeadMiner</span>
        </Link>

        <div className="flex items-center space-x-2">
          <NotificationCenter />
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>Online</span>
          </div>
          {dryRun && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-medium">
              DRY RUN
            </span>
          )}
        </div>
      </header>

      {/* ==================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< md)               */}
      {/* ==================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-100/95 backdrop-blur-lg border-t border-border flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all active:scale-95 ${
                active ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={active ? 2.2 : 1.75} />
              <span className={`text-[10px] tracking-tight ${active ? 'font-semibold text-text-main' : 'font-normal'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* More Drawer Button */}
        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all active:scale-95 ${
            isMobileMoreOpen || secondaryNavItems.some((s) => isActive(s.href))
              ? 'text-primary'
              : 'text-text-muted hover:text-text-secondary'
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMoreOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative bg-surface-100 border-t border-border rounded-t-2xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            {/* Grab handle */}
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">All Modules</span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main bg-surface-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                        ? 'bg-primary/15 border-primary/30 text-text-main font-semibold'
                        : 'bg-surface-200 border-border text-text-secondary hover:text-text-main hover:bg-surface-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-text-muted'}`} strokeWidth={1.75} />
                    <span className="text-xs">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Kill Switch Shortcut */}
            <div className="p-3.5 rounded-xl bg-surface-200 border border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-danger" />
                <span className="text-xs font-medium text-text-main">Kill Switch Ready</span>
              </div>
              <Link
                href="/settings"
                onClick={() => setIsMobileMoreOpen(false)}
                className="px-3 py-1.5 rounded-md bg-destructive/15 border border-destructive/30 text-danger text-xs font-semibold hover:bg-destructive/25 transition-colors"
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
