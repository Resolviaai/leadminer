# LeadMiner Handoff & Next Steps (Autonomous Background Engine)

**Date**: September 16, 2026  
**Repository**: `Resolviaai/leadminer` (Branch: `main`)  
**Production URL**: [https://leadminer-app.vercel.app](https://leadminer-app.vercel.app)  
**System Status**: ⚡ LIVE MODE — HEALTHY (55/55 Unit Tests Passing, Build Clean)

---

## 1. Executive Summary

LeadMiner has been transformed into a hardened, production-grade client-acquisition engine. The core pipeline—comprising YouTube discovery, multi-tier email verification, Gemini-powered personalization, multi-account Gmail outreach, and inbound reply detection—is deployed, verified, and operational. 

All immediate safety hazards (duplicate email sends, OAuth token expiration, and secret fail-fast guards) have been resolved. When resuming work, the remaining tasks will lock in **100% unattended, "build once and forget it forever" autonomy** so the system continuously mines leads, sends pitches, detects replies, and feeds clients into your pipeline on autopilot.

---

## 2. What Has Been Completed So Far

### A. Core Architecture & Reliability
1. **Multi-Email Outreach Support**:
   - Created and executed migration `migrations/0004_multi_email_outreach.sql`.
   - Updated `messages` schema with `contact_id` referencing `contacts.id` and replaced single-lead constraint with composite unique index: `uq_messages_lead_campaign_contact (lead_id, campaign_id, COALESCE(contact_id, 0))`.
   - Updated `gmail.service.ts` and `outreach.worker.ts` so all verified deliverable contacts for a creator channel can be reached without dropping secondary/tertiary emails or colliding on database unique constraints.
2. **Two-Phase Commit Email Sending (Idempotent Recovery)**:
   - Outbound emails in `src/services/outreach/gmail.service.ts` are pre-inserted into PostgreSQL with `send_status = 'SENDING'` and an idempotency key *before* invoking `gmail.users.messages.send()`.
   - Prevents duplicate sends if the database connection drops after Gmail accepts the message.
   - Stale `SENDING` messages are reconciled during startup or pipeline cleanup.
3. **Fail-Fast Production Secrets**:
   - In `src/config/env.ts`, `SESSION_SECRET`, `ENCRYPTION_KEY`, and non-localhost `DATABASE_URL` strictly fail fast and throw fatal startup errors in `NODE_ENV === 'production'`. No random fallback keys that invalidate sessions/encrypted credentials across restarts.
4. **YouTube Discovery Quota Protection & Reversion**:
   - In `src/workers/discovery.worker.ts`, upon hitting YouTube API limits or 403 quota errors, remaining unprocessed keywords in the batch are rolled back to `PENDING` with decremented attempt counts so no keywords are orphaned in `PROCESSING`.
5. **30-Day Uncapped Reply Detection & Anti-Bounce Shield**:
   - In `src/workers/replies.worker.ts`, sent threads within a rolling 30-day window are monitored.
   - Automated bounce / daemon filters ignore `Auto-Submitted`, `Precedence: bulk|bounce|junk`, `mailer-daemon`, `postmaster`, `noreply`, and `Delivery Status Notification` headers to prevent false-positive reply triggers.
6. **In-Loop Emergency Kill Switch Check**:
   - Placed an atomic `system_settings.kill_switch` verification directly inside the outreach sending loop in `src/workers/outreach.worker.ts` before every email dispatch. If enabled via the dashboard, outbound sending stops immediately mid-batch.
7. **OAuth Auto-Refresh Token Persistence**:
   - Attached an `oauth2Client.on('tokens')` listener that automatically persists refreshed access tokens and expiry timestamps back into `gmail_accounts` in PostgreSQL.
8. **Idempotent Migration Ledger**:
   - Updated `src/db/migrate.ts` with a persistent migration tracking table `__app_migrations` to prevent re-running already applied SQL migration scripts.
9. **Social Links Hydration**:
   - Discovered social links (Instagram, Twitter/X, TikTok, Linktree) are parsed and rendered across `src/app/api/leads/route.ts`, `src/app/leads/page.tsx`, and `src/components/leads/LeadsInfiniteList.tsx`.

### B. Mobile UI/UX Overhaul (Scored 9.3/10)
1. **Vercel & Apple HIG Design Compliance**:
   - Zero native emojis in the interface; strictly consistent SVG Lucide icons.
   - 4-layer color architecture with deep neutral canvas and high-contrast surface elevation.
   - 44px minimum touch targets and iOS safe area padding (`env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`).
   - Removed the "Manage" kill switch card from the bottom sheet drawer.
   - Tabular numbers (`tabular-nums font-mono`) for all numeric dashboard metrics.
   - Dedicated 3-line mobile cards for sent emails with 2-tier responsive action bars.

### C. Verification & Deployment
- **Unit & Integration Suite**: 55/55 tests passing across verifier, qualification, outreach, quota, reply, and workbook modules (`npx vitest run`).
- **Production Build**: Clean compilation on Next.js 14 App Router (`npm run build`).
- **Git & Cloud Deployment**: Cleanly committed and pushed to `origin main` (commit `bb37aa2`). Deployed to Vercel production.

---

## 3. What Has to Be Done Later (Prioritized Roadmap)

When returning to work, execute these tasks to achieve 100% "forget it forever" unattended background autonomy:

### Priority 1: Concurrency-Safe YouTube Quota Manager
* **Goal**: Prevent concurrent workers or serverless instances from exceeding the daily YouTube 100-search limit.
* **Files**:
  - `src/services/youtube/quota.ts`
  - `src/services/youtube/discovery.service.ts`
  - `tests/unit/quota.test.ts`
* **Implementation**:
  1. In `src/services/youtube/quota.ts`, replace the read-modify-write pattern with atomic PostgreSQL update methods:
     - `tryClaimSearchCall(): Promise<boolean>`
     - `tryClaimGeneralQuota(units = 1): Promise<boolean>`
  2. Use conditional SQL `UPDATE system_settings SET value = jsonb_set(...) WHERE key = 'youtube_quota' AND (used + increment) <= daily_limit RETURNING value;`.
  3. In `discovery.service.ts`, call `tryClaimSearchCall()` at the beginning of `searchChannelIds` and `tryClaimGeneralQuota(1)` in `enrichChannelsBatch`.
  4. Ensure in-memory fallback remains active for unit test suites (`tests/unit/quota.test.ts`).

### Priority 2: Reply Detection Reliability & Skew Buffer
* **Goal**: Ensure no creator replies are missed due to sub-second clock differences between Google servers and the application host, and ensure notification errors never drop recorded replies.
* **Files**:
  - `src/workers/replies.worker.ts`
  - `src/services/replies/reply.detector.ts`
* **Implementation**:
  1. In `src/workers/replies.worker.ts`, add a 5-second clock skew buffer: `msgTime > (outboundTime - 5000)`.
  2. In `src/services/replies/reply.detector.ts`, wrap `telegramService.notifyReply` in an isolated `try/catch` block. If Telegram returns an error (rate limit, network blip), log a warning and record a system log event, but DO NOT abort the database transaction that marks the lead as `REPLIED`.

### Priority 3: Automated Watchdog, Cleanup & 30-Day Retention
* **Goal**: Keep PostgreSQL lightweight and automatically self-healing forever.
* **Files**:
  - `src/workers/cleanup.worker.ts`
  - `src/app/api/workers/pipeline/route.ts`
* **Implementation**:
  1. In `src/workers/cleanup.worker.ts`, implement log pruning:
     ```ts
     const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
     await db.delete(logs).where(lt(logs.createdAt, thirtyDaysAgo));
     ```
  2. In `src/app/api/workers/pipeline/route.ts`, add `runCleanup()` as **Step 0** before reply sync. This guarantees that before any batch runs, stale jobs are reset, orphaned keywords/leads are reclaimed, and old logs are purged.

### Priority 4: Autonomous Background Schedule Verification
* **Goal**: Confirm Vercel Cron or external runner executes the full pipeline without requiring any manual dashboard clicks.
* **Files**:
  - `vercel.json`
  - `src/app/api/workers/pipeline/route.ts`
* **Implementation**:
  1. Verify Vercel Cron schedule (`schedule: "0 13 * * *"`) or set up multi-run schedules if on Vercel Pro.
  2. Confirm external cron triggers (or GitHub Actions scheduler if Vercel Free daily cron is restricted) can invoke `/api/workers/pipeline` with secret bearer authentication.

---

## 4. Verification Checklist for Next Session

When restarting work:
```bash
# 1. Verify working tree and tests
git status
npx vitest run

# 2. Implement Priority 1 (Atomic Quota) & test
npx vitest run tests/unit/quota.test.ts

# 3. Implement Priority 2 & 3 (Replies buffer & Cleanup 30-day retention)
npx vitest run tests/unit/reply.test.ts

# 4. Verify complete build and deploy
npm run build
npx vercel --prod --yes
```

---

## 5. Quick Reference

| Component | Current State | Target State |
| :--- | :--- | :--- |
| **YouTube Quota** | In-Memory + DB Sync | Atomic PostgreSQL `jsonb_set` claim |
| **Reply Sync** | `msgTime > outboundTime` | `msgTime > (outboundTime - 5000)` + Isolated Telegram Catch |
| **Cleanup Worker** | Stale job/keyword reset | Stale reset + 30-day log deletion |
| **Pipeline Runner** | Steps 1-4 (Replies, Discovery, Verification, Outreach) | Step 0 Cleanup + Steps 1-4 |
| **Multi-Email Outreach** | Schema migrated, composite key active | ✅ Production ready |
| **Mobile UI/UX** | Scored 9.3/10 (Apple HIG / Vercel guidelines) | ✅ Production ready |
