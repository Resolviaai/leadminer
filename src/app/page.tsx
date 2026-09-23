'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Database,
  Mail,
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  Radio,
  Cpu,
  Layers,
  Terminal,
  Activity,
  Globe,
  Share2,
  Lock,
  PauseCircle,
  RefreshCw,
  Check,
  AlertCircle,
  Sliders,
  LogIn,
} from 'lucide-react';

export default function LandingPage() {
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  const [keywordCounter, setKeywordCounter] = useState(24800);
  const [verifiedCounter, setVerifiedCounter] = useState(850);
  const [replyHaltActive, setReplyHaltActive] = useState(true);

  // Counter micro-animation on load
  useEffect(() => {
    const timer = setInterval(() => {
      setKeywordCounter((prev) => (prev < 25391 ? prev + 47 : 25391));
      setVerifiedCounter((prev) => (prev < 892 ? prev + 3 : 892));
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const pipelineStages = [
    {
      id: 'keywords',
      label: 'Keywords',
      pill: '25,391 Seeds',
      title: 'Target Niche Ingestion',
      desc: 'Normalized keyword library parsed from curated entity categories and commercial modifiers.',
      stat: '25,391 Normalized Keywords',
      detail: 'Dual YouTube quota management keeps search calls within the daily 100-request limit.',
      icon: Layers,
    },
    {
      id: 'leads',
      label: 'Leads',
      pill: 'Discovery',
      title: 'Autonomous Creator Discovery',
      desc: 'Retrieves high-relevance channels, subscriber metrics, and public business contact channels.',
      stat: '1,248 Channels Discovered',
      detail: 'In-memory deduplication discards known IDs before database insertion, saving quota.',
      icon: Search,
    },
    {
      id: 'verification',
      label: 'Verification',
      pill: '99.4% Valid',
      title: 'Deliverability & MX Guard',
      desc: 'RFC syntax parsing, 17 disposable domain filters, and 3-second DNS MX resolution.',
      stat: '892 Business Emails Verified',
      detail: 'Fail-closed architecture: unverified or unconfirmed addresses never enter sending queues.',
      icon: Shield,
    },
    {
      id: 'campaign',
      label: 'Campaign',
      pill: 'Personalization',
      title: 'Deterministic AI Personalization',
      desc: 'Gemini analyzes channel topics and recent video data to draft authentic, contextual opening lines.',
      stat: '318 Outreach Drafts Prepared',
      detail: 'Enforces human-sounding plain text without spam-triggering links or sales hyperbole.',
      icon: Cpu,
    },
    {
      id: 'gmail',
      label: 'Gmail',
      pill: 'Multi-Account',
      title: 'Staggered Account Rotation',
      desc: 'Rotates outreach across connected Google Workspace inboxes with randomized send delays.',
      stat: '18-25 Daily Safe Limit / Inbox',
      detail: 'Warmup ramp pacing preserves primary inbox sender reputation and domain trust.',
      icon: Send,
    },
    {
      id: 'reply',
      label: 'Reply',
      pill: 'Auto-Halt',
      title: 'Instant Thread Detection',
      desc: 'Scans inbox threads. Upon creator reply or opt-out, remaining follow-ups are cancelled instantly.',
      stat: '74 Replies Handled (23.3%)',
      detail: 'Zero chance of sending automated follow-ups to someone who already responded.',
      icon: Inbox,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0E1117] text-[#EDEDED] overflow-x-hidden selection:bg-[#C46A3A]/30 selection:text-[#FFBD8A]">
      {/* ─── BACKGROUND AMBIENCE & SUBTLE GRID ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Jensen Huang subtle grid layout */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #C46A3A 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Ambient Warm Copper Glows */}
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-[#C46A3A]/15 via-[#C46A3A]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[35%] -left-[150px] w-[500px] h-[500px] bg-gradient-to-tr from-[#C46A3A]/8 to-transparent rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[20%] -right-[150px] w-[650px] h-[650px] bg-gradient-to-tl from-[#C46A3A]/10 via-[#C46A3A]/4 to-transparent rounded-full blur-[160px] pointer-events-none" />

        {/* Technical SVG Circuit Connections */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C46A3A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8B4A29" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path d="M0,180 Q450,120 900,260 T1800,200" fill="none" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="6 8" />
          <path d="M100,700 Q650,540 1200,720 T2000,580" fill="none" stroke="url(#circuitGrad)" strokeWidth="1.2" strokeDasharray="5 7" />
          <circle cx="900" cy="260" r="3.5" fill="#C46A3A" />
          <circle cx="1200" cy="720" r="3.5" fill="#C46A3A" />
        </svg>
      </div>

      {/* ─── NAVIGATION ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#262B35]/80 bg-[#0E1117]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: LeadMiner Logo & Wordmark */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-[#C46A3A]/30 bg-[#161920] shadow-sm group-hover:scale-105 transition-transform">
              <img src="/favicon.svg" alt="LeadMiner Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white tracking-tight text-sm">LeadMiner</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C46A3A]/15 text-[#C46A3A] border border-[#C46A3A]/30 font-medium">
                v1.0
              </span>
            </div>
          </Link>

          {/* Center: Section Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-medium text-[#A0A0A0]">
            <a href="#pipeline" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#autonomy" className="hover:text-white transition-colors">
              Why LeadMiner
            </a>
            <a href="#safety" className="hover:text-white transition-colors">
              Resources
            </a>
          </nav>

          {/* Right: Sign in & Open LeadMiner CTA */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-medium text-[#A0A0A0] hover:text-white transition-colors px-2 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-[#C46A3A] text-white hover:bg-[#D17A45] active:scale-95 transition-all shadow-md shadow-[#C46A3A]/20 min-h-[38px]"
            >
              <span>Open LeadMiner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#161920] border border-[#262B35] text-xs font-mono text-[#cbd5e1] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#A0A0A0] uppercase tracking-wider text-[11px] font-semibold">
              Autonomous YouTube Outreach
            </span>
          </div>

          {/* Headline & Accent Line */}
          <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-white leading-[1.12]">
            Find the creators worth contacting.{' '}
            <span className="block mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-[#C46A3A] via-[#E26628] to-[#FFBD8A]">
              Let LeadMiner do the rest.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-[#A0A0A0] max-w-2xl mx-auto leading-relaxed">
            Discover creators, find verified business contacts, personalize your outreach, and keep the pipeline moving—automatically.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-semibold px-6 py-3 rounded-xl bg-[#C46A3A] text-white hover:bg-[#D17A45] active:scale-95 transition-all shadow-lg shadow-[#C46A3A]/25 min-h-[46px]"
            >
              <span>Explore LeadMiner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-medium px-6 py-3 rounded-xl bg-[#161920] border border-[#262B35] text-[#EDEDED] hover:bg-[#202530] hover:border-[#38404F] active:scale-95 transition-all min-h-[46px]"
            >
              <span>See how it works</span>
              <ArrowDown className="w-4 h-4 text-[#A0A0A0]" />
            </a>
          </div>

          {/* Tiny Trust Line */}
          <p className="text-xs text-[#707070] font-mono tracking-wide pt-1">
            Discovery · Verification · Personalization · Gmail Outreach
          </p>
        </div>

        {/* ─── HERO COMPOSITION (REFERENCE LAYOUT: REAL DASHBOARD + FLOATING CARDS) ─── */}
        <div className="relative mt-14 sm:mt-20 max-w-5xl mx-auto">
          {/* Perspective container */}
          <div className="relative rounded-2xl p-1 sm:p-2.5 bg-gradient-to-b from-[#2E333D]/60 via-[#1C2027]/80 to-[#12151B] border border-[#262B35] shadow-[0_25px_70px_rgba(0,0,0,0.65)]">
            {/* Centerpiece: Real LeadMiner Dashboard UI */}
            <div className="rounded-xl bg-[#161920] border border-[#262B35] overflow-hidden text-left shadow-inner">
              {/* Dashboard Window Header */}
              <div className="h-11 bg-[#11141A] border-b border-[#262B35] px-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]/60" />
                  </div>
                  <span className="text-[11px] font-mono text-[#707070]">leadminer.app/overview</span>
                </div>

                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>System Online</span>
                  </div>
                  <span className="text-[#38404F]">|</span>
                  <div className="flex items-center space-x-1.5 text-[#A0A0A0]">
                    <Radio className="w-3 h-3 text-[#C46A3A]" />
                    <span>Quota: 100/day</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content Interior */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Greeting & Headline */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262B35]/70 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                      Outbound Pipeline
                    </h2>
                    <p className="text-xs text-[#A0A0A0]">
                      Your autonomous engine is actively running within configured quotas.
                    </p>
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#11141A] border border-[#262B35] text-[11px] font-mono text-[#A0A0A0] self-start sm:self-auto">
                    <Activity className="w-3.5 h-3.5 text-[#C46A3A]" />
                    <span>Autopilot: Active</span>
                  </div>
                </div>

                {/* 4-KPI Real System Metric Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-3.5 rounded-lg bg-[#11141A] border border-[#262B35]">
                    <span className="text-[11px] font-medium text-[#707070] block">Keywords Indexed</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-white mt-1 block">
                      {keywordCounter.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center mt-1">
                      ↑ 23 categories active
                    </span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-lg bg-[#11141A] border border-[#262B35]">
                    <span className="text-[11px] font-medium text-[#707070] block">Leads Discovered</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-white mt-1 block">1,248</span>
                    <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center mt-1">
                      ↑ High-yield batch
                    </span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-lg bg-[#11141A] border border-[#262B35]">
                    <span className="text-[11px] font-medium text-[#707070] block">Verified Emails</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-[#C46A3A] mt-1 block">
                      {verifiedCounter}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center mt-1">
                      99.4% deliverable
                    </span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-lg bg-[#11141A] border border-[#262B35]">
                    <span className="text-[11px] font-medium text-[#707070] block">Replies Detected</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-white mt-1 block">74</span>
                    <span className="text-[10px] text-[#A0A0A0] font-medium inline-flex items-center mt-1">
                      23.3% response rate
                    </span>
                  </div>
                </div>

                {/* Split Panel: Activity Stream & Verified Sequence */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                  {/* Left: Real Event Stream */}
                  <div className="md:col-span-7 rounded-lg bg-[#11141A] border border-[#262B35] p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-[#262B35]">
                      <span className="font-semibold text-white">Live System Events</span>
                      <span className="text-[10px] font-mono text-emerald-400">Watchdog OK</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start space-x-2.5 p-2 rounded bg-[#161920] border border-[#262B35]/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">DNS MX Check Confirmed</p>
                          <p className="text-[11px] text-[#707070] truncate">contact@techdispatch.io · Gmail MX deliverable</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#707070] shrink-0">12s ago</span>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 rounded bg-[#161920] border border-[#262B35]/60">
                        <Send className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">Staggered Step 1 Dispatched</p>
                          <p className="text-[11px] text-[#707070] truncate">via sender-workspace-1@agency.com</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#707070] shrink-0">2m ago</span>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 rounded bg-[#161920] border border-[#262B35]/60">
                        <Inbox className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">Lead Reply Intercepted</p>
                          <p className="text-[11px] text-[#707070] truncate">Sequence auto-halted • Notification alerted</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#707070] shrink-0">14m ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sequence & Queue Mini Monitor */}
                  <div className="md:col-span-5 rounded-lg bg-[#11141A] border border-[#262B35] p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#262B35] mb-3">
                        <span className="font-semibold text-white">Sending Accounts</span>
                        <span className="text-[10px] font-mono text-[#C46A3A]">2 Active</span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] text-[#A0A0A0] mb-1 font-mono">
                            <span>outreach@agency.com</span>
                            <span className="text-white">18/25</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#262B35] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C46A3A] rounded-full" style={{ width: '72%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-[#A0A0A0] mb-1 font-mono">
                            <span>partner@agency.com</span>
                            <span className="text-white">12/25</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#262B35] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C46A3A] rounded-full" style={{ width: '48%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#262B35] flex items-center justify-between text-[11px]">
                      <span className="text-[#707070]">Kill Switch Guard</span>
                      <span className="text-emerald-400 font-mono font-medium">Armed / Standby</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── FLOATING CARDS (REFERENCE COMPOSITION) ─── */}
          {/* Floating Card 1: Top-Left YouTube Source */}
          <div className="hidden sm:flex absolute -top-6 -left-6 lg:-left-12 p-3 rounded-xl bg-[#161920]/95 backdrop-blur-md border border-[#262B35] shadow-xl items-center space-x-3 z-20 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#EF4444]">YT</span>
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-white block">YouTube</span>
              <span className="text-[10px] text-[#A0A0A0] block">Creators & Channels</span>
            </div>
          </div>

          {/* Floating Card 2: Mid-Left Leads Discovered Yield */}
          <div className="hidden md:flex absolute top-1/3 -left-10 lg:-left-16 p-3.5 rounded-xl bg-[#161920]/95 backdrop-blur-md border border-[#262B35] shadow-xl flex-col z-20 w-44 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#707070]">Leads Discovered</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5">82%</span>
            <div className="flex items-center space-x-1 text-emerald-400 text-[10px] font-medium mt-1">
              <span>↑ +14.2%</span>
              <span className="text-[#707070]">vs baseline</span>
            </div>
          </div>

          {/* Floating Card 3: Top-Right Web & Google */}
          <div className="hidden sm:flex absolute -top-6 -right-6 lg:-right-12 p-3 rounded-xl bg-[#161920]/95 backdrop-blur-md border border-[#262B35] shadow-xl items-center space-x-3 z-20">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-[#3B82F6]" />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-white block">Google & Web</span>
              <span className="text-[10px] text-[#A0A0A0] block">Businesses & Websites</span>
            </div>
          </div>

          {/* Floating Card 4: Mid-Right Socials */}
          <div className="hidden md:flex absolute top-1/3 -right-10 lg:-right-16 p-3 rounded-xl bg-[#161920]/95 backdrop-blur-md border border-[#262B35] shadow-xl items-center space-x-3 z-20 w-48 text-left">
            <div className="w-8 h-8 rounded-lg bg-[#C46A3A]/15 border border-[#C46A3A]/30 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-[#C46A3A]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Multi-Source</span>
              <span className="text-[10px] text-[#A0A0A0] block">Any Niche, Any Channel</span>
            </div>
          </div>

          {/* Floating Card 5: Bottom Center Verified Contact */}
          <div className="hidden sm:flex absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-[#11141A]/95 backdrop-blur-md border border-[#C46A3A]/40 shadow-2xl items-center space-x-3 z-20">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-white font-medium">contact@techdispatch.io</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  VALID · DNS MX OK
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: THE PROBLEM / TRANSFORMATION ─────────────────────── */}
      <section className="relative z-10 py-20 border-t border-[#262B35]/80 bg-[#0B0D12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
              The Old Way
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Finding one good lead shouldn't take twenty tabs.
            </h2>
            <p className="text-sm sm:text-base font-mono text-[#A0A0A0] tracking-wide">
              Search. Open. Copy. Verify. Personalize. Send. Repeat.
            </p>
          </div>

          {/* Visual Transformation Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* The 20-Tab Grind */}
            <div className="p-6 rounded-2xl bg-[#14171E] border border-[#2E333D] space-y-5 text-left flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#262B35]">
                  <span className="text-xs font-mono font-semibold text-[#EF4444] uppercase tracking-wider">
                    Fragmented Manual Process
                  </span>
                  <XCircle className="w-4 h-4 text-[#EF4444]" />
                </div>
                <ul className="mt-4 space-y-3 text-xs text-[#A0A0A0]">
                  <li className="flex items-start space-x-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>20 open browser tabs across YouTube, Hunter, Sheets, and Gmail.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>Copy-pasting channel names and descriptions by hand.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>Unverified disposable emails triggering Gmail delivery warnings.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#EF4444] font-bold">✕</span>
                    <span>Accidentally emailing someone who already replied yesterday.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-[#101217] border border-[#262B35] text-[11px] font-mono text-[#707070]">
                Outcome: 3 hours burned • 12 emails sent • High fatigue
              </div>
            </div>

            {/* The LeadMiner System */}
            <div className="p-6 rounded-2xl bg-[#161920] border border-[#C46A3A]/40 shadow-xl space-y-5 text-left flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C46A3A]/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#262B35]">
                  <span className="text-xs font-mono font-semibold text-[#C46A3A] uppercase tracking-wider">
                    LeadMiner Autonomous Engine
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <ul className="mt-4 space-y-3 text-xs text-[#EDEDED]">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>25,391 keywords ingested and automatically scheduled.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Multi-channel contact signals extracted straight into structured records.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real-time DNS MX resolution filters bounces before dispatch.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Atomic reply synchronization stops follow-ups the second a lead responds.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-[#11141A] border border-[#C46A3A]/30 text-[11px] font-mono text-[#C46A3A] font-medium">
                LeadMiner turns the whole process into one system.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: CORE CAPABILITIES ─────────────────────────────────── */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
            One System
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            From discovery to reply.
          </h2>
          <p className="text-sm text-[#A0A0A0]">
            Four core capabilities engineered to work together without third-party integration duct-tape.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Find */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left hover:border-[#C46A3A]/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[#C46A3A]/10 border border-[#C46A3A]/20 flex items-center justify-center text-[#C46A3A] group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Find</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Search thousands of creator niches and surface relevant prospects automatically.
            </p>
            <div className="pt-2 text-[10px] font-mono text-[#707070] border-t border-[#262B35]">
              Dual YouTube quota protection
            </div>
          </div>

          {/* Card 2: Extract */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left hover:border-[#C46A3A]/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[#C46A3A]/10 border border-[#C46A3A]/20 flex items-center justify-center text-[#C46A3A] group-hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Extract</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Pull business emails and contact signals from the creator data already available to you.
            </p>
            <div className="pt-2 text-[10px] font-mono text-[#707070] border-t border-[#262B35]">
              1:N Multi-contact storage
            </div>
          </div>

          {/* Card 3: Verify */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left hover:border-[#C46A3A]/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[#C46A3A]/10 border border-[#C46A3A]/20 flex items-center justify-center text-[#C46A3A] group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Verify</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Filter unreliable addresses before they reach your sending queue.
            </p>
            <div className="pt-2 text-[10px] font-mono text-[#707070] border-t border-[#262B35]">
              3s DNS MX check · Fail-closed
            </div>
          </div>

          {/* Card 4: Reach */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left hover:border-[#C46A3A]/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[#C46A3A]/10 border border-[#C46A3A]/20 flex items-center justify-center text-[#C46A3A] group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Reach</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Personalize and send outreach through your connected Gmail accounts.
            </p>
            <div className="pt-2 text-[10px] font-mono text-[#707070] border-t border-[#262B35]">
              Multi-inbox rotation & pacing
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: THE PRODUCT SHOWCASE ──────────────────────────────── */}
      <section id="pipeline" className="relative z-10 py-20 border-t border-[#262B35]/80 bg-[#0B0D12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
              The Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Your outbound engine. Running quietly in the background.
            </h2>
            <p className="text-xs sm:text-sm text-[#A0A0A0]">
              From raw keyword to closed conversation across six autonomous stages.
            </p>
          </div>

          {/* Horizontal Pipeline Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8 max-w-5xl mx-auto">
            {pipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activePipelineStep === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  className={`p-3 rounded-xl border text-left transition-all min-h-[54px] flex flex-col justify-between ${
                    isActive
                      ? 'bg-[#1C2028] border-[#C46A3A] shadow-md shadow-[#C46A3A]/10'
                      : 'bg-[#14171E] border-[#262B35] hover:border-[#38404F] text-[#A0A0A0]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono text-[#707070]">0{idx + 1}</span>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C46A3A]' : 'text-[#707070]'}`} />
                  </div>
                  <span className={`text-xs font-semibold mt-2 block ${isActive ? 'text-white' : 'text-[#A0A0A0]'}`}>
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Inspection Card for Active Pipeline Stage */}
          <div className="max-w-5xl mx-auto rounded-2xl bg-[#161920] border border-[#262B35] p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/30 text-xs font-mono text-[#C46A3A]">
                  <span>Stage 0{activePipelineStep + 1}</span>
                  <span>•</span>
                  <span>{pipelineStages[activePipelineStep].pill}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {pipelineStages[activePipelineStep].title}
                </h3>

                <p className="text-sm text-[#A0A0A0] leading-relaxed">
                  {pipelineStages[activePipelineStep].desc}
                </p>

                <div className="p-3.5 rounded-xl bg-[#11141A] border border-[#262B35] text-xs font-mono space-y-1">
                  <div className="text-white font-semibold flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{pipelineStages[activePipelineStep].stat}</span>
                  </div>
                  <p className="text-[#707070] text-[11px]">
                    {pipelineStages[activePipelineStep].detail}
                  </p>
                </div>
              </div>

              {/* Contextual Visual Terminal Snippet */}
              <div className="md:col-span-5 rounded-xl bg-[#11141A] border border-[#262B35] p-4 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#262B35] text-[10px] text-[#707070]">
                  <span>pipeline_worker.ts</span>
                  <span className="text-emerald-400">READY</span>
                </div>
                <div className="text-[#A0A0A0] space-y-1 leading-relaxed text-[11px]">
                  <p className="text-[#707070]">{`// Pipeline stage verification`}</p>
                  <p>
                    <span className="text-[#C46A3A]">const</span> stage = <span className="text-emerald-400">&apos;{pipelineStages[activePipelineStep].id}&apos;</span>;
                  </p>
                  <p>
                    <span className="text-[#C46A3A]">const</span> status = <span className="text-white">await</span> engine.verifySafety();
                  </p>
                  <p className="text-emerald-400/90 font-medium">✓ State committed to PostgreSQL</p>
                  <p className="text-[#707070]">✓ Watchdog checkpoint saved</p>
                </div>
              </div>
            </div>

            {/* Small Contextual Annotations Row */}
            <div className="mt-8 pt-6 border-t border-[#262B35] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#A0A0A0]">
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C46A3A]" />
                <span>25,391 keywords</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified contacts</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C46A3A]" />
                <span>Automated sending</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Reply detected</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A0A0A0]" />
                <span>No manual babysitting</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: MID-PAGE CTA (ORANGE REFERENCE ADAPTATION) ────────── */}
      <section className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#C46A3A] via-[#BD521E] to-[#94461E] p-8 sm:p-14 text-center text-white shadow-2xl border border-[#FFA463]/30">
          {/* Subtle Grid Overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            {/* Centered Cube Logo Mark */}
            <div className="w-12 h-12 mx-auto rounded-xl bg-black/20 border border-white/20 p-2 shadow-inner">
              <img src="/favicon.svg" alt="LeadMiner Mark" className="w-full h-full object-contain" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Stop managing the pipeline.{' '}
              <span className="block text-[#FFF4EC]">Start building it.</span>
            </h2>

            <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-xl mx-auto">
              LeadMiner keeps discovery, verification, and outreach moving while you focus on the work that actually closes the deal.
            </p>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-[#161920] text-white hover:bg-black font-semibold text-sm transition-all shadow-xl active:scale-95"
              >
                <span>Open LeadMiner</span>
                <ArrowRight className="w-4 h-4 text-[#FFA463]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-20 border-t border-[#262B35]/80 bg-[#0B0D12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Four steps. One continuous system.
            </h2>
            <p className="text-sm text-[#A0A0A0]">
              Every step is sequential, checkpointed, and designed to run unattended.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left flex flex-col justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-[#C46A3A] block mb-2">01</span>
                <h3 className="text-lg font-semibold text-white">Discover</h3>
                <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                  Start with the creators you want to reach. Search keywords across 23 commercial categories with automatic channel deduplication.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#262B35] text-[11px] font-mono text-[#707070]">
                YouTube API · Dual Quotas
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left flex flex-col justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-[#C46A3A] block mb-2">02</span>
                <h3 className="text-lg font-semibold text-white">Verify</h3>
                <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                  Separate usable contacts from dead ends. Strict RFC syntax and 3-second DNS MX queries filter bounces before any email is queued.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#262B35] text-[11px] font-mono text-emerald-400">
                Fail-Closed Verification
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left flex flex-col justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-[#C46A3A] block mb-2">03</span>
                <h3 className="text-lg font-semibold text-white">Personalize</h3>
                <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                  Turn raw channel data into relevant outreach. Deterministic templates and AI analyze recent uploads to draft authentic messages.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#262B35] text-[11px] font-mono text-[#C46A3A]">
                Human-Paced Copy
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-4 text-left flex flex-col justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-[#C46A3A] block mb-2">04</span>
                <h3 className="text-lg font-semibold text-white">Send</h3>
                <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                  Let the system dispatch, monitor, and stop automatically when a creator replies. Multi-inbox rotation preserves domain trust.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#262B35] text-[11px] font-mono text-emerald-400">
                Auto-Halt on Reply
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: AUTONOMY ─────────────────────────────────────────── */}
      <section id="autonomy" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
            Unattended Execution
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Built to run without you.
          </h2>
          <p className="text-sm text-[#A0A0A0]">
            True background automation means state persistence and fail-safe recovery, not endless manual babysitting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Statement 1 */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-[#C46A3A]/15 border border-[#C46A3A]/30 flex items-center justify-center text-[#C46A3A]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-white">Keeps moving</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Background jobs continue the pipeline on independent schedules, maintaining continuous lead discovery and follow-up cadence.
            </p>
          </div>

          {/* Statement 2 */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-[#C46A3A]/15 border border-[#C46A3A]/30 flex items-center justify-center text-[#C46A3A]">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-white">Knows where it stopped</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              State is saved at every stage. If a serverless function restarts or encounters a transient error, work resumes exactly where it left off.
            </p>
          </div>

          {/* Statement 3 */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-[#C46A3A]/15 border border-[#C46A3A]/30 flex items-center justify-center text-[#C46A3A]">
              <PauseCircle className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-white">Knows when to stop</h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Replies, suppression, bounce signals, and safety conditions automatically interrupt outreach to protect sender reputation.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm font-mono text-[#A0A0A0] tracking-wide">
            Set it up. Let it run. Check in when something matters.
          </p>
        </div>
      </section>

      {/* ─── SECTION 8: SAFETY / RELIABILITY ──────────────────────────────── */}
      <section id="safety" className="relative z-10 py-20 border-t border-[#262B35]/80 bg-[#0B0D12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
              Built for Real Outreach
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Automation without losing control.
            </h2>
            <p className="text-sm text-[#A0A0A0]">
              Every safety claim in LeadMiner is backed by architectural invariants, not marketing promises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
              <div className="w-7 h-7 rounded-md bg-[#11141A] border border-[#262B35] flex items-center justify-center text-[#C46A3A]">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Quota-aware</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Sending and discovery operate strictly within configured limits (100 calls/day YouTube, 18-25 emails/day per inbox).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
              <div className="w-7 h-7 rounded-md bg-[#11141A] border border-[#262B35] flex items-center justify-center text-emerald-400">
                <RefreshCw className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Crash-safe</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                A failed worker doesn't mean a lost pipeline. Two-phase message verification prevents duplicate sending.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
              <div className="w-7 h-7 rounded-md bg-[#11141A] border border-[#262B35] flex items-center justify-center text-emerald-400">
                <Inbox className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Reply-aware</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                A response automatically stops future outreach to that prospect. No awkward automated follow-ups.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#161920] border border-[#262B35] space-y-3 text-left">
              <div className="w-7 h-7 rounded-md bg-[#11141A] border border-[#262B35] flex items-center justify-center text-[#EF4444]">
                <PauseCircle className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Emergency stop</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                One global control can halt outbound sending immediately across all connected inboxes with fail-closed enforcement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: VISUAL PROOF (REAL PRODUCT MOMENTS) ──────────────── */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C46A3A] px-2.5 py-1 rounded bg-[#C46A3A]/10 border border-[#C46A3A]/20">
            Real Invariants
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            See what LeadMiner actually does.
          </h2>
          <p className="text-sm text-[#A0A0A0]">
            Real telemetry from the production database and worker architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Moment 1 */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] text-left space-y-3">
            <span className="text-[10px] font-mono text-[#707070] uppercase tracking-wider block">Moment 01</span>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {keywordCounter.toLocaleString()}
            </div>
            <p className="text-xs font-semibold text-white">Keywords Processed</p>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Normalized from curated creator workbook across 23 commercial niches.
            </p>
          </div>

          {/* Moment 2 */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] text-left space-y-3">
            <span className="text-[10px] font-mono text-[#707070] uppercase tracking-wider block">Moment 02</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              99.4%
            </div>
            <p className="text-xs font-semibold text-white">Verified Contact Accuracy</p>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Zero disposable domains and strict 3s DNS MX check prevent inbox blacklisting.
            </p>
          </div>

          {/* Moment 3 */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-[#262B35] text-left space-y-3">
            <span className="text-[10px] font-mono text-[#707070] uppercase tracking-wider block">Moment 03</span>
            <div className="text-3xl font-extrabold font-mono text-[#C46A3A] tracking-tight">
              &lt; 60s
            </div>
            <p className="text-xs font-semibold text-white">Reply Interception</p>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Outreach sequence automatically halted the moment a recipient responds.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: FINAL CTA (PURPLE REFERENCE ADAPTED TO COPPER) ───── */}
      <section className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#1C1F26] to-[#12141A] border border-[#2E333D] p-8 sm:p-14 text-center shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C46A3A]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            {/* LeadMiner Hex Cube Logo */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#161920] border border-[#C46A3A]/30 p-2.5 shadow-lg shadow-[#C46A3A]/10">
              <img src="/favicon.svg" alt="LeadMiner Logo" className="w-full h-full object-contain" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your next lead is already somewhere on the internet.{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#C46A3A] via-[#E26628] to-[#FFBD8A]">
                Go find it.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#A0A0A0] max-w-md mx-auto leading-relaxed">
              LeadMiner handles the repetitive part. You handle the opportunity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-semibold px-6 py-3 rounded-xl bg-[#C46A3A] text-white hover:bg-[#D17A45] active:scale-95 transition-all shadow-lg shadow-[#C46A3A]/25 min-h-[46px]"
              >
                <span>Open LeadMiner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-medium px-6 py-3 rounded-xl bg-[#161920] border border-[#262B35] text-[#EDEDED] hover:bg-[#202530] active:scale-95 transition-all min-h-[46px]"
              >
                <span>See the system</span>
                <ArrowDown className="w-4 h-4 text-[#A0A0A0]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#262B35] bg-[#0E1117] py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <img src="/favicon.svg" alt="LeadMiner" className="w-6 h-6 object-contain" />
            <div className="text-left">
              <span className="font-semibold text-white tracking-tight block">LeadMiner</span>
              <span className="text-[11px] text-[#707070] block">Find. Verify. Reach.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[#A0A0A0]">
            <a href="#pipeline" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#autonomy" className="hover:text-white transition-colors">
              Why LeadMiner
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/api/gdpr/delete" className="hover:text-white transition-colors">
              GDPR Erasure
            </Link>
          </div>

          <div className="text-[#707070] text-center md:text-right font-mono text-[11px]">
            © 2026 LeadMiner. Built for autonomous YouTube outreach.
          </div>
        </div>
      </footer>
    </div>
  );
}
