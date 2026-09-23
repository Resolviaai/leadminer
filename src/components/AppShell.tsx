'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { NotificationCenter } from './notifications/NotificationCenter';
import { Radio, AlertTriangle } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  dryRun?: boolean;
}

const PUBLIC_PATHS = new Set(['/', '/login', '/privacy', '/terms']);

export function AppShell({ children, dryRun = true }: AppShellProps) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.has(pathname);

  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [expiringCount, setExpiringCount] = useState(0);
  const [authErrorCount, setAuthErrorCount] = useState(0);

  useEffect(() => {
    if (isPublicPage) return;
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/kill-switch');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setKillSwitchActive(Boolean(data.enabled));
            setExpiringCount(Number(data.expiringCount || 0));
            setAuthErrorCount(Number(data.authErrorCount || 0));
          }
        }
      } catch {
        // silent fallback
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isPublicPage]);

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
            {killSwitchActive ? (
              <div className="flex items-center space-x-2 text-xs text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Outreach Paused (Kill Switch)</span>
              </div>
            ) : authErrorCount > 0 ? (
              <div className="flex items-center space-x-2 text-xs text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Inbox Auth Error</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-primary font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>System Online</span>
              </div>
            )}
            <span className="text-border">|</span>
            <span className="text-xs text-text-muted">
              {killSwitchActive ? 'Dispatch Halted' : 'Autopilot Active'}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <NotificationCenter />
            <div className="flex items-center space-x-1.5 text-text-secondary">
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span>Search Quota: 100/day</span>
            </div>
          </div>
        </header>

        {/* Global Warning Banner for Token Expiry or Auth Error (N-P3-4) */}
        {(expiringCount > 0 || authErrorCount > 0) && (
          <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {authErrorCount > 0
                  ? `${authErrorCount} inbox account in AUTH_ERROR status. Re-authenticate to resume sending.`
                  : `${expiringCount} Gmail account token(s) are older than 5 days. Google Testing mode tokens expire after 7 days.`}
              </span>
            </div>
            <Link href="/gmail" className="font-semibold underline hover:text-amber-200 shrink-0 ml-3">
              Manage Inboxes &rarr;
            </Link>
          </div>
        )}

        {/* Page Content with safe mobile padding */}
        <main className="flex-1 w-full px-3.5 py-3 sm:p-4 md:px-6 md:py-3.5 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-3.5 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col items-stretch">
          {children}
        </main>
      </div>
    </div>
  );
}
