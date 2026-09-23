# LeadMiner V1 Hardening — Handoff Document

> **Last Updated:** 2026-09-23T15:12:00+05:30  
> **Status:** Phase 0 & Phase 1 Complete (Tasks 01–07 + Public Compliance Suite). All tests passing.

---

## 1. Completed Work

### Phase 0: Security & Auth Lockdown (P0)
- **TASK-01: Full Worker Auth Lockdown (`src/lib/worker-auth.ts`)**
  - Completely removed all forged header trust (`User-Agent: vercel-cron`, `x-vercel-cron`, `sec-fetch-site: same-origin`, `origin`, `referer`).
  - Enforced constant-time Bearer token comparison (`crypto.timingSafeEqual`) against `CRON_SECRET`.
  - Added fail-closed startup assertion: all worker routes immediately lock with HTTP 503 if `CRON_SECRET` is missing in production.
- **TASK-02: Dashboard Credentials & Session System (`src/lib/api-auth.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`)**
  - Built an HMAC-SHA256 signed session cookie mechanism (`lm_session`, HttpOnly, SameSite=Strict, Secure in production, 7-day TTL).
  - Credentials stored strictly in isolated environment variables (`DASHBOARD_EMAIL`, `DASHBOARD_PASSWORD`), validated using constant-time string comparisons.
  - Implemented Next.js Edge Middleware (`src/middleware.ts`) guarding all dashboard pages and mutating API endpoints.
  - Designed a high-aesthetic login page following anti-AI standards (canvas `#161616`, brand copper `#C46A3A`, Lucide icons, no emojis, password visibility toggle).
- **TASK-03: Kill Switch & Mutating Routes Security (`src/app/api/kill-switch/route.ts`, `src/app/api/gmail/disconnect/route.ts`, `src/app/api/templates/route.ts`)**
  - Fixed P0-4 / BUG-04: Enforced strict boolean validation on kill switch POST (rejects strings like `"false"`, empty bodies, and non-booleans with HTTP 400).
  - Protected `gmail/disconnect` and `templates` routes with `verifyDashboardAuth`.
- **TASK-04: Dead File Cleanup**
  - Removed dead legacy v1 file `src/workers/outreach.worker.ts`.
  - Cleaned package.json scripts (`worker:outreach` removed).

### Phase 1: Schedulers & Infrastructure
- **TASK-05: Schedulers Conflict Resolution & Overlap Protection (`vercel.json`, `.github/workflows/daily-pipeline.yml`, `src/lib/pipeline-lock.ts`, `SCHEDULER_SETUP.md`)**
  - Deleted Vercel crons from `vercel.json` to eliminate duplicate runs and double sending.
  - Secured GitHub Actions `daily-pipeline.yml` by replacing the plaintext token with `${{ secrets.CRON_SECRET }}` and removing fake User-Agent headers. Added GitHub Action concurrency group to prevent overlapping runs.
  - Implemented PostgreSQL advisory locks (`pg_try_advisory_lock`) in `src/lib/pipeline-lock.ts` for atomic mutual exclusion across the daily pipeline and 15-minute dispatcher.
  - Documented complete setup in `SCHEDULER_SETUP.md` for GitHub Secrets and cron-job.org.
- **TASK-06: 60s Execution Budget for Vercel Hobby Plan (`src/app/api/workers/pipeline/route.ts`, `src/app/api/workers/dispatch/route.ts`, `vercel.json`)**
  - Capped function `maxDuration` to 60s in `vercel.json` and in route exports.
  - Adjusted batch limits (Discovery 12 keywords, Verification 25 contacts) so pipeline runs complete within ~30-35s.
- **TASK-07: Gmail Token Expiry Watchdog & Testing Mode Compliance (`src/db/schema.ts`, `migrations/0012_...sql`, `src/app/api/auth/google/callback/route.ts`, `src/workers/cleanup.worker.ts`, `src/components/gmail/GmailAccountsClient.tsx`)**
  - Added `token_granted_at` and `google_account_id` columns to `gmail_accounts` table.
  - Tracked timestamp and stable Google account ID in OAuth callback.
  - Added step 7 in cleanup watchdog: evaluates token age and triggers Telegram critical alerts starting 5 days before the 7-day Google Testing mode token expiry.
  - Added visual token lifespan warning chip to connected Gmail accounts on `/gmail`.

### Public Landing Page & Google OAuth Compliance
- **Public Home Landing Page (`src/app/page.tsx`):**
  - Built an animated, abstract background (SVG circuit/mesh lines, radial gradient spotlight, copper ambient glow).
  - High-impact hero section with value proposition, real-time 5-stage pipeline preview, and an inline operator sign-in panel.
  - System architecture grid and capability breakdowns.
  - Re-homed authenticated dashboard overview to `/overview`.
  - Added `AppShell` component (`src/components/AppShell.tsx`) to dynamically render full-width public pages versus authenticated dashboard chrome.
- **Public Legal Pages (`src/app/privacy/page.tsx`, `src/app/terms/page.tsx`):**
  - Complete, legally-sound Privacy Policy complying with the Google API Services User Data Policy (Limited Use, Gmail read/send scopes, no data selling, no AI training on emails).
  - YouTube Terms of Service compliance and reference links.
  - Reciprocal navigation between Home (`/`), Privacy (`/privacy`), Terms (`/terms`), and Login (`/login`).

---

## 2. Files Changed & Added

### Created Files
- `HANDOFF.md` (this file)
- `DEFERRED_DECISIONS.md` (records owner-deferred items: YouTube 30-day ToS, non-YouTube adapter)
- `SCHEDULER_SETUP.md` (step-by-step setup for GitHub Secrets & cron-job.org)
- `migrations/0012_token_granted_and_google_account_id.sql`
- `src/lib/api-auth.ts` (session auth with HMAC-SHA256, timingSafeEqual)
- `src/lib/pipeline-lock.ts` (PostgreSQL advisory lock helper)
- `src/middleware.ts` (Next.js Edge middleware)
- `src/components/AppShell.tsx` (chrome wrapper separating public from authenticated dashboard)
- `src/app/login/page.tsx` (login page)
- `src/app/privacy/page.tsx` (public privacy policy)
- `src/app/terms/page.tsx` (public terms of service)
- `src/app/overview/page.tsx` (authenticated dashboard overview)
- `src/app/api/auth/login/route.ts` (session login API)
- `src/app/api/auth/logout/route.ts` (session logout API)

### Modified Files
- `.github/workflows/daily-pipeline.yml` (uses `${{ secrets.CRON_SECRET }}`, concurrency guard)
- `package.json` (removed dead `worker:outreach` script)
- `vercel.json` (removed crons array, set maxDuration: 60)
- `src/config/env.ts` (added `DASHBOARD_EMAIL`, `DASHBOARD_PASSWORD`, production assertions)
- `src/db/schema.ts` (added `tokenGrantedAt`, `googleAccountId` to `gmailAccounts`)
- `src/lib/worker-auth.ts` (Bearer-only auth, timing-safe string comparison, fail-closed in prod)
- `src/middleware.ts` (configured public routes: `/`, `/privacy`, `/terms`, `/login`, etc.)
- `src/app/layout.tsx` (integrated `AppShell`)
- `src/app/page.tsx` (transformed into public animated landing page with inline login)
- `src/app/gmail/page.tsx` (selected `tokenGrantedAt` for accounts)
- `src/components/navigation.tsx` (updated Overview route to `/overview`)
- `src/components/gmail/GmailAccountsClient.tsx` (added Google Testing token lifespan badge)
- `src/app/api/kill-switch/route.ts` (strict boolean check, session auth)
- `src/app/api/gmail/disconnect/route.ts` (session auth)
- `src/app/api/templates/route.ts` (session auth)
- `src/app/api/auth/google/callback/route.ts` (records `tokenGrantedAt` and `googleAccountId`)
- `src/app/api/workers/pipeline/route.ts` (advisory lock, 60s maxDuration, lean batches)
- `src/app/api/workers/dispatch/route.ts` (advisory lock, 60s maxDuration)
- `src/workers/cleanup.worker.ts` (5-day token expiry check and Telegram alert)
- `tests/unit/worker-auth.test.ts` (updated to test Bearer-only and session cookie invariants)

### Deleted Files
- `src/workers/outreach.worker.ts` (legacy v1 dead code)

---

## 3. Tests Performed

- **TypeScript Compilation:** `npx tsc --noEmit` -> **0 errors, exit code 0**.
- **Vitest Test Suite:** `npx vitest run` -> **20 passed files (100%), 121 passed tests (100%)**.
- **Worker Auth & Session Security Tests (`tests/unit/worker-auth.test.ts`):** 8/8 passed:
  - Rejection of forged `vercel-cron` User-Agent header (401).
  - Rejection of forged `sec-fetch-site: same-origin` header (401).
  - Rejection of invalid Bearer token (401).
  - Acceptance of valid Bearer token matching `CRON_SECRET` (200).
  - Fail-closed 503 response if `CRON_SECRET` is unset in production.
  - Constant-time validation of dashboard credentials.
  - Issuance and verification of tamper-evident session cookie.

---

## 4. Remaining Issues (in Priority Order)

Next is **Phase 2: Core Bug Fixes (P1)**:
- **TASK-08 (P1-10):** No-YouTube-key guard in `discovery.worker.ts` — refuse to run, alert Telegram, never generate mock leads.
- **TASK-09 (P1-11, P1-12):** Bounce classification in `replies.worker.ts` — check email direction, classify hard vs soft vs OOO (hard: suppress; soft: retry 48h; OOO: pause 5d).
- **TASK-10 (P1-13, Decision 6):** Multi-email staggering in `planner.worker.ts` — primary contact immediately, next contact +24h; cancel all contacts if any replies/bounces.
- **TASK-11 (Decision 7):** Reply scan & Replies tab fix — scan ALL threads for opt-outs; fix Replies tab UI (newest first, snippet, "Stop emailing" + "Mark handled").
- **TASK-12 (P1-6):** Gmail disconnect sequence repinning / cancellation.
- **TASK-13 (P1-7, P1-8):** YouTube quota fail-closed on DB error + per-key exhaustion tracking.
- **TASK-14 (P1-3):** Gmail 429 exponential backoff + Telegram rate-limit alert.
- **TASK-15 (P1-16):** Fix campaign metrics calculation (join messages on sequenceId, count thread-level replies).
- **TASK-16 (P1-17):** Telegram notification retries on network failure.
- **TASK-17 (P1-14):** Sequence cancellation transaction propagation.

Followed by **Phase 3 (Priority Queue & Warmup)**, **Phase 4 (P2 bugs)**, and **Phase 5 (P3 backlog)**.

---

## 5. Exact Next Step

Begin **TASK-08 (P1-10: YouTube API Key Guard)**:
1. Open `src/workers/discovery.worker.ts`.
2. Inspect `hasConfiguredYouTubeKey()` and verify behavior when all keys are blank/placeholder.
3. Throw terminal error, notify Telegram with critical alert, and ensure zero fake/mock channels are ever inserted.
4. Run `npx vitest run` and `npx tsc --noEmit`.
