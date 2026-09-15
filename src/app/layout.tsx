import './globals.css';
import React from 'react';
import Link from 'next/link';
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
  ShieldAlert,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export const metadata = {
  title: 'LeadMiner | YouTube Outreach Platform',
  description: 'Autonomous, incremental YouTube lead-generation & cold outreach engine',
};

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Keywords', href: '/keywords', icon: Layers },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Gmail Accounts', href: '/gmail', icon: Mail },
  { name: 'Replies', href: '/replies', icon: Inbox },
  { name: 'Jobs', href: '/jobs', icon: Activity },
  { name: 'Logs', href: '/logs', icon: Terminal },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070A0F] text-slate-200 min-h-screen flex flex-col md:flex-row antialiased">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#0B0F17] border-r border-white/10 flex flex-col shrink-0">
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
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              DRY RUN
            </span>
          </div>

          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Kill Switch Card in Sidebar */}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-14 border-b border-white/10 bg-[#0B0F17]/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
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

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
