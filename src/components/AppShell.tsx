'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { NotificationCenter } from './notifications/NotificationCenter';
import { Radio } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  dryRun?: boolean;
}

const PUBLIC_PATHS = new Set(['/', '/login', '/privacy', '/terms']);

export function AppShell({ children, dryRun = true }: AppShellProps) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.has(pathname);

  // For public pages (Landing Page, Login, Privacy Policy, Terms of Service),
  // render full-width without internal dashboard sidebar or header
  if (isPublicPage) {
    const isHomePage = pathname === '/';
    return (
      <div className={`w-full min-h-screen flex flex-col ${isHomePage ? 'bg-[#FAFAF9] text-neutral-900' : 'bg-[#161616] text-[#e2e8f0]'}`}>
        {children}
      </div>
    );
  }

  // For authenticated dashboard pages, render full sidebar, topbar, and chrome
  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      <Navigation dryRun={dryRun} />

      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        {/* Topbar (Desktop Only) */}
        <header className="hidden md:flex h-14 border-b border-border bg-surface-100/90 backdrop-blur px-6 items-center justify-between shrink-0 relative z-40">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>System Online</span>
            </div>
            <span className="text-border">|</span>
            <span className="text-xs text-text-muted">Autopilot Active</span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <NotificationCenter />
            <div className="flex items-center space-x-1.5 text-text-secondary">
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span>Search Quota: 100/day</span>
            </div>
          </div>
        </header>

        {/* Page Content with safe mobile padding */}
        <main className="flex-1 w-full px-3.5 py-3 sm:p-4 md:px-6 md:py-3.5 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-3.5 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col items-stretch">
          {children}
        </main>
      </div>
    </div>
  );
}
