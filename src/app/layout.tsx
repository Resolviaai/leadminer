import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Navigation } from '../components/navigation';
import { Radio } from 'lucide-react';
import { env } from '../config/env';

export const metadata = {
  title: 'LeadMiner | YouTube Outreach Platform',
  description: 'Autonomous, incremental YouTube lead-generation & cold outreach engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070A0F] text-slate-200 min-h-screen flex flex-col md:flex-row antialiased">
        {/* Responsive Desktop Sidebar + Mobile Topbar & Floating Bottom Nav */}
        <Navigation dryRun={env.DRY_RUN} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar (Desktop Only) */}
          <header className="hidden md:flex h-14 border-b border-white/10 bg-[#0B0F17]/60 backdrop-blur px-6 items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>System Online</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400">Incremental Batch Mode Active</span>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quota: 100/day</span>
              </div>
              <Link
                href="/settings"
                className="px-2.5 py-1 rounded bg-rose-600/10 text-rose-400 border border-rose-600/30 hover:bg-rose-600/20 font-medium transition-colors"
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
