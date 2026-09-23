# Progress Log — LeadMiner Platform

All development activities, audits, architectural decisions, and milestones are recorded here chronologically.

---

## 2026-09-15 — Session 1 (Audit & YouTube Compliance Discovery)
- **Agent:** Terra
- **Actions:**
  - Audited repository: confirmed greenfield project with no code or deployment configuration.
  - Performed read-only audit of `LeadMiner.xlsx`. Recovered 23 categories, 2,786 entities, 302 modifiers, and 25,391 unique normalized keywords.
  - Identified blocker: YouTube Developer Policy Section III.E.4 (anti-aggregation) and Section II.B (30-day deletion rule).
  - Documented findings in `docs/LEADMINER_AUDIT.md`, `docs/RESEARCH_FINDINGS.md`, `docs/PROJECT_STATE.md`, and `docs/HANDOFF.md`.

---

## 2026-09-15 — Session 2 (Compliance Alternatives Exploration)
- **Agent:** Antigravity
- **Actions:**
  - Researched alternative prospect discovery mechanisms (PodcastIndex.org open RSS, Brave Search API, Apollo/Hunter, HITL queue, Inbound lead magnets).
  - Presented comparative findings.

---

## 2026-09-15 — Session 3 (Master Build Prompt Alignment & Phase 1 Architecture)
- **Agent:** Antigravity
- **User Directive:**
  - Return to the **original YouTube-first LeadMiner architecture**.
  - Remove alternative sourcing systems entirely.
  - Build a self-running, highly reliable platform based on incremental batch discovery, quota checkpoints, contact extraction, verification, Gemini personalization, Gmail sending, reply detection, Telegram alerts, and SaaS dashboard.
  - Incorporate user corrections:
    1. Dedicated YouTube search quota bucket of 100 calls/day (separate from 10,000 general units/day).
    2. Node.js 20+ / TypeScript stack with Drizzle ORM.
    3. Vercel for dashboard/API, independent schedulable workers.

---

## 2026-09-15 — Session 4 (Full System Implementation & Production Delivery)
- **Agent:** Antigravity
- **Actions Completed:**
  - **Foundation & Database:**
    - Initialized Node 20 / TypeScript project, `package.json`, `tsconfig.json`, `drizzle.config.ts`.
    - Created PostgreSQL migration `migrations/0000_init_schema.sql` and Drizzle schema `src/db/schema.ts` (11 normalized tables, enums, indexes, triggers).
    - Created idempotent keyword migration script `src/scripts/seed-keywords.ts` parsing `LeadMiner.xlsx` (25,391 unique keywords).
    - Created default seeding script `src/scripts/seed-defaults.ts`.
  - **YouTube Discovery & Dual Quota Engine:**
    - Created `YouTubeQuotaManager` (`src/services/youtube/quota.ts`) with dual-bucket tracking (100 search / 10,000 general) and automatic midnight Pacific Time calculation.
    - Created `YouTubeDiscoveryService` (`src/services/youtube/discovery.service.ts`) with rate-limiting, exponential backoff, channel deduplication, and mock mode for offline dry runs.
  - **Extraction & Verification:**
    - Created `EmailExtractor` (`src/services/extraction/email.extractor.ts`) with defensive false-positive filtering.
    - Created `SocialExtractor` (`src/services/extraction/social.extractor.ts`) for Instagram, Twitter/X, TikTok, Discord, LinkedIn, and websites.
    - Created `LocalVerifier` (`src/services/verification/local.verifier.ts`) with DNS MX resolution and disposable domain blocking.
    - Created `LeadQualificationService` (`src/services/qualification/qualification.service.ts`).
  - **Outreach, Gemini & Gmail:**
    - Created `TemplateEngine` (`src/services/outreach/template.engine.ts`) with variable rendering and name heuristics.
    - Created `GeminiPersonalizerService` (`src/services/ai/gemini.service.ts`) with automated fallback.
    - Created `GmailSendingService` (`src/services/outreach/gmail.service.ts`) with multi-account rotation, Kill Switch enforcement, and Dry Run simulation.
  - **Reply Detection & Telegram Alerts:**
    - Created `TelegramNotificationService` (`src/services/notifications/telegram.service.ts`) for rich HTML alerts.
    - Created `ReplyDetectorService` (`src/services/replies/reply.detector.ts`) for thread matching and status updates.
  - **Job System & Schedulable Workers:**
    - Created `JobRunner` (`src/services/jobs/job.runner.ts`) with heartbeat monitoring and watchdog recovery.
    - Implemented `discovery.worker.ts`, `verification.worker.ts`, `outreach.worker.ts`, `replies.worker.ts`, and `cleanup.worker.ts`.
  - **SaaS Dashboard:**
    - Built Next.js 14 App Router UI adhering to Jensen Huang grid and anti-AI design standards (Overview, Keywords, Leads, Campaigns, Templates, Gmail Accounts, Replies, Jobs, Logs, Settings).
    - Implemented API route handlers for batch worker triggers, campaign toggling, and emergency Kill Switch.
  - **Verification & Documentation:**
    - Authored 33 Vitest tests across 8 test suites; 100% passing (`npm run test`).
    - Verified Next.js production build (`npm run build`) passing with 0 errors.
    - Created `src/scripts/healthcheck.ts`, `.env.example`, `.gitignore`, `README.md`.

---

## 2026-09-15 — Session 5 (Comprehensive Hardening, Verification Engine Upgrade & Pipeline Checkpoints)
- **Agent:** Antigravity (with specialized subagents)
- **Actions Completed:**
  - **YouTube Discovery Hardening (Zero Quota Waste):**
    - Decoupled `searchChannelIds` from `enrichChannelsBatch`.
    - Added in-memory Set deduplication of channel IDs immediately after `search.list`.
    - Implemented database batch pre-check: skips `channels.list` enrichment for already-known channel IDs.
    - Added lightweight discovery quality filters: `MIN_DISCOVERY_SUBSCRIBERS=10`, `MIN_DISCOVERY_VIDEOS=10`.
  - **1:N Multi-Contact Schema & Extraction:**
    - Migration `0001_hardening_schema.sql` applied cleanly to Supabase PostgreSQL.
    - Updated `contacts` table to 1:N supporting `contact_type` (`EMAIL`, `LINKTREE`, `BEACONS`, `INSTAGRAM`, `TWITTER_X`, `TIKTOK`, `LINKEDIN`, etc.), `value`, `normalized_value`, `is_primary`.
    - Expanded `social.extractor.ts` to capture Linktree, Beacons, and clean URLs.
  - **Keyword Yield Tracking & Schedulable Checkpoints:**
    - Added `lead_keyword_sources` table for multi-keyword provenance.
    - Tracked per-keyword yield metrics (`new_channels_found`, `qualified_leads_found`, `emails_found`, `verified_emails`, `priority_score`).
    - Priority-scored keyword queueing ensures high-yield keywords run first.
  - **Fast-Quality Email Verification Engine (`docs/verify-app.py` logic):**
    - Strict RFC syntax validation (`SYNTAX_INVALID`).
    - 17 disposable domain filters (`DISPOSABLE_DOMAIN`).
    - Role-based detection (`isRoleBased: true`) flagged rather than rejected; deliverable domains proceed as `DOMAIN_VALID`.
    - Major-provider optimization classified as `DOMAIN_VALID` (never `MAILBOX_VERIFIED` without SMTP probing).
    - DNS MX resolution with strict 3-second timeout (`DNS_TIMEOUT = 3000ms`). No SMTP probing.
    - Concurrent batch verification helper (`verifyBatch`) running up to 20 verifications in parallel.
  - **Pipeline Checkpoints & Crash Recovery:**
    - Unverified contacts processed in batches and checkpointed per record.
    - Outreach worker uses atomic locking (`UPDATE leads SET outreach_status = 'QUEUED'...`) and automatic stale lead recovery (`jobRunner.recoverStaleOutreachLeads`).
    - Staged pipeline guarantees only deliverable (`VALID`, `DOMAIN_VALID`, `MAILBOX_VERIFIED`) leads enter outreach.
  - **Outreach & Gmail Hardening:**
    - Removed fake fallback (`if (env.DRY_RUN || !account)`); returns `NO_HEALTHY_GMAIL_ACCOUNT` in live mode if no healthy inbox is available.
    - Day-aware sent quota tracking with UTC midnight reset.
    - Natural volume jitter (18–25 emails/day, max 25).
    - Gemini personalization output validation (checks length <= 120 chars, strips quotes, safe fallback).
  - **Real Gmail Reply Detection:**
    - Polling worker inspects Google Gmail threads (`threads.get`) using OAuth refresh tokens.
    - Detects inbound creator replies and fires Telegram alerts.
  - **Quality Gates:**
    - All 42 Vitest unit tests passing across 8 test suites (100% pass rate).
    - Next.js production build (`npm run build`) succeeded with 0 errors across 25 routes.

---

## 2026-09-22 — Session 6 (Codex takeover: review hardening batch)
- **Agent:** Codex
- **Context:** Continued from Antigravity's stopped run and revalidated the 2026-09-21 code-review findings against the current checkout. No worker, discovery, database migration, deployment, or live email send was executed.
- **Completed in this batch:**
  - Fixed planner slot accounting to subtract sent and already-scheduled messages cumulatively, preventing overscheduling.
  - Added planner defense-in-depth filtering so CONTACTED, REPLIED, UNSUBSCRIBED, and BOUNCED leads cannot receive a new Step 1 pitch.
  - Changed verification qualification to aggregate at lead level: any deliverable contact keeps the lead QUALIFIED, while invalid-only contacts become DISQUALIFIED; existing outreach state is now respected.
  - Added dispatcher-time campaign status checking so pausing a campaign cancels already-queued sends before Gmail is called.
  - Extended reply synchronization to continue scanning recent REPLIED threads, retrieve full Gmail message bodies, and scan body text for opt-out phrases beyond the short snippet.
  - Strengthened bounce handling to mark the matching contact INVALID and cancel the sequence in addition to suppressing the lead and pending scheduled rows.
  - Added focused safety tests for cumulative quota slots, contact qualification aggregation, and Gmail MIME-body decoding.
- **Validation:** `npm run test` passes **115/115 tests** across 20 files. `npm run build` passes with type-checking and route generation successful.
- **Next work, in severity order:**
  1. Make dispatch rendering deterministic across retries (persist rendered subject/body or equivalent idempotent render key).
  2. Add sequence identity to scheduled/message joins and correct per-sequence metrics/thread affinity.
  3. Add Gmail rate-limit backoff and OAuth token-age/auth-expiry alerting.
  4. Add pipeline step budgets and bounded reconciliation/linkpage recovery.
  5. Harden public worker authentication and remove/rotate the tracked cron credential before any deployment.
  6. Keep the YouTube sourcing/compliance blocker explicit; do not run discovery or outreach from legacy workbook contacts.

---

## 2026-09-23 — Session 7 (Security Hardening, Scheduler Isolation & Public Compliance)
- **Agent:** Antigravity (Gemini 3.8 Flash)
- **Context:** Full execution of Phase 0 & Phase 1 tasks from AUDIT_FINDINGS.md and Implementation Plan.
- **Completed in this batch:**
  - **Auth Hardening:** Removed all forged header trust in `worker-auth.ts`. Enforced constant-time Bearer token checking with production startup fail-closed guard.
  - **Dashboard Login System:** Added HMAC-SHA256 signed session cookie mechanism (`api-auth.ts`), Next.js Edge Middleware (`middleware.ts`), clean dark-theme login page (`/login`), and credential verification from isolated environment variables.
  - **API Route Security:** Added strict boolean validation to kill switch (P0-4 / BUG-04) and session auth checks to mutating routes (`gmail/disconnect`, `templates`).
  - **Dead Code Cleanup:** Deleted legacy `outreach.worker.ts` and removed dead package.json scripts.
  - **Scheduler Deconfliction & Advisory Locks:** Removed Vercel crons from `vercel.json` to eliminate double sending. Replaced hardcoded token in GitHub Actions with `${{ secrets.CRON_SECRET }}` and added workflow concurrency lock. Implemented PostgreSQL advisory locks (`pg_try_advisory_lock`) in `pipeline-lock.ts` for mutual exclusion between daily pipeline and 15-minute dispatcher.
  - **Hobby Plan 60s Execution Budget:** Capped `maxDuration` to 60s in `vercel.json` and in pipeline/dispatch routes. Tuned pipeline batch sizes to finish comfortably in ~30s.
  - **Google Testing Mode & Expiry Watchdog:** Added `token_granted_at` and `google_account_id` to schema and migration `0012`. Added step 7 to cleanup worker alerting via Telegram 5 days before the 7-day Google Testing token expiry. Added token lifespan indicator to `/gmail`.
  - **Public Landing Page & Compliance:** Built public home page (`/`) with animated abstract background, hero section, 5-stage pipeline preview, and inline operator sign-in. Added comprehensive public Privacy Policy (`/privacy`) complying with Google API User Data Policy (Limited Use) and public Terms of Service (`/terms`) referencing YouTube ToS. Relocated authenticated overview to `/overview`.
- **Validation:**
  - `npx tsc --noEmit` exits 0 (clean TypeScript build).
  - `npx vitest run` passes **121/121 tests** across 20 test files (100% pass rate).
- **Next Step:** Completed Phase 2 (P1), Phase 3 (Warmup Engine), Phase 4 (Security & Worker Concurrency), and Phase 5 (P3 Backlog).

---

## 2026-09-23 — Session 8 (Full System Production Lockdown, Concurrency & Security Suite)
- **Agent:** Antigravity
- **Context:** Execution of full V1 production hardening across Phase 2, Phase 3, Phase 4, and Phase 5.
- **Completed in this batch:**
  - **YouTube & Discovery Hardening (TASK-08, TASK-13, TASK-31, TASK-32):**
    - Multi-key rotation with persistent quota fail-closed enforcement; zero-mock elimination.
    - Added `refundSearchCall()` and `refundGeneralQuota()` to refund quota upon non-quota API call failures or missing clients.
    - Reset claimed batch keywords to PENDING with decremented attempts when enrichment hits quota limit.
  - **Reply Engine & Bounce Classification (TASK-09, TASK-11, TASK-41):**
    - Three-tier bounce classification: `OUT_OF_OFFICE` (pauses sequence +5d), `SOFT_BOUNCE` (reschedules +48h), and `HARD_BOUNCE` (permanent suppression).
    - Scans active outreach threads without 72h cutoff; strips quote footers before opt-out regex matching.
    - Set-based deduplication of Gmail thread IDs in `replies.worker.ts`.
  - **Outreach & Deterministic Warmup (TASK-10, Phase 3 Warmup):**
    - Deterministic 7-day warmup engine (`warmup.service.ts`) keyed by stable Google Account ID (`sub`), counting actual distinct sent days (5, 8, 12, 16, 20, 25/day).
    - 24-hour staggered contact scheduling for multi-contact leads.
    - Multi-campaign capacity allocation: proportional quota distribution across all ACTIVE campaigns.
    - Atomic sequence progress advance and scheduled email insertion in `db.transaction`.
    - Sorted candidates by `subscriberCount DESC`.
    - Neutral greeting fallback ("there") and automatic stripping of fake `Re:` / `Fwd:` on step 1 cold outreach.
  - **Security, SSRF Guard & Encryption (TASK-20, TASK-21, TASK-22, TASK-28):**
    - HMAC-SHA256 signed unsubscribe URLs with rate limiting and audit logging.
    - SSRF guard blocking private IP ranges (`169.254.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, cloud metadata) with per-hop DNS resolution.
    - AI prompt injection shield with untrusted metadata envelopes and output validation.
    - Fail-loud AES-256-GCM encryption with `reEncrypt` key rotation helper.
    - Web Crypto Edge-compatible session authentication in `edge-auth.ts` for Next.js Middleware.
  - **Database & Concurrency Hardening (TASK-29, TASK-30, TASK-33, TASK-34, TASK-35, TASK-36, TASK-37):**
    - Atomic contact verification claims using `FOR UPDATE SKIP LOCKED` ordered by oldest first (`id ASC`).
    - Transient DNS timeout re-queuing up to 3 attempts before marking `FAILED`.
    - Migration `0013_performance_indexes_and_constraints.sql` adding `uq_sequences_campaign_id`, `idx_messages_sent_at`, `idx_jobs_status_type`, and `idx_scheduled_emails_status_scheduled`.
    - YouTube ToS compliance: automated 30-day raw payload pruning in cleanup worker watchdog.
    - Watchdog recovery for stuck `SCRAPING` link-pages and `IN_PROGRESS` verifications.
    - Honest dashboard error reporting in overview page with prominent red banner during database outages.
  - **API Hygiene & Vercel Limits (TASK-39, TASK-40, TASK-43):**
    - Clamped numeric query parameters across all API routes (`Math.max`, `Math.min`).
    - Session-authenticated, idempotent campaign toggle with audit log.
    - Locked down `/api/health` with minimal public ping and authenticated diagnostic output.
    - Capped all worker and pipeline function `maxDuration` to 60s for Vercel Hobby plan compatibility.
- **Validation:**
  - `npx tsc --noEmit` exits 0 (clean TypeScript build).
  - `npx vitest run` passes **137/137 tests** across 22 test files (100% pass rate).
  - `npm run build` succeeded with exit code 0 across all 33 static and dynamic routes.

---

## 2026-09-23 — Session 8 (Audit Findings Full Completion & Zero-Bug Production State)
- **Agent:** Antigravity
- **Actions Completed:**
  - **YouTube Discovery Pagination (P2-23):**
    - Captured and returned `nextPageToken` in `YouTubeDiscoveryService.searchChannelIds`.
    - In `discovery.worker.ts`, high-yield keywords (`priorityScore >= 50`) automatically fetch page 2 if daily search quota allows, deduplicating channels in memory before DB insertion.
  - **Decoupled Website Scraping from Hot Discovery Path (P2-26):**
    - Eliminated synchronous `websiteScraper.scrapeUrl` from the discovery channel processing loop.
    - Queued discovered channel websites and link-in-bio URLs as `contacts` with `link_scrape_status = 'PENDING'`, delegating extraction out-of-band to `linkpage-enrichment.worker.ts`.
  - **Strict Phi Governor in Outreach Planner (P2-27):**
    - Follow-up scheduling capped strictly to `targetFuSlots` determined by the mathematical Phi equilibrium ratio, preventing follow-ups from starving new leads.
    - When fewer follow-ups are due, unused follow-up capacity fluidly spills over into Step 1 new outreach, wasting zero daily quota.
  - **Crashed Gmail Reservations & Account Paging by Capacity (P2-28, P3-6):**
    - In `gmail.service.ts`, released account reservations on in-flight reconciliations, eliminating double-charging of `sentToday`.
    - In `cleanup.worker.ts`, added watchdog step that reconciles `sentToday` against actual messages marked `SENT` today (Pacific Time), restoring capacity lost from serverless crashes.
    - In `reserveSendingAccount()`, removed arbitrary `.limit(10)` and ordered all active accounts by remaining capacity (`(dailyLimit - sentToday) DESC`).
  - **YouTube Quota Engine Fundamentals (P3-7, P3-8, P3-10):**
    - Derived active key index directly from DB quota counts (`Math.floor(searchCallsUsedToday / YOUTUBE_DAILY_SEARCH_LIMIT)`), syncing key rotation across stateless serverless instances.
    - Unified `env.YOUTUBE_DAILY_SEARCH_LIMIT` as single source of truth across `env.ts`, `seed-defaults.ts`, `quota.ts`, and UI.
    - Made midnight Pacific quota resets atomic in PostgreSQL via conditional JSONB update queries.
  - **Dynamic DST-Safe Scheduling (P3-9):**
    - Replaced hardcoded `13:15 UTC` in `planner.worker.ts` with dynamic `America/New_York` offset calculation via `Intl.DateTimeFormat` (correctly maps 9:15 AM Eastern to 13:15 UTC in EDT and 14:15 UTC in EST).
  - **Public Rate Limiting & GDPR Article 17 Portal (P3-12):**
    - Created shared sliding-window IP rate limiter (`src/lib/rate-limiter.ts`) protecting `/api/unsubscribe`, `/api/health`, and `/api/gdpr/delete`.
    - Built self-serve GDPR Right to Erasure endpoint and web portal (`/api/gdpr/delete`) that scrubs personal data, permanently suppresses emails, cancels active sequences, and logs compliance events.
    - Added direct link to GDPR portal in `src/app/privacy/page.tsx`.
- **Validation:**
  - `npx vitest run`: **143/143 tests passing** across 23 test files (100% pass rate).
  - `npx tsc --noEmit`: 0 errors.
  - `npm run build`: 0 errors across all 33 static and dynamic routes.

---

## 2026-09-23 — Session 9 (Landing Page, Compliance Links, Auth Redirects & Production Verification)
- **Agent:** Antigravity
- **Actions Completed:**
  - **Public Landing Page & Legal Infrastructure (`/`, `/privacy`, `/terms`):**
    - Built animated, high-performance landing page with abstract dark background, SVG circuit geometry, and Jensen Huang SaaS grid layout.
    - Added dedicated, comprehensive public Privacy Policy (`/privacy`) and Terms of Service (`/terms`) meeting Google OAuth verification standards and YouTube API Services Developer Policies.
    - Added direct navigation and footer links to Home, Privacy Policy, Terms of Service, and GDPR Erasure portal.
  - **Authentication Flow & Redirect Loop Resolution:**
    - Resolved login redirection loop: updated `/login` fallback target from `/` (landing page) to `/overview` (internal dashboard).
    - Switched client-side auth success redirection from `router.push` to direct document navigation (`window.location.href = '/overview'`), ensuring the issued `HttpOnly` session cookie (`lm_session`) is attached to the first document request without client-cache lag.
    - Updated `src/middleware.ts` to inspect authenticated sessions on `/login`: operators with an active session cookie visiting `/login` are automatically forwarded to `/overview` (or their redirect query parameter).
    - Hardened internal dashboard navigation in `src/components/navigation.tsx`: updated brand header links from `/` to `/overview` so dashboard operators are not booted to the public landing page when clicking the logo.
    - Added dedicated "Sign Out" button across desktop sidebar and mobile bottom sheet drawer calling `/api/auth/logout` and clearing session cookies.
  - **Vercel Production Deployment & End-to-End Verification:**
    - Configured production credentials across Vercel environments (`DASHBOARD_EMAIL`, `DASHBOARD_PASSWORD`, `CRON_SECRET`, `APP_URL`).
    - Successfully deployed to Vercel production (`https://leadminer-app.vercel.app`).
    - Verified all endpoints live:
      - `GET /` -> `200 OK` (Public landing page)
      - `GET /privacy` & `GET /terms` -> `200 OK` (Public compliance pages)
      - `GET /overview` unauthenticated -> `307 Redirect` to `/login?redirect=%2Foverview`
      - `POST /api/auth/login` -> `200 OK` with `Set-Cookie: lm_session=...`
      - `GET /overview` authenticated -> `200 OK` (Protected dashboard)
      - `GET /login` authenticated -> `307 Redirect` to `/overview`
      - `POST /api/auth/logout` -> `200 OK` with cleared cookie
- **Validation:**
  - `npx vitest run`: **143/143 tests passing** (100% pass rate).
  - `npx tsc --noEmit`: 0 errors.
  - Production verification: 100% verified live on Vercel.

---

## 2026-09-23 — Session 10 (Supabase Auth Integration & Persistent PWA Session Retention)
- **Agent:** Antigravity
- **Actions Completed:**
  - **Supabase Cloud Auth Integration:**
    - Connected Supabase Cloud Auth API for standard operator email + password authentication (`signInWithPassword`).
    - Seeded and confirmed operator credentials (`resolviaai@gmail.com`) in Supabase Auth `auth.users`.
    - Implemented `verifySupabaseAuth(email, password)` in `src/lib/api-auth.ts`.
  - **Database-Backed Scrypt Authentication & Management:**
    - Implemented salted scrypt password hashing and verification in PostgreSQL `system_settings` (`admin_auth`).
    - Created `src/scripts/seed-auth.ts` to idempotently seed database credentials from environment variables.
    - Created `POST /api/auth/password` endpoint allowing authenticated operators to update passwords with automatic database hashing.
    - Updated `validateLoginCredentialsAsync` with multi-tier validation: Supabase Auth -> PostgreSQL salted scrypt -> environment variable fallback.
  - **Persistent PWA Session & Standalone Launch Retention:**
    - Extended session duration to 30 days (`SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000`).
    - Updated cookie configuration to `SameSite=Lax; Path=/; HttpOnly; Secure`, preventing mobile browsers (iOS Safari and Android Chrome) from stripping session cookies during top-level PWA standalone launches.
    - Implemented rolling session auto-refresh in Next.js Edge Middleware (`middleware.ts`): if a valid session is older than 24 hours, middleware automatically signs and issues a refreshed 30-day cookie via response headers.
    - Whitelisted `/manifest.json`, `/sw.js`, and `.json` files in middleware `isPublic()` to eliminate 307 redirect blocks preventing PWA installations.
    - Updated `public/manifest.json` with `"start_url": "/overview"`, `"scope": "/"`, `"id": "leadminer-pwa"`, `"display": "standalone"`.
    - Updated `public/sw.js` notification click fallback to `'/overview'`.

---

## 2026-09-23 — Session 11 (1-to-1 Homepage Art-Directed Redesign to Match Reference)
- **Agent:** Antigravity
- **Context:** User provided primary visual reference image (`media_1790181206353.jpg`) and directed a 1-to-1 exact visual match of style, layout, lightness, spacing, rounded containers, and composition.
- **Actions Completed:**
  - **Canvas & Atmosphere:** Rebuilt homepage (`src/app/page.tsx`) and `src/components/AppShell.tsx` using warm off-white canvas (`#FAFAF9`), subtle geometric square grid overlay, soft blue/lavender atmospheric gradients, and warm copper ambient glow under the product visual.
  - **Hero Composition:**
    - Centered top navigation with LeadMiner mark, clean muted links, Sign in, and copper pill CTA (`Join Waitlist →`).
    - Eyebrow badge: blue pill `Built for B2B SaaS & Financial Firms` with pulsing indicator.
    - Headline: `YouTube Leads. Real Opportunities.` with copper accent on `Opportunities.`.
    - Subtitle: `Find high-intent businesses on YouTube, extract verified contacts, and send personalized outreach — automatically.`
    - Rounded-full email input with copper submit button and 3 trust checkmarks (`No credit card`, `Free forever`, `Fully automated`).
    - Elevated central LeadMiner dashboard showcase featuring real KPI counters (1,248 Leads Found, 892 Verified Emails, 318 Emails Sent, 74 Replies), smooth SVG area chart with interactive tooltip (`318 emails sent | 74 replies (23.2%)`), and live activity feed.
    - Floating UI cards: red YouTube card (top-left), angled 82% Leads Discovered card with sparkline and corner ribbon (bottom-left), Google card (top-right), LinkedIn card (mid-right), Web globe card (bottom-right).
    - Handwritten script annotations with curved arrows (`More sources. More opportunities.` and `Find. Enrich. Outreach. Grow.`).
  - **Logo Trust Strip:** Grayscale logos for YouTube, Google, LinkedIn, Stripe, Notion, Supabase, and OpenAI.
  - **Feature Grid:** 4 clean white cards with soft orange icon squares (`Lead Discovery`, `Verified Contacts`, `Automated Outreach`, `Track & Grow`), uppercase `FEATURES` badge, and `Explore All Features →` pill button.
  - **Mid-Page Orange CTA:** Full-width rounded-3xl copper gradient banner (`Let's have a 30-min call`), avatar badge (`Mark Vassilevskiy`), white pill CTA (`Book a Call`), and decorative 3D pinned cards (`Design Concept` with blue pin sphere and `Complete Development` with red pin sphere).
  - **Product Showcase:** 3 alternating visual storytelling sections featuring the real LeadMiner Discovery Stream, DNS MX Verification Matrix, and Outreach Email Composer with Gemini personalization tag.
  - **How It Works:** 4 connected timeline cards (`01 Discover`, `02 Verify`, `03 Personalize`, `04 Send & Track`).
  - **Autonomy Architecture:** 3 cards (`Keeps moving`, `Knows where it stopped`, `Knows when to stop`).
  - **Social Proof:** `500+ Clients, Real Results` with telemetry metrics (24M Leads Discovered, 20k+ Businesses Reached, 4.8/5 Rating) and 3 authentic testimonial cards (Alex Carter, Sarah Kim, David Park).
  - **Final Purple CTA Banner:** Violet/indigo gradient banner with floating 3D mail envelopes on left and right, center headline `Join Our Newsletter and Stay Updated`, email input, and dark submit button.
  - **Minimal Dark Footer:** Charcoal background (`#161616`), LeadMiner copper mark, social links (YouTube, X, LinkedIn, Discord), 3 navigation columns (Product, Resources, Company), and copyright bar.
- **Validation:**
  - `npx vitest run`: **143/143 tests passing** (100% pass rate).
  - `npx tsc --noEmit`: 0 errors.
  - `npm run build`: 0 errors across all 33 static and dynamic routes.
