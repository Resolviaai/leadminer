import './globals.css';
import React from 'react';
import { Navigation } from '../components/navigation';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { PwaRegister } from '../components/pwa/PwaRegister';
import { TopProgressBar } from '../components/TopProgressBar';
import { Radio } from 'lucide-react';
import { env } from '../config/env';

import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#161616',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'LeadMiner | YouTube Outreach Platform',
  description: 'Autonomous, incremental YouTube lead-generation & cold outreach engine',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LeadMiner',
  },
};

import { AppShell } from '../components/AppShell';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-studio text-text-main min-h-screen antialiased selection:bg-primary/20 selection:text-primary">
        {/* Top Navigation Progress Indicator */}
        <TopProgressBar />

        {/* Silent PWA Service Worker Registration */}
        <PwaRegister />

        {/* Dynamic AppShell: handles public vs authenticated dashboard chrome */}
        <AppShell dryRun={env.DRY_RUN}>{children}</AppShell>
      </body>
    </html>
  );
}