import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, ExternalLink, Lock, Eye, Trash2, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | LeadMiner',
  description: 'LeadMiner Public Privacy Policy and Google API Services User Data Policy Disclosure',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#161616] text-[#e2e8f0] selection:bg-[#C46A3A]/20 selection:text-[#C46A3A]">
      {/* Top Header */}
      <header className="border-b border-[#2E2E2E] bg-[#1C1C1C]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2.5 text-sm font-medium text-[#94a3b8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <Link href="/terms" className="text-[#94a3b8] hover:text-[#C46A3A] transition-colors">
              Terms of Service
            </Link>
            <span className="text-[#2E2E2E]">|</span>
            <Link href="/login" className="text-[#C46A3A] hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Title */}
        <div className="space-y-4 border-b border-[#2E2E2E] pb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C46A3A]/10 border border-[#C46A3A]/25 text-[#C46A3A] text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Public Compliance Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#94a3b8] font-mono">
            Last Updated: September 23, 2026 • Effective Date: September 23, 2026
          </p>
        </div>

        {/* Section 1: Introduction */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">1. Overview & Purpose</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            LeadMiner (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;) provides an autonomous discovery and business-to-business (B2B) cold outreach pipeline designed for content creators and agency operators. This Privacy Policy details how we collect, process, store, and safeguard your data and that of public content creators when using the LeadMiner platform.
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            By accessing LeadMiner, you consent to the practices outlined in this Privacy Policy. If you do not agree with these terms, you must discontinue use of the platform immediately.
          </p>
        </section>

        {/* Section 2: Google API Services User Data Policy Compliance */}
        <section className="space-y-4 p-6 rounded-xl bg-[#1C1C1C] border border-[#C46A3A]/30 relative overflow-hidden">
          <div className="flex items-center space-x-2.5 text-[#C46A3A]">
            <Lock className="w-5 h-5 shrink-0" />
            <h2 className="text-lg font-semibold text-white tracking-tight">
              2. Google API Services &amp; Gmail User Data Policy
            </h2>
          </div>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            LeadMiner accesses and uses Google user data exclusively to provide outreach and reply-tracking capabilities requested by the account owner. Our use and transfer of information received from Google APIs to any other app will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C46A3A] hover:underline inline-flex items-center space-x-1"
            >
              <span>Google API Services User Data Policy</span>
              <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
            , including the Limited Use requirements.
          </p>

          <div className="space-y-3 pt-2 text-xs text-[#cbd5e1]">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
              <span>
                <strong>Gmail Sending Scope (<code>https://www.googleapis.com/auth/gmail.send</code>):</strong> Used solely to transmit user-approved cold outreach and sequence follow-up emails from your authenticated connected inbox.
              </span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
              <span>
                <strong>Gmail Read-Only Scope (<code>https://www.googleapis.com/auth/gmail.readonly</code>):</strong> Used strictly to monitor recipient responses within active outreach threads, extract creator replies, and detect opt-out or bounce notices.
              </span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
              <span>
                <strong>No Data Selling or Advertising:</strong> We never sell, lease, or transfer Google user data to third-party data brokers, advertising platforms, or information resellers under any circumstances.
              </span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
              <span>
                <strong>No AI Training on Private Emails:</strong> We do not use Google Workspace or Gmail user email contents to train generalized artificial intelligence or machine learning models.
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: YouTube API Services */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">3. YouTube API Services</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            LeadMiner utilizes official YouTube Data API Services to discover publicly available YouTube creator channels matching user-defined niche keywords. By utilizing discovery features within LeadMiner, you acknowledge and agree that your usage is also subject to the{' '}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C46A3A] hover:underline"
            >
              YouTube Terms of Service
            </a>{' '}
            and the{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C46A3A] hover:underline"
            >
              Google Privacy Policy
            </a>
            .
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            We only retrieve public creator channel metadata (such as channel title, public description, custom URL, subscriber count, and video count). We do not retrieve, store, or solicit private consumer data or viewing history.
          </p>
        </section>

        {/* Section 4: Data Encryption & Retention */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">4. Security &amp; Data Encryption</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            All sensitive credentials, including Google OAuth refresh tokens and access tokens, are encrypted at rest using AES-256-GCM authenticated encryption. Encryption keys are securely injected via isolated server-side environment variables and are never checked into version control.
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Database transport is secured via strict TLS 1.3 encryption. Internal operator dashboard sessions are protected with signed, HttpOnly, SameSite=Strict cookies.
          </p>
        </section>

        {/* Section 5: User Control & Revocation */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">5. Revocation &amp; Data Deletion</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            You maintain complete authority over your connected accounts and stored data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] space-y-2">
              <div className="flex items-center space-x-2 text-white font-medium text-sm">
                <Trash2 className="w-4 h-4 text-[#C46A3A]" />
                <span>Disconnect Inbox</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                You can disconnect or permanently purge your connected Gmail account at any time via the Settings or Gmail Accounts tab. Disconnecting immediately revokes the OAuth token with Google servers.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] space-y-2">
              <div className="flex items-center space-x-2 text-white font-medium text-sm">
                <Eye className="w-4 h-4 text-[#C46A3A]" />
                <span>Google Security Settings</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                You can also revoke LeadMiner&apos;s access directly at any time from your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C46A3A] hover:underline"
                >
                  Google Account Permissions Page
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Contact & Self-Serve Data Erasure */}
        <section className="space-y-4 border-t border-[#2E2E2E] pt-8">
          <h2 className="text-xl font-semibold text-white tracking-tight">6. GDPR Right to Erasure &amp; Contact</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            In compliance with GDPR Article 17 (Right to Erasure), creators and recipients may immediately and permanently purge all stored contact data and add their email to our suppression list via our self-serve portal:
          </p>
          <div className="pt-1 pb-2">
            <Link
              href="/api/gdpr/delete"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#C46A3A]/15 border border-[#C46A3A]/40 text-[#C46A3A] hover:bg-[#C46A3A]/25 transition-colors text-xs font-semibold"
            >
              <span>Access Self-Serve GDPR Erasure Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            For all other privacy inquiries, contact our administrative compliance team at:
          </p>
          <div className="p-4 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] font-mono text-xs text-[#cbd5e1] space-y-1">
            <p>Email: privacy@resolvia.ai</p>
            <p>Application: LeadMiner Platform (Resolvia AI)</p>
            <p>Website: https://leadminer-app.vercel.app</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2E2E2E] py-8 bg-[#111418] text-xs text-[#64748b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LeadMiner • Autonomous YouTube Outreach Platform</p>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
