'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Layers,
  Send,
  Inbox,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Radio,
  Sparkles,
  Zap,
  Cpu,
  LogIn,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  async function handleInlineLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid credentials');
        return;
      }

      router.push('/overview');
      router.refresh();
    } catch {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0E1117] text-[#e2e8f0] overflow-x-hidden selection:bg-[#C46A3A]/20 selection:text-[#C46A3A]">
      {/* ─── ABSTRACT ANIMATED BACKGROUND ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #C46A3A 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Ambient Gradient Glow Orbs */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#C46A3A]/15 via-[#C46A3A]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] -left-[100px] w-[500px] h-[500px] bg-gradient-to-tr from-[#3b82f6]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] -right-[100px] w-[600px] h-[600px] bg-gradient-to-tl from-[#C46A3A]/10 to-transparent rounded-full blur-[160px] pointer-events-none" />

        {/* Technical SVG circuit lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C46A3A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M0,150 Q400,100 800,240 T1600,180"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <path
            d="M200,600 Q700,450 1200,620 T1920,500"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle cx="800" cy="240" r="4" fill="#C46A3A" />
          <circle cx="1200" cy="620" r="4" fill="#C46A3A" />
        </svg>
      </div>

      {/* ─── TOP NAVIGATION HEADER ────────────────────────────────────────── */}
      <header className="relative z-30 border-b border-[#2E2E2E]/80 bg-[#161616]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C46A3A] to-[#8B4A29] flex items-center justify-center shadow-lg shadow-[#C46A3A]/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white tracking-tight text-sm flex items-center gap-1.5">
                LeadMiner
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#C46A3A]/15 text-[#C46A3A] border border-[#C46A3A]/30">
                  v1.0
                </span>
              </span>
              <span className="text-[10px] text-[#64748b] -mt-0.5">Autonomous Outreach</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-[#94a3b8]">
            <a href="#pipeline" className="hover:text-white transition-colors">
              Pipeline Architecture
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </nav>

          {/* Sign In CTA Button */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-[#C46A3A] text-white hover:bg-[#D17A45] active:scale-95 transition-all shadow-md shadow-[#C46A3A]/20 min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Status Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-xs font-mono text-[#cbd5e1] shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Autonomous Engine Active • Fail-Closed Deliverability</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.12]">
              Turn YouTube Keywords Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C46A3A] via-[#E88E5D] to-[#F3B390]">
                Closed Sponsorships &amp; Deals.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl leading-relaxed mx-auto lg:mx-0">
              The continuous, autonomous cold outreach pipeline built for operators. Discovers high-fit YouTube creators, verifies email deliverability, generates deterministic AI-personalized drafts, and dispatches multi-touch sequences across rotated Google inboxes.
            </p>

            {/* Key Assurance Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-[#cbd5e1]">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C46A3A]" />
                <span>Zero-Bounce Post-Verification</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C46A3A]" />
                <span>Official Google OAuth2 Inboxes</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C46A3A]" />
                <span>Automated Opt-Out Suppression</span>
              </div>
            </div>

            {/* CTA Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-3">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-semibold px-6 py-3 rounded-lg bg-[#C46A3A] text-white hover:bg-[#D17A45] active:scale-98 transition-all shadow-lg shadow-[#C46A3A]/25 min-h-[46px]"
              >
                <span>Access Operator Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#pipeline"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-medium px-5 py-3 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] text-[#cbd5e1] hover:text-white hover:border-[#3E3E3E] transition-all min-h-[46px]"
              >
                <span>Explore Technical Specs</span>
              </a>
            </div>
          </div>

          {/* Right Column: Instant Sign-In Card or Interactive Pipeline Demo */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="relative rounded-2xl bg-[#1C1C1C] border border-[#2E2E2E] p-6 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#2E2E2E]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#C46A3A]/15 border border-[#C46A3A]/30 flex items-center justify-center">
                    <LogIn className="w-4 h-4 text-[#C46A3A]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Operator Sign In</h2>
                    <p className="text-[11px] text-[#64748b]">Direct access to pipeline controls</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>

              {/* Inline Sign-In Form */}
              <form onSubmit={handleInlineLogin} className="space-y-4 pt-5">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                    Authorized Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@agency.com"
                    className="w-full bg-[#232323] border border-[#2E2E2E] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#64748b] focus:border-[#C46A3A] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#232323] border border-[#2E2E2E] rounded-lg px-3.5 py-2.5 pr-10 text-xs text-white placeholder-[#64748b] focus:border-[#C46A3A] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-mono">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-lg bg-[#C46A3A] hover:bg-[#D17A45] active:scale-98 text-white font-semibold text-xs transition-all shadow-md shadow-[#C46A3A]/20 min-h-[44px] flex items-center justify-center space-x-2"
                >
                  {loginLoading ? (
                    <span>Verifying session…</span>
                  ) : (
                    <>
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Footnote */}
              <div className="pt-4 mt-4 border-t border-[#2E2E2E] flex items-center justify-between text-[11px] text-[#64748b]">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-[#C46A3A]" />
                  <span>Encrypted AES-256 Auth</span>
                </span>
                <Link href="/privacy" className="hover:text-[#cbd5e1] transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE PIPELINE ARCHITECTURE SECTION ────────────────────────── */}
      <section id="pipeline" className="relative z-10 py-16 bg-[#111418] border-y border-[#2E2E2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-x-2 max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#C46A3A] bg-[#C46A3A]/10 border border-[#C46A3A]/25 px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              <span>5-Stage Autonomous State Machine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Deterministic, Sub-Linear Outreach Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
              Every operation follows strict atomic state machines. No unverified sends, no duplicate touches, and automatic pause on provider errors.
            </p>
          </div>

          {/* 5-Step Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#2E2E2E] space-y-2 relative">
              <span className="text-xs font-mono text-[#C46A3A]">Step 01</span>
              <h3 className="text-sm font-semibold text-white">YouTube Discovery</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Queries official YouTube API with smart quota buckets. Discovers active channels matching subscriber and country filters.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#2E2E2E] space-y-2 relative">
              <span className="text-xs font-mono text-[#C46A3A]">Step 02</span>
              <h3 className="text-sm font-semibold text-white">Email Verification</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Validates MX records, syntax, and deliverability. Drops risky or unconfirmed addresses before any email is queued.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#2E2E2E] space-y-2 relative">
              <span className="text-xs font-mono text-[#C46A3A]">Step 03</span>
              <h3 className="text-sm font-semibold text-white">Deterministic AI</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Gemini AI personalizes drafts with seeded Knuth LCG spintax. Retry attempts never drift in wording to the same recipient.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#2E2E2E] space-y-2 relative">
              <span className="text-xs font-mono text-[#C46A3A]">Step 04</span>
              <h3 className="text-sm font-semibold text-white">Staggered Dispatch</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Rotates authenticated Gmail inboxes with 7-day warmup ramping. Schedules outreach in natural morning US Eastern windows.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#2E2E2E] space-y-2 relative">
              <span className="text-xs font-mono text-[#C46A3A]">Step 05</span>
              <h3 className="text-sm font-semibold text-white">Reply &amp; Opt-Out Sync</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Monitors creator responses, distinguishes hard bounces from out-of-office replies, and triggers real-time Telegram alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SYSTEM CAPABILITIES / FEATURES ────────────────────────────── */}
      <section id="features" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#C46A3A] bg-[#C46A3A]/10 border border-[#C46A3A]/25 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>Built for Enterprise Grade Deliverability</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Designed to Protect Your Gmail Reputation
          </h2>
          <p className="text-xs sm:text-sm text-[#94a3b8]">
            Automated outreach fails when tools cut corners. LeadMiner enforces strict invariants at every layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#C46A3A]/10 border border-[#C46A3A]/25 flex items-center justify-center text-[#C46A3A]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Fail-Closed Safety Architecture</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              If the database or verification service experiences latency, sends halt immediately. Kill-switch and suppression lists are strictly fail-closed, ensuring zero unauthorized emails.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#C46A3A]/10 border border-[#C46A3A]/25 flex items-center justify-center text-[#C46A3A]">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Inbox Warmup &amp; Rotation</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Connect multiple Google Workspace or Gmail accounts. New inboxes follow a 7-day progressive warm-up ramp (5 → 25 emails/day) to maintain healthy sender domain scores.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#C46A3A]/10 border border-[#C46A3A]/25 flex items-center justify-center text-[#C46A3A]">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Automated Opt-Out &amp; Bounce Handling</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Replies containing opt-out phrases automatically cancel future sequence steps and permanently suppress recipient emails. Hard bounces are isolated and suppressed instantly.
            </p>
          </div>
        </div>
      </section>

      {/* ─── PUBLIC COMPLIANCE & LEGAL FOOTER ────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#2E2E2E] bg-[#0c0e12] py-12 text-xs text-[#64748b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Platform Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-[#C46A3A] flex items-center justify-center text-white font-bold text-xs">
                  LM
                </div>
                <span className="font-semibold text-white">LeadMiner</span>
              </div>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Autonomous, incremental YouTube creator discovery and business cold-outreach system for agencies and brands.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-xs">Platform</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home Page
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/overview" className="hover:text-white transition-colors">
                    Dashboard Overview
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Compliance & Legal Links */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-xs">Legal &amp; Compliance</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors text-[#C46A3A]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors text-[#C46A3A]">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <span>Google API User Data Policy</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <span>YouTube Terms of Service</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Security Statement */}
            <div className="space-y-2 text-[11px]">
              <h4 className="text-white font-medium text-xs">Security Standards</h4>
              <p className="text-[#64748b] leading-relaxed">
                OAuth tokens encrypted via AES-256-GCM. We never sell, rent, or transfer user information to third-party ad brokers.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} LeadMiner (Resolvia AI) • All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link href="/login" className="hover:text-white transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
