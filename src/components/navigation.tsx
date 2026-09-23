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
  Menu,
  X,
  Zap,
  Send,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Keywords', href: '/keywords', icon: Layers },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
];

const secondaryNavItems = [
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Gmail Accounts', href: '/gmail', icon: Mail },
  { name: 'Sent', href: '/sent', icon: Send },
  { name: 'Replies', href: '/replies', icon: Inbox },
  { name: 'Jobs', href: '/jobs', icon: Activity },
  { name: 'Logs', href: '/logs', icon: Terminal },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const allNavItems = [...mainNavItems, ...secondaryNavItems];

export function Navigation({ dryRun = true }: { dryRun?: boolean }) {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  React.useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('leadminer_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('leadminer_sidebar_collapsed', String(next));
      } catch {
        // safe fallback
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  const isActive = (href: string) => {
    const current = pendingPath ?? pathname;
    if (href === '/') return current === '/';
    return current.startsWith(href);
  };

  return (
    <>
      {/* ==================================================== */}
      {/* 1. DESKTOP SIDEBAR (hidden on mobile, visible on md+) */}
      {/* ==================================================== */}
      <aside
        className={`hidden md:flex bg-surface-100 border-r border-border flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-200 ease-in-out z-30 ${
          isCollapsed ? 'w-[72px]' : 'w-72'
        }`}
      >
        {/* Brand Header with exact h-14 to align with topbar */}
        <div
          className={`h-14 border-b border-border flex items-center shrink-0 ${
            isCollapsed ? 'px-2.5 justify-between' : 'px-4 justify-between'
          }`}
        >
          {isCollapsed ? (
            <div className="w-full flex items-center justify-between">
              <Link href="/overview" className="shrink-0" title="LeadMiner">
                <img src="/favicon.svg" alt="LeadMiner Logo" className="w-8 h-8 rounded-lg shadow-sm object-contain" />
              </Link>
              <button
                type="button"
                onClick={handleToggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border/60 bg-surface-200/50 text-text-muted hover:text-text-main hover:bg-surface-200 hover:border-border transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/overview" className="flex items-center space-x-2.5 min-w-0 group">
                <img src="/favicon.svg" alt="LeadMiner Logo" className="w-8 h-8 rounded-lg shrink-0 shadow-sm object-contain" />
                <div className="min-w-0">
                  <span className="font-semibold text-sm tracking-tight text-text-main block truncate group-hover:text-primary transition-colors">
                    LeadMiner
                  </span>
                  <span className="text-[11px] text-text-muted block -mt-0.5 truncate">YouTube Outreach</span>
                </div>
              </Link>
              <div className="flex items-center space-x-2 shrink-0">
                {dryRun && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-medium">
                    DRY RUN
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border/60 bg-surface-200/50 text-text-muted hover:text-text-main hover:bg-surface-200 hover:border-border transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2 space-y-1' : 'p-3.5 space-y-1.5'}`}>
          {!isCollapsed ? (
            <div className="px-3.5 py-1.5 text-xs font-semibold text-text-muted/80 uppercase tracking-wider">
              Platform
            </div>
          ) : (
            <div className="my-2 border-t border-border/60 mx-2" />
          )}

          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (isCollapsed) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  title={item.name}
                  aria-label={item.name}
                  onClick={() => {
                    if (item.href !== pathname) setPendingPath(item.href);
                  }}
                  className={`flex items-center justify-center w-11 h-11 mx-auto rounded-lg transition-all active:scale-[0.98] relative group ${
                    active
                      ? 'bg-surface-200 text-primary border border-primary/30 shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-200/60'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : 'text-text-muted'}`}
                    strokeWidth={active ? 2.2 : 1.75}
                  />
                  {/* Floating tooltip on hover */}
                  <div className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-surface-100 border border-border rounded-md text-xs font-medium text-text-main shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    {item.name}
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (item.href !== pathname) setPendingPath(item.href);
                }}
                className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
                  active
                    ? 'bg-surface-200 text-text-main font-semibold border-l-[3px] border-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-main hover:bg-surface-200/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : 'text-text-muted'}`}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className="truncate text-[13.5px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Sign Out Button */}
        <div className="p-3 border-t border-border mt-auto">
          {isCollapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="flex items-center justify-center w-11 h-11 mx-auto rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-[0.98] group relative"
            >
              <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              <div className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-surface-100 border border-border rounded-md text-xs font-medium text-text-main shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                Sign Out
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              <span className="truncate text-[13.5px]">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* 2. MOBILE TOP APP BAR (< md)                         */}
      {/* ==================================================== */}
      <header className="md:hidden sticky top-0 z-40 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-surface-100/90 backdrop-blur-md border-b border-border px-3.5 sm:px-4 flex items-center justify-between">
        <Link href="/overview" className="flex items-center space-x-2 min-h-[44px]">
          <img src="/favicon.svg" alt="LeadMiner Logo" className="w-7 h-7 rounded-lg shrink-0" />
          <span className="font-semibold text-sm text-text-main tracking-tight">LeadMiner</span>
        </Link>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden xs:inline">Online</span>
          </div>
          {dryRun && (
            <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-medium">
              DRY RUN
            </span>
          )}
          <NotificationCenter />
        </div>
      </header>

      {/* ==================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< md)               */}
      {/* ==================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom,0px))] bg-surface-100/95 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={() => {
                if (item.href !== pathname) setPendingPath(item.href);
              }}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-transform active:scale-95"
            >
              <div
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={active ? 2.2 : 1.75} />
                <span className={`text-[10px] tracking-tight ${active ? 'font-semibold text-text-main' : 'font-normal'}`}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}

        {/* More Drawer Button */}
        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-transform active:scale-95"
          aria-label="More navigation options"
        >
          <div
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${
              isMobileMoreOpen || secondaryNavItems.some((s) => isActive(s.href))
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
            <span className="text-[10px] tracking-tight font-normal">More</span>
          </div>
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
          <div className="relative bg-surface-100 border-t border-border rounded-t-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Grab handle */}
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">All Modules</span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main bg-surface-200 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
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
                    prefetch={true}
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      if (item.href !== pathname) setPendingPath(item.href);
                    }}
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

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all active:scale-95 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
