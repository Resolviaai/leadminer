import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Navigation } from '../components/navigation';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { PwaRegister } from '../components/pwa/PwaRegister';
import { TopProgressBar } from '../components/TopProgressBar';
import { Radio } from 'lucide-react';
import { env } from '../config/env';

export const metadata = {
  title: 'LeadMiner | YouTube Outreach Platform',
  description: 'Autonomous, incremental YouTube lead-generation & cold outreach engine',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LeadMiner',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-studio text-text-main min-h-screen flex flex-col md:flex-row antialiased selection:bg-primary/20 selection:text-primary">
        {/* Top Navigation Progress Indicator */}
        <TopProgressBar />

        {/* Silent PWA Service Worker Registration */}
        <PwaRegister />

        {/* Responsive Desktop Sidebar + Mobile Topbar & Floating Bottom Nav */}
        <Navigation dryRun={env.DRY_RUN} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar (Desktop Only) */}
          <header className="hidden md:flex h-14 border-b border-border bg-surface-100/90 backdrop-blur px-6 items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs text-primary font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>System Online</span>
              </div>
              <span className="text-border">|</span>
              <span className="text-xs text-text-muted">Incremental Autonomous Pipeline</span>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <NotificationCenter />
              <div className="flex items-center space-x-1.5 text-text-secondary">
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span>Search Quota: 100/day</span>
              </div>
              <Link
                href="/settings"
                className="px-2.5 py-1 rounded-md bg-destructive/15 text-danger border border-destructive/30 hover:bg-destructive/25 font-medium transition-colors"
              >
                Kill Switch
              </Link>
            </div>
          </header>

          {/* Page Content with safe mobile padding */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}