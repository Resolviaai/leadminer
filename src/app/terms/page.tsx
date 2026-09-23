import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ExternalLink, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | LeadMiner',
  description: 'LeadMiner Public Terms of Service and Platform Usage Agreement',
};

export default function TermsOfServicePage() {
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
            <Link href="/privacy" className="text-[#94a3b8] hover:text-[#C46A3A] transition-colors">
              Privacy Policy
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
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-[#94a3b8] font-mono">
            Last Updated: September 23, 2026 • Effective Date: September 23, 2026
          </p>
        </div>

        {/* Section 1: Acceptance */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">1. Acceptance of Terms</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot; or &quot;Operator&quot;) and LeadMiner (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;). By creating an account, connecting an inbox, or utilizing any discovery and outreach services on LeadMiner, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
          </p>
        </section>

        {/* Section 2: YouTube API Compliance */}
        <section className="space-y-4 p-6 rounded-xl bg-[#1C1C1C] border border-[#C46A3A]/30">
          <div className="flex items-center space-x-2.5 text-[#C46A3A]">
            <Scale className="w-5 h-5 shrink-0" />
            <h2 className="text-lg font-semibold text-white tracking-tight">
              2. Compliance with YouTube Terms of Service
            </h2>
          </div>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            LeadMiner utilizes the official YouTube Data API to retrieve public channel data. As a condition of accessing and using the YouTube discovery features of LeadMiner, you explicitly agree to be bound by the{' '}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C46A3A] hover:underline inline-flex items-center space-x-1"
            >
              <span>YouTube Terms of Service</span>
              <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
            , the{' '}
            <a
              href="https://developers.google.com/youtube/terms/developer-policies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C46A3A] hover:underline"
            >
              YouTube Developer Policies
            </a>
            , and the{' '}
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
          <div className="space-y-2 text-xs text-[#cbd5e1] pt-2">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
              <span>Users shall not attempt to circumvent official YouTube API quotas, rate limits, or access controls.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#C46A3A] shrink-0 mt-0.5" />
              <span>All public channel data is retrieved strictly in accordance with YouTube API developer specifications.</span>
            </div>
          </div>
        </section>

        {/* Section 3: Anti-Spam & Outreach Compliance */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">3. Outreach &amp; Email Compliance Standards</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            LeadMiner provides powerful tools for personalized, incremental cold business communication. Users are strictly required to conduct outreach in compliance with all relevant international and domestic telecommunication regulations, including but not limited to the US CAN-SPAM Act, the UK Privacy and Electronic Communications Regulations (PECR), and the EU General Data Protection Regulation (GDPR).
          </p>
          <div className="p-4 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] space-y-3 text-xs text-[#cbd5e1]">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Accurate Header &amp; Sender Information:</strong> From, Reply-To, and Subject lines must genuinely represent your identity and commercial offering without deceptive formatting.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Instant Opt-Out Honoring:</strong> All opt-out requests, stop keywords, and unsubscribe notices must be honored immediately. LeadMiner automatically adds matching addresses to the permanent suppression table.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Hardware Kill-Switch:</strong> Operators agree to engage the global kill-switch immediately if high bounce rates (&gt;3%) or provider warnings are detected.</span>
            </div>
          </div>
        </section>

        {/* Section 4: Prohibited Uses */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">4. Prohibited Activities</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            You agree not to use the Service for any of the following prohibited behaviors:
          </p>
          <div className="space-y-2.5 text-xs text-[#94a3b8]">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Transmitting unlawful, defamatory, fraudulent, phishing, or predatory email communications.</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Distributing malware, malicious links, or unauthorized attachments.</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Attempting to reverse-engineer, exploit, or bypass authentication mechanisms on the LeadMiner API.</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>Harvesting personal addresses for resale, distribution, or bulk spam lists.</span>
            </div>
          </div>
        </section>

        {/* Section 5: Disclaimer & Limitation of Liability */}
        <section className="space-y-4 border-t border-[#2E2E2E] pt-8">
          <h2 className="text-xl font-semibold text-white tracking-tight">5. Disclaimer &amp; Limitation of Liability</h2>
          <p className="text-xs text-[#94a3b8] leading-relaxed uppercase tracking-wider">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. LEADMINER DOES NOT GUARANTEE THAT EMAIL DISPATCH WILL BE UNINTERRUPTED, THAT DELIVERABILITY RATES WILL REACH SPECIFIC BENCHMARKS, OR THAT THIRD-PARTY PLATFORMS (INCLUDING GOOGLE WORKSPACE AND YOUTUBE) WILL NOT SUSPEND OR ALTER ACCESS POLICIES.
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            In no event shall LeadMiner, its operators, or affiliates be liable for indirect, punitive, incidental, special, or consequential damages resulting from your use or inability to use the Service.
          </p>
        </section>

        {/* Section 6: Contact */}
        <section className="space-y-4 border-t border-[#2E2E2E] pt-8">
          <h2 className="text-xl font-semibold text-white tracking-tight">6. Questions &amp; Support</h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            For legal inquiries or questions regarding these Terms of Service, contact our administrative desk:
          </p>
          <div className="p-4 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] font-mono text-xs text-[#cbd5e1] space-y-1">
            <p>Email: legal@resolvia.ai</p>
            <p>Application: LeadMiner Platform</p>
            <p>Official Website: https://leadminer-app.vercel.app</p>
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
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
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
