'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  Send,
  BarChart3,
  Check,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Layers,
  Shield,
  Cpu,
  Zap,
  Globe,
  Quote,
  Sparkles,
  Sliders,
  Bell,
  Settings,
  Flame,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  const [emailInput, setEmailInput] = useState('');

  // Active showcase step
  const [activeShowcase, setActiveShowcase] = useState(0);

  // Animated KPI numbers
  const [leadsFound, setLeadsFound] = useState(1200);
  const [verifiedEmails, setVerifiedEmails] = useState(860);

  useEffect(() => {
    const timer = setInterval(() => {
      setLeadsFound((prev) => (prev < 1248 ? prev + 4 : 1248));
      setVerifiedEmails((prev) => (prev < 892 ? prev + 3 : 892));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-neutral-900 font-sans selection:bg-[#C46A3A]/20 selection:text-[#C46A3A] relative overflow-x-hidden">
      {/* ─── GLOBAL BACKGROUND GRID PATTERN ─── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 15%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 15%, black 40%, transparent 95%)',
        }}
      />

      {/* ─── ATMOSPHERIC GRADIENTS ─── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-100/50 via-orange-100/30 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#C46A3A]/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* ─── 1. TOP NAVIGATION ─── */}
      <header className="relative z-30 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#C46A3A] flex items-center justify-center text-white shadow-sm shadow-[#C46A3A]/30 transition-transform group-hover:scale-105">
            {/* LeadMiner geometric polygon mark */}
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 stroke-white stroke-[2.2]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">LeadMiner</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
          <a href="#product" className="hover:text-neutral-900 transition-colors">Product</a>
          <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">How it works</a>
          <a href="#use-cases" className="hover:text-neutral-900 transition-colors">Use cases</a>
          <a href="#features" className="hover:text-neutral-900 transition-colors">Pricing</a>
          <div className="flex items-center gap-1 cursor-pointer hover:text-neutral-900 transition-colors">
            <span>Resources</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/overview"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-2 py-1"
          >
            Sign in
          </Link>
          <Link
            href="/overview"
            className="inline-flex items-center gap-1.5 bg-[#C46A3A] hover:bg-[#D17A45] text-white text-sm font-medium rounded-full px-5 py-2.5 shadow-sm hover:shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Open LeadMiner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ─── */}
      <section className="relative z-20 pt-8 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        {/* Eyebrow Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/70 text-blue-900 text-xs font-semibold tracking-wide shadow-xs mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Built for B2B SaaS & Financial Firms</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-neutral-900 max-w-4xl mx-auto leading-[1.08]"
        >
          YouTube Leads.
          <br />
          <span className="text-neutral-900">Real </span>
          <span className="text-[#C46A3A]">Opportunities.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto mt-5 leading-relaxed"
        >
          Find high-intent businesses on YouTube, extract verified contacts,
          and send personalized outreach — <span className="font-semibold text-neutral-800">automatically.</span>
        </motion.p>

        {/* Email Input + CTA Container */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 max-w-md mx-auto"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = '/overview';
            }}
            className="bg-white p-1.5 pl-5 rounded-full border border-neutral-200 shadow-lg shadow-neutral-200/50 flex items-center justify-between gap-2"
          >
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your work email"
              className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
            />
            <Link
              href="/overview"
              className="bg-[#C46A3A] hover:bg-[#D17A45] text-white text-sm font-medium rounded-full px-5 py-2.5 shrink-0 flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore LeadMiner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </form>

          {/* Trust Checkmarks */}
          <div className="flex items-center justify-center gap-5 sm:gap-7 mt-3.5 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-600 stroke-[2.5]" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-600 stroke-[2.5]" />
              Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-neutral-600 stroke-[2.5]" />
              Fully automated
            </span>
          </div>
        </motion.div>

        {/* ─── HERO PRODUCT SHOWCASE + FLOATING DEMO CARDS ─── */}
        <div className="relative mt-14 sm:mt-16 max-w-5xl mx-auto">
          {/* Ambient Glow Shelf under the Product */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-r from-orange-300/30 via-[#C46A3A]/40 to-orange-300/30 blur-2xl rounded-full pointer-events-none" />

          {/* ─── FLOATING CARD: YOUTUBE (TOP-LEFT) ─── */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex absolute -top-8 -left-8 z-30 bg-white/95 backdrop-blur-sm border border-neutral-200/90 shadow-xl shadow-neutral-200/60 rounded-2xl p-3.5 items-center gap-3 w-56 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-red-500/30">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900 leading-tight">YouTube</div>
              <div className="text-xs text-neutral-500 font-medium">Creators & Channels</div>
            </div>
          </motion.div>

          {/* ─── FLOATING CARD: LEADS DISCOVERED 82% (BOTTOM-LEFT) ─── */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden lg:block absolute bottom-12 -left-12 z-30 bg-white border border-neutral-200/90 shadow-2xl shadow-neutral-200/80 rounded-2xl p-4 w-48 text-left -rotate-2 hover:rotate-0 transition-transform"
          >
            {/* Blue corner fold / ribbon */}
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[18px] border-t-blue-500 border-l-[18px] border-l-transparent rounded-tr-2xl" />

            <div className="text-xs font-semibold text-neutral-500 tracking-tight">Leads Discovered</div>
            <div className="text-3xl font-black text-neutral-900 mt-0.5 tracking-tight">82%</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <span>↑ +3.4%</span>
              <span className="text-neutral-400 font-normal">vs last month</span>
            </div>

            {/* Sparkline curve */}
            <svg className="w-full h-8 mt-2 overflow-visible" viewBox="0 0 100 30">
              <path
                d="M0 24 Q 25 22, 40 14 T 70 18 T 100 4"
                fill="none"
                stroke="#C46A3A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="4" r="3" fill="#C46A3A" />
            </svg>
          </motion.div>

          {/* ─── FLOATING ANNOTATIONS & RIGHT-SIDE CARDS ─── */}
          {/* Top Right Annotation: "More sources. More opportunities." */}
          <div className="hidden xl:block absolute -top-12 -right-8 z-30 pointer-events-none select-none text-right">
            <span className="font-serif italic text-neutral-500 text-sm tracking-wide">
              More sources.
              <br />
              More opportunities.
            </span>
            <svg className="w-12 h-10 ml-auto text-neutral-400 mt-1" viewBox="0 0 50 40" fill="none">
              <path d="M40 5 Q 30 25, 10 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M12 26 L 8 33 L 17 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* ─── FLOATING CARD: GOOGLE (TOP-RIGHT) ─── */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="hidden lg:flex absolute top-4 -right-10 z-30 bg-white/95 backdrop-blur-sm border border-neutral-200/90 shadow-xl shadow-neutral-200/60 rounded-2xl p-3.5 items-center gap-3 w-56 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center shrink-0 shadow-xs">
              {/* Google 4-color G */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.26 21.3 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32 0-.83.13-1.6.38-2.32V6.59H1.27C.46 8.21 0 10.05 0 12c0 1.95.46 3.79 1.27 5.41l4.01-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.7 1.27 6.59l4.01 3.09c.95-2.83 3.6-4.93 6.72-4.93z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900 leading-tight">Google</div>
              <div className="text-xs text-neutral-500 font-medium">Businesses & Websites</div>
            </div>
          </motion.div>

          {/* ─── FLOATING CARD: LINKEDIN (MID-RIGHT) ─── */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 15 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="hidden lg:flex absolute top-28 -right-6 z-30 bg-white/95 backdrop-blur-sm border border-neutral-200/90 shadow-xl shadow-neutral-200/60 rounded-2xl p-3.5 items-center gap-3 w-56 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#0A66C2]/30">
              <span className="font-bold text-lg leading-none font-sans">in</span>
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900 leading-tight">LinkedIn</div>
              <div className="text-xs text-neutral-500 font-medium">Companies & People</div>
            </div>
          </motion.div>

          {/* ─── FLOATING CARD: WEB (BOTTOM-RIGHT) ─── */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 35 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="hidden lg:flex absolute bottom-8 -right-10 z-30 bg-white/95 backdrop-blur-sm border border-neutral-200/90 shadow-xl shadow-neutral-200/60 rounded-2xl p-3.5 items-center gap-3 w-56 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Globe className="w-5 h-5 text-neutral-200 stroke-[1.8]" />
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900 leading-tight">Web</div>
              <div className="text-xs text-neutral-500 font-medium">Any Niche, Any Industry</div>
            </div>
          </motion.div>

          {/* Bottom Right Annotation: "Find. Enrich. Outreach. Grow." */}
          <div className="hidden xl:block absolute -bottom-10 -right-8 z-30 pointer-events-none select-none text-right">
            <svg className="w-10 h-10 ml-auto text-neutral-400 mb-1" viewBox="0 0 40 40" fill="none">
              <path d="M15 35 Q 25 20, 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M14 12 L 20 6 L 25 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="font-serif italic text-neutral-500 text-sm tracking-wide">
              Find. Enrich.
              <br />
              Outreach. Grow.
            </span>
          </div>

          {/* ─── THE CENTRAL LEADMINER DASHBOARD MOCKUP ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white rounded-3xl border border-neutral-200 shadow-2xl shadow-neutral-300/60 overflow-hidden text-left relative z-20"
          >
            {/* Top Bar of Dashboard */}
            <div className="h-12 border-b border-neutral-100 px-5 flex items-center justify-between bg-neutral-50/50">
              {/* Left Brand */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#C46A3A] flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 stroke-white stroke-[2.5]">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-neutral-900">LeadMiner</span>
              </div>

              {/* Right Mini Icons */}
              <div className="flex items-center gap-3">
                <Bell className="w-3.5 h-3.5 text-neutral-400" />
                <Settings className="w-3.5 h-3.5 text-neutral-400" />
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white font-bold text-[10px]">
                    RV
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white absolute -bottom-0.5 -right-0.5" />
                </div>
              </div>
            </div>

            {/* Dashboard Body Grid: Sidebar + Content */}
            <div className="grid grid-cols-12 min-h-[380px]">
              {/* Left Mini Sidebar */}
              <div className="col-span-3 border-r border-neutral-100 p-3 bg-neutral-50/30 hidden sm:block">
                <div className="space-y-1 text-xs font-medium">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-orange-50/80 text-[#C46A3A] font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C46A3A]" />
                    <span>Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100/60">
                    <Layers className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Campaigns</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100/60">
                    <Search className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Leads</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100/60">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Email Accounts</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100/60">
                    <Send className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Sequences</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100/60">
                    <BarChart3 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Analytics</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100/60">
                    <Settings className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Settings</span>
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="col-span-12 sm:col-span-9 p-5 sm:p-6 bg-white flex flex-col justify-between">
                <div>
                  {/* Greeting & Timeframe */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>Good morning</span>
                        <span>👋</span>
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">Your outbound engine is running smoothly.</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs border border-neutral-200 rounded-lg px-2.5 py-1 text-neutral-600 font-medium bg-neutral-50/50">
                      <span>Last 7 days</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </div>

                  {/* 4 Top KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {/* Card 1 */}
                    <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3">
                      <div className="text-base font-extrabold text-neutral-900">{leadsFound.toLocaleString()}</div>
                      <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Leads Found</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                        <span>↑ 12%</span>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3">
                      <div className="text-base font-extrabold text-neutral-900">{verifiedEmails.toLocaleString()}</div>
                      <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Verified Emails</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                        <span>↑ 18%</span>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3">
                      <div className="text-base font-extrabold text-neutral-900">318</div>
                      <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Emails Sent</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                        <span>↑ 20%</span>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3">
                      <div className="text-base font-extrabold text-neutral-900">74</div>
                      <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Replies</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                        <span>↑ 40%</span>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Row: Campaign Performance Chart + Recent Activity */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-4">
                    {/* Performance Area Chart (8 cols) */}
                    <div className="sm:col-span-7 bg-neutral-50/60 border border-neutral-100 rounded-xl p-3.5 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-neutral-800">Campaign Performance</span>
                        <span className="text-[10px] text-neutral-400 font-medium">Last 7 days ˇ</span>
                      </div>

                      {/* Tooltip Overlay */}
                      <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white rounded-lg px-2.5 py-1 text-[10px] shadow-lg font-medium flex items-center gap-1.5 z-10 pointer-events-none">
                        <span>318 emails sent</span>
                        <span className="text-[#C46A3A] font-bold">74 replies (23.2%)</span>
                      </div>

                      {/* SVG Smooth Area Chart */}
                      <div className="h-28 w-full pt-4">
                        <svg className="w-full h-full" viewBox="0 0 300 90" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#C46A3A" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#C46A3A" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0 75 Q 50 65, 90 50 T 170 30 T 230 40 T 300 20 L 300 90 L 0 90 Z"
                            fill="url(#chartGradient)"
                          />
                          <path
                            d="M0 75 Q 50 65, 90 50 T 170 30 T 230 40 T 300 20"
                            fill="none"
                            stroke="#C46A3A"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          {/* Data points */}
                          <circle cx="170" cy="30" r="3.5" fill="#C46A3A" stroke="#FFFFFF" strokeWidth="2" />
                          <circle cx="300" cy="20" r="3.5" fill="#C46A3A" stroke="#FFFFFF" strokeWidth="2" />
                        </svg>
                      </div>

                      {/* X-axis dates */}
                      <div className="flex items-center justify-between text-[9px] text-neutral-400 font-medium px-1 mt-1">
                        <span>Jan 14</span>
                        <span>Jan 15</span>
                        <span>Jan 16</span>
                        <span>Jan 17</span>
                        <span>Jan 18</span>
                        <span>Jan 19</span>
                        <span>Jan 20</span>
                      </div>
                    </div>

                    {/* Recent Activity List (5 cols) */}
                    <div className="sm:col-span-5 bg-neutral-50/60 border border-neutral-100 rounded-xl p-3.5">
                      <div className="text-xs font-bold text-neutral-800 mb-2">Recent Activity</div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-neutral-700 font-medium">Found 120 new leads</span>
                          </div>
                          <span className="text-[10px] text-neutral-400">2m ago</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-neutral-700 font-medium">Verified 87 emails</span>
                          </div>
                          <span className="text-[10px] text-neutral-400">12m ago</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="text-neutral-700 font-medium">Sent 50 emails</span>
                          </div>
                          <span className="text-[10px] text-neutral-400">28m ago</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-neutral-700 font-medium">12 new replies</span>
                          </div>
                          <span className="text-[10px] text-neutral-400">1h ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 3. LOGO TRUST STRIP ─── */}
      <section className="relative z-20 py-10 border-t border-neutral-200/60 bg-white/60">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs uppercase font-semibold tracking-wider text-neutral-400 mb-6">
            Trusted by operators, marketers and agencies
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-neutral-400">
            {/* YouTube */}
            <div className="flex items-center gap-2 hover:text-neutral-700 transition-colors">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span className="font-bold text-sm tracking-tight">YouTube</span>
            </div>

            {/* Google */}
            <div className="flex items-center gap-2 hover:text-neutral-700 transition-colors">
              <span className="font-bold text-sm tracking-tight">Google</span>
            </div>

            {/* LinkedIn */}
            <div className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
              <span className="font-bold text-sm tracking-tight">Linked</span>
              <span className="bg-current text-white font-bold text-xs px-1 rounded-xs">in</span>
            </div>

            {/* Stripe */}
            <div className="flex items-center gap-2 hover:text-neutral-700 transition-colors font-bold text-sm tracking-tight">
              stripe
            </div>

            {/* Notion */}
            <div className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
              <span className="border border-current font-serif font-black px-1 rounded text-xs">N</span>
              <span className="font-bold text-sm tracking-tight">Notion</span>
            </div>

            {/* Supabase */}
            <div className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.32 14.24a.396.396 0 0 0 .316.638H12v8.958a.396.396 0 0 0 .716.233l10.964-14.077a.396.396 0 0 0-.318-.638z" />
              </svg>
              <span className="font-bold text-sm tracking-tight">supabase</span>
            </div>

            {/* OpenAI */}
            <div className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
              <span className="font-bold text-sm tracking-tight">OpenAI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURES SECTION (EXACT MATCH TO REFERENCE PHOTO) ─── */}
      <section id="features" className="relative z-20 py-20 px-6 max-w-6xl mx-auto">
        {/* Header with pill badge and right-side button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100/70 text-[#C46A3A] text-xs font-bold tracking-wider uppercase mb-3">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight max-w-xl leading-tight">
              Everything you need to turn YouTube into a lead generation engine.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 mt-3 max-w-xl">
              From discovery to outreach, LeadMiner handles the heavy lifting so you can focus on closing deals.
            </p>
          </div>

          <Link
            href="/overview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 hover:bg-neutral-50 shadow-xs transition-all shrink-0 self-start md:self-auto"
          >
            <span>Explore All Features</span>
            <ArrowRight className="w-4 h-4 text-neutral-500" />
          </Link>
        </div>

        {/* 4 Clean White Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C46A3A] mb-5 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Lead Discovery</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Find high-intent leads from YouTube, Google, LinkedIn and more.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C46A3A] mb-5 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Verified Contacts</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Extract and verify emails with high accuracy and 3-second DNS checks.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C46A3A] mb-5 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Automated Outreach</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Send personalized cold emails at scale with smart sequences.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all group">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C46A3A] mb-5 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Track & Grow</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Monitor performance and get more replies, more clients.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. MID-PAGE ORANGE CTA (EXACT MATCH TO REFERENCE PHOTO) ─── */}
      <section className="relative z-20 py-8 px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#E07A42] via-[#C46A3A] to-[#B05B2E] rounded-3xl p-8 sm:p-12 md:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          {/* Subtle Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Left Pinned Decorative Card */}
          <div className="hidden lg:block absolute -top-2 left-6 -rotate-6 z-20">
            <div className="relative bg-white text-neutral-900 px-4 py-3 rounded-xl shadow-xl border border-neutral-100 text-left w-36">
              {/* 3D Blue Pin Sphere */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-blue-700 via-blue-500 to-blue-300 shadow-md shadow-black/30 border border-white" />
              <div className="font-bold text-xs text-neutral-900 pt-2 leading-tight">Design Concept</div>
              <div className="text-[10px] text-neutral-500 font-medium">Auto-Discovery</div>
            </div>
          </div>

          {/* Right Pinned Decorative Card */}
          <div className="hidden lg:block absolute -top-2 right-6 rotate-6 z-20">
            <div className="relative bg-white text-neutral-900 px-4 py-3 rounded-xl shadow-xl border border-neutral-100 text-left w-40">
              {/* 3D Red/Orange Pin Sphere */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-red-700 via-rose-500 to-orange-300 shadow-md shadow-black/30 border border-white" />
              <div className="font-bold text-xs text-neutral-900 pt-2 leading-tight">Complete Development</div>
              <div className="text-[10px] text-neutral-500 font-medium">Verified Pipeline</div>
            </div>
          </div>

          {/* Avatar badge */}
          <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-3.5 py-1 text-xs font-semibold mb-6">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-neutral-900 text-[10px] font-bold">
              MV
            </div>
            <span>Mark Vassilevskiy</span>
          </div>

          {/* Big White Headline */}
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Let&apos;s have a 30-min call
          </h2>
          <p className="text-sm sm:text-base text-orange-100/90 mt-3 max-w-xl mx-auto">
            I&apos;ll show you how LeadMiner can help you get more clients.
          </p>

          {/* Button */}
          <div className="mt-7">
            <Link
              href="/overview"
              className="inline-flex items-center gap-2 bg-white text-neutral-900 hover:bg-neutral-50 font-bold px-7 py-3 rounded-full text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <span>Book a Call</span>
              <ArrowRight className="w-4 h-4 text-[#C46A3A]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 6. PRODUCT SHOWCASE (ALTERNATING REAL LEADMINER UI) ─── */}
      <section id="product" className="relative z-20 py-20 px-6 max-w-6xl mx-auto space-y-24">
        {/* Row 1: Discovery Engine (Left Copy / Right UI) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100/70 text-[#C46A3A] text-xs font-bold uppercase tracking-wider">
              01 · Discovery Engine
            </span>
            <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Uncover the creators nobody else is reaching.
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Search across 25,391 curated niche categories. LeadMiner surfaces active channels with high engagement, authentic audiences, and real business potential.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs font-medium text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dual YouTube quota tracking with zero quota waste</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Yield-weighted keyword scoring prioritizes top niches</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>In-memory deduplication skips existing channels</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div className="text-xs font-bold text-neutral-800">YouTube Discovery Stream</div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Live Active
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'Creative Tech Lab', subs: '142K subs', niche: 'B2B Software', email: 'business@creativetech.io', status: 'VALID' },
                { name: 'SaaS Growth Pulse', subs: '89K subs', niche: 'Agency Systems', email: 'hello@saasgrowth.com', status: 'VALID' },
                { name: 'Fintech Daily Review', subs: '210K subs', niche: 'Personal Finance', email: 'partnerships@finreview.org', status: 'DOMAIN_VALID' },
              ].map((channel, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50/70 border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#C46A3A] font-bold text-xs flex items-center justify-center">
                      {channel.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{channel.name}</div>
                      <div className="text-[10px] text-neutral-400">{channel.subs} · {channel.niche}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-neutral-700">{channel.email}</div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      {channel.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Verification Guard (Left UI / Right Copy) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1 bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div className="text-xs font-bold text-neutral-800">Verification Inspection Matrix</div>
              <span className="text-[10px] font-mono text-neutral-400">DNS Timeout: 3000ms</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-700">RFC Syntax</div>
                <div className="text-sm font-extrabold text-neutral-900 mt-1">100% Pass</div>
                <p className="text-[10px] text-neutral-500 mt-1">Standard RFC-5322 compliance checking.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-700">DNS MX Resolution</div>
                <div className="text-sm font-extrabold text-neutral-900 mt-1">Confirmed</div>
                <p className="text-[10px] text-neutral-500 mt-1">Direct authoritative mailserver lookups.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Disposable Filter</div>
                <div className="text-sm font-extrabold text-neutral-900 mt-1">17 Providers Blocked</div>
                <p className="text-[10px] text-neutral-500 mt-1">Guarantees zero throwaway addresses.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100/70 text-[#C46A3A] text-xs font-bold uppercase tracking-wider">
              02 · Deliverability Guard
            </span>
            <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              100% verified emails. Zero wasted sends.
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Never risk your primary domain reputation. LeadMiner performs authoritative DNS MX lookups with strict 3-second timeouts, discarding dead mailboxes before any email is queued.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs font-medium text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero SMTP probing eliminates blacklisting risks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fail-closed protection: unverified emails never send</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatic permanent suppression for bounces</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Row 3: Automated Outreach & Replies (Left Copy / Right UI) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100/70 text-[#C46A3A] text-xs font-bold uppercase tracking-wider">
              03 · Outreach & Replies
            </span>
            <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Personalized cold emails that actually get replies.
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Gemini crafts authentic opening sentences based on each creator&apos;s recent uploads and channel topics. Emails are rotated across multiple Google Workspace accounts with natural human jitter.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs font-medium text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Safe 18–25 email daily cap per connected inbox</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automated thread reply detection with Telegram alerts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Immediate sequence cancellation when replies arrive</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div className="text-xs font-bold text-neutral-800">Outreach Email Preview</div>
              <span className="text-[10px] text-neutral-400">Account: sender1@yourdomain.com</span>
            </div>
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3 text-xs">
              <div className="flex items-center justify-between text-neutral-500 text-[11px] pb-2 border-b border-neutral-200/60">
                <span>To: &lt;creator@channel.com&gt;</span>
                <span className="text-emerald-600 font-semibold">Ready to Send</span>
              </div>
              <div className="font-bold text-neutral-900">Collaboration on Tech & SaaS Growth</div>
              <p className="text-neutral-700 leading-relaxed">
                Hey Alex,
                <br /><br />
                <span className="bg-amber-100/70 text-amber-900 px-1 py-0.5 rounded font-medium">
                  Loved your breakdown on scalable micro-SaaS architectures last Thursday.
                </span>
                <br /><br />
                We built LeadMiner to automate discovery and reach out to the exact partners worth contacting. Would you be open to a quick 5-min walk-through this week?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. HOW IT WORKS (HORIZONTAL TIMELINE) ─── */}
      <section id="how-it-works" className="relative z-20 py-20 px-6 max-w-6xl mx-auto border-t border-neutral-200/60">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100/70 text-[#C46A3A] text-xs font-bold tracking-wider uppercase mb-3">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            From keyword to client reply in 4 steps.
          </h2>
          <p className="text-sm text-neutral-600 mt-2">
            A clean, autonomous pipeline designed for high conversion and complete domain safety.
          </p>
        </div>

        {/* 4 Connected Timeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Discover',
              desc: 'System queries YouTube using priority-scored keywords from 25,391 categories.',
            },
            {
              step: '02',
              title: 'Verify',
              desc: 'Extracts emails and performs 3-second DNS MX resolution, purging throwaway domains.',
            },
            {
              step: '03',
              title: 'Personalize',
              desc: 'Gemini drafts contextual icebreakers based on recent video content and channel topics.',
            },
            {
              step: '04',
              title: 'Send & Track',
              desc: 'Rotates across connected Gmail inboxes with natural volume jitter and instant reply detection.',
            },
          ].map((item, index) => (
            <div key={index} className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs relative">
              <div className="text-2xl font-black text-[#C46A3A]/40 mb-3 font-mono">{item.step}</div>
              <h3 className="text-base font-bold text-neutral-900">{item.title}</h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8. AUTONOMY SECTION ("BUILT TO RUN WITHOUT YOU") ─── */}
      <section className="relative z-20 py-20 px-6 max-w-6xl mx-auto border-t border-neutral-200/60">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold tracking-wider uppercase mb-3">
            Autonomous Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Built to run without you.
          </h2>
          <p className="text-sm text-neutral-600 mt-2">
            Engineered with defensive fail-closed architecture, persistent state, and complete crash recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Keeps moving</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Background schedulers run discovery, extraction, verification, and dispatch batches automatically around the clock.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C46A3A] mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Knows where it stopped</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Every keyword, lead, and verification checkpoint is persisted in PostgreSQL. Resumes seamlessly after serverless pauses without duplicate work.
            </p>
          </div>

          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Knows when to stop</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              Emergency Kill Switch, quota governors, and automatic reply suppressors guarantee sends halt instantly if anomalies occur.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 9. SOCIAL PROOF & REAL RESULTS (EXACT MATCH TO REFERENCE PHOTO) ─── */}
      <section className="relative z-20 py-20 px-6 max-w-6xl mx-auto border-t border-neutral-200/60">
        {/* Header with Left Title and Right Counters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100/70 text-[#C46A3A] text-xs font-bold tracking-wider uppercase mb-3">
              Social Proof
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              500+ Clients, Real Results
            </h2>
            <p className="text-sm text-neutral-600 mt-2">
              Join founders, agencies and marketers who use LeadMiner to scale their outreach.
            </p>
          </div>

          {/* Right Metrics in Header */}
          <div className="flex items-center gap-8 sm:gap-12 shrink-0">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900">24M</div>
              <div className="text-xs text-neutral-500 font-medium">Leads Discovered</div>
            </div>
            <div className="w-px h-8 bg-neutral-200" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900">20k+</div>
              <div className="text-xs text-neutral-500 font-medium">Businesses Reached</div>
            </div>
            <div className="w-px h-8 bg-neutral-200" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900">4.8/5</div>
              <div className="text-xs text-neutral-500 font-medium">User Rating</div>
            </div>
          </div>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative">
            <div className="absolute top-6 right-6 text-neutral-300">
              <Quote className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pr-6 italic">
              &ldquo;LeadMiner completely changed how we find and reach out to potential clients. Absolutely a game changer.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                AC
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Alex Carter</div>
                <div className="text-[11px] text-neutral-500">Founder · Creator</div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative">
            <div className="absolute top-6 right-6 text-neutral-300">
              <Quote className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pr-6 italic">
              &ldquo;We booked 3 new clients in the first month. The automation saves us so much time.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                SK
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">Sarah Kim</div>
                <div className="text-[11px] text-neutral-500">CEO · Media Agency</div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative">
            <div className="absolute top-6 right-6 text-neutral-300">
              <Quote className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pr-6 italic">
              &ldquo;Super easy to use and the email verification is insanely accurate. Highly recommend.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                DP
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">David Park</div>
                <div className="text-[11px] text-neutral-500">YouTuber · 1.2M subs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. FINAL PURPLE CTA BANNER WITH FLOATING ENVELOPES (EXACT MATCH) ─── */}
      <section className="relative z-20 py-10 px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#5B4FE1] via-[#7B59EC] to-[#9955F3] rounded-3xl p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          {/* Subtle overlay grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Large Floating 3D White Mail Envelope (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -15 }}
            whileInView={{ opacity: 1, x: 0, rotate: -8 }}
            transition={{ duration: 0.8 }}
            className="hidden md:block absolute -bottom-6 -left-8 w-48 h-36 bg-white/95 rounded-2xl shadow-2xl p-4 border border-white/40 pointer-events-none"
          >
            {/* Envelope flap aesthetic */}
            <div className="w-full h-full border-2 border-dashed border-purple-200 rounded-xl flex items-center justify-center">
              <Mail className="w-12 h-12 text-purple-400/80" />
            </div>
          </motion.div>

          {/* Large Floating 3D White Mail Envelope (Right) */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 15 }}
            whileInView={{ opacity: 1, x: 0, rotate: 8 }}
            transition={{ duration: 0.8 }}
            className="hidden md:block absolute -bottom-6 -right-8 w-48 h-36 bg-white/95 rounded-2xl shadow-2xl p-4 border border-white/40 pointer-events-none"
          >
            <div className="w-full h-full border-2 border-dashed border-purple-200 rounded-xl flex items-center justify-center">
              <Mail className="w-12 h-12 text-purple-400/80" />
            </div>
          </motion.div>

          {/* Center Copy */}
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Your next lead is already somewhere on the internet.
              <br />
              <span className="font-serif italic font-normal text-purple-100">Go find it.</span>
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-3 leading-relaxed">
              Autonomous creator discovery, 3-second DNS MX verification, and personalized cold outreach.
            </p>

            {/* Input + Action */}
            <div className="mt-8 max-w-md mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = '/overview';
                }}
                className="bg-white p-1.5 pl-5 rounded-full flex items-center justify-between gap-2 shadow-2xl"
              >
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your work email"
                  className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
                />
                <Link
                  href="/overview"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-full px-5 py-2.5 shrink-0 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Open LeadMiner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </form>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 sm:gap-7 mt-4 text-xs text-purple-200/90 font-medium">
                <span>✓ 25,391 Niche Keywords</span>
                <span>✓ 100% Deliverable</span>
                <span>✓ Autonomous Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. MINIMAL DARK FOOTER ─── */}
      <footer className="relative z-20 bg-[#161616] text-[#EDEDED] py-12 mt-12 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-800/80">
            {/* Brand & Minimal Tagline */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#C46A3A] flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-white stroke-[2.2]">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">LeadMiner</span>
              <span className="text-neutral-500 text-xs">·</span>
              <span className="text-xs text-neutral-400 font-medium">Find. Verify. Reach.</span>
            </div>

            {/* Essential Nav Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400 font-medium">
              <a href="#product" className="hover:text-white transition-colors">Product</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <Link href="/overview" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@leadminer.io" className="hover:text-white transition-colors">Contact</a>
            </nav>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 text-center md:text-left text-xs text-neutral-500">
            © 2026 LeadMiner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
