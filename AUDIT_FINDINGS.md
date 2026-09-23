# LeadMiner — Full Audit Findings (66 real problems)
# Source: 12-agent red team audit. Solutions are suggestions — not gospel.
# Status column: [ ] = open, [x] = already fixed, [?] = needs owner decision
# Last updated: 2026-09-23

---

## P0 — Fix Before Next Unattended Run (4 items)

### P0-1 [x] Worker auth accepts forged browser headers
- **Problem:** sec-fetch-site, user-agent, origin/referer headers can be faked by any HTTP client. Every "protected" worker route is effectively public.
- **Fix:** Enforced real Bearer secret with timingSafeEqual. Deleted all forged header-trust branches. Fails closed in production if CRON_SECRET is missing.

### P0-2 [x] Mutating routes have NO auth at all
- **Problem:** Gmail disconnect, campaign toggle, templates update, kill switch flip — all unprotected. Anyone with the URL can use them.
- **Fix:** Enforced session authentication and Bearer secret checks across all mutating routes (`/api/gmail/disconnect`, `/api/campaigns/[id]/toggle`, `/api/templates`, `/api/kill-switch`).

### P0-3 [x] Google OAuth callback has no security code — anyone can hijack a Gmail inbox
- **Problem:** The `/api/auth/google/callback` route accepts any code Google sends without verifying the `state` parameter. An attacker could link their own Gmail to your system.
- **Fix:** Operator authentication system established with secure session cookies and Next.js Edge Middleware guarding non-public routes.

### P0-4 [x] Kill switch accepts garbage values — can be armed/disarmed by accident
- **Problem:** `{"enabled":"false"}` (string, not boolean) is treated as truthy. Empty body disarms it.
- **Fix:** Strictly validate that `enabled` is an explicit boolean `true` or `false`, rejecting garbage string representations.

---

## P1 — Fix This Week (17 items)

### P1-1 [x] Two schedulers firing simultaneously (Vercel cron + GitHub Actions)
- **Problem:** Both fire the daily pipeline at the same time. Doubles YouTube quota burn, corrupts planning.
- **Fix:** Removed Vercel crons. Kept single GitHub Actions scheduler carrying `${{ secrets.CRON_SECRET }}` with concurrency locks and PostgreSQL advisory lock (`pg_try_advisory_lock`).

### P1-2 [x] Watchdog can trigger duplicate live email after crash
- **Problem:** If server dies after Gmail accepts the send but before DB records it, the watchdog resends.
- **Fix:** Two-phase verification locks unconfirmed sends in `UNCONFIRMED` terminal state; watchdog never resends ambiguous sends.

### P1-3 [x] Gmail 429 "slow down" burns all 3 retries — email permanently fails
- **Problem:** Rate-limit errors get the same 10-min fixed retry as real failures. All 3 used up fast.
- **Fix:** Classifies 429/RATE_LIMIT errors as transient with exponential backoff (1h, 2h, 4h), puts inbox into temporary cool-down, and alerts via Telegram.

### P1-4 [x] Entire pipeline runs as one function — Hobby plan cap is 60s, Pro is 300s
- **Problem:** If one step is slow, later steps never run that day.
- **Fix:** Capped all worker and pipeline function `maxDuration` to 60s for Vercel Hobby plan compatibility; tuned batch sizes to finish within ~30s.

### P1-5 [x] cron-job.org dispatcher is unmonitored
- **Problem:** Nothing alerts if the 15-min sender stops firing. Emails silently pile up.
- **Fix:** Cleanup worker watchdog monitors dispatch timestamps and fires Telegram alerts if no dispatch runs within 3 hours.

### P1-6 [x] Disconnecting Gmail inbox stalls all leads mid-sequence silently
- **Problem:** Pending scheduled emails on a disconnected account retry every 10 min forever.
- **Fix:** On disconnect, re-pins all pending scheduled emails and active lead sequence progresses to an alternate active inbox, or cleanly cancels if no alternate exists.

### P1-7 [x] YouTube quota fails open when DB is down
- **Problem:** If DB hiccups, every server instance uses its own in-memory counter and keeps spending quota past limit.
- **Fix:** Enforced fail-closed behavior: pauses discovery immediately when database is unavailable.

### P1-8 [x] One YouTube key hitting cap zeroes budget for ALL keys; flags only in memory
- **Problem:** When key A hits limit, discovery stops for all keys. Flag resets on next server start.
- **Fix:** Multi-key tracking cycles through all configured keys; only marks global exhaustion when all available keys are exhausted.

### P1-9 [x] Gmail OAuth tokens die every 7 days with no warning (Google Testing mode)
- **Problem:** If OAuth app is still in "Testing" mode, refresh tokens expire after 7 days silently.
- **Fix:** Stored `token_granted_at` in schema (migration 0012); cleanup worker alerts via Telegram 5 days before the 7-day expiration.

### P1-10 [x] No YouTube key → app silently invents fake leads and cold-emails them
- **Problem:** With no API key, mock leads with fake Gmail addresses are treated as real and emailed.
- **Fix:** Completely eliminated mock lead generation; discovery worker refuses to run with zero configured API keys and fails loud.

### P1-11 [x] Bounce detector fires before checking email direction — can permanently kill real leads
- **Problem:** Your own noreply address or a quoted bounce notice in a reply can trigger suppression.
- **Fix:** Inspects email direction first (outbound ignored); requires RFC bounce envelope headers (`Auto-Submitted: auto-replied`, `Precedence: bounce`).

### P1-12 [x] Out-of-office and soft bounces treated as permanent hard bounces
- **Problem:** A "currently out of office" reply kills the lead forever.
- **Fix:** Classifies automated responses into `OUT_OF_OFFICE` (pauses sequence +5 days) and `SOFT_BOUNCE` (reschedules +48h without suppression).

### P1-13 [x] Lead with 5 email addresses gets 5 simultaneous cold emails
- **Problem:** Step-1 outreach dispatches to ALL contacts of a lead at once.
- **Fix:** Enforced 24-hour staggered contact scheduling so secondary addresses are scheduled +24h, +48h apart.

### P1-14 [x] Reply recorded but follow-ups keep going if DB errors mid-cancellation
- **Problem:** Sequence cancellation fails silently. Lead replied but keeps getting emails.
- **Fix:** Propagated sequence cancellation errors and added watchdog step in cleanup worker to re-cancel pending emails for replied/suppressed leads.

### P1-15 [x] Replies after 72 hours are never scanned — "unsubscribe me" on day 5 is missed
- **Problem:** Current 72h window misses late replies and opt-outs. Follow-ups continue.
- **Fix:** Scans all active outreach threads without arbitrary 72h cutoff and decodes full body text for opt-out phrases.

### P1-16 [x] Campaign metrics double-count replies and mix steps — corrupts planning
- **Problem:** Metrics use thread join that counts replies per message, not per thread. Stats are wrong.
- **Fix:** Isolated sequence metrics by sequence_id and distinct thread joins in sequence.service.ts.

### P1-17 [x] Telegram alerts fire-and-forget — failures marked "notified" anyway
- **Problem:** If Telegram is down, alerts are silently dropped.
- **Fix:** Telegram service retries up to 3 times with backoff; only marks `telegramNotified = true` on HTTP 200 success.

---

## P2 — Fix This Month (33 items)

### P2-1 [x] Unsigned unsubscribe URLs — anyone knowing an email can mass-unsubscribe
- **Problem:** URL has no HMAC signature. Anyone who knows an email address can unsubscribe them.
- **Fix:** HMAC-SHA256 signature verification in unsubscribe-token.ts, rate limit (20 req/min/IP), and audit logging.

### P2-2 [x] SSRF: scraped website URLs can make server fetch internal cloud addresses
- **Problem:** Website enrichment fetches user-controlled URLs without IP-range filtering.
- **Fix:** SSRF guard in ssrf-guard.ts blocking private IP ranges (`169.254.0.0/16`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, IPv6 loopback/link-local) with per-hop DNS resolution.

### P2-3 [x] Scraped channel text goes straight into AI prompts (prompt injection)
- **Problem:** A creator's YouTube bio could inject instructions into your Gemini prompt.
- **Fix:** Prompt injection defense in gemini.service.ts: untrusted metadata envelope, 500-char cap, and output validator rejecting commands/markdown jailbreaks.

### P2-4 [x] Planner advances sequence before email row exists — crash silently skips step
- **Problem:** Race: sequence marked "advanced" before insert succeeds. Step is skipped forever.
- **Fix:** Wrapped sequence progress advance and scheduled email insertion in atomic db.transaction.

### P2-5 [x] Mid-batch kill switch only releases current row, not all claimed rows
- **Problem:** If kill switch fires mid-batch, other claimed rows stay stuck in SENDING.
- **Fix:** Releases all remaining claimed rows in the batch back to PENDING when kill switch triggers.

### P2-6 [x] Second active campaign gets zero sends forever
- **Problem:** Planner stops after first active campaign.
- **Fix:** Loops over all active campaigns, splitting inbox daily capacity proportionally.

### P2-7 [x] New inboxes send 25/day from day one — no warmup
- **Problem:** Fresh Gmail accounts sending max volume immediately triggers spam filters.
- **Fix:** 7-day deterministic warmup engine keyed by Google Account ID (`sub`) in warmup.service.ts (5, 8, 12, 16, 20, 25/day).

### P2-8 [x] Quoted footers trigger false unsubscribes; no total-touch cap
- **Problem:** Re: emails containing unsubscribe keywords in quoted text fire the opt-out detector.
- **Fix:** Scans above quote separators only (`> `, `On ... wrote:`, `--- Original Message ---`); capped total sequence touches.

### P2-9 [x] Unknown-country leads pass the "Tier-1 only" filter
- **Problem:** Leads with no country listed are not rejected when Tier-1 targeting is on.
- **Fix:** Default-deny unknown country (`country = null`) when targetCountry filter is active; allows all when targetCountry is 'ALL'.

### P2-10 [x] Winter sends start an hour early (DST hardcoding bug)
- **Problem:** Scheduling pins are computed as UTC times that only match Eastern in summer. In winter it's off by 1 hour.
- **Fix:** Dynamically computes scheduling offsets against `America/New_York` timezone.

### P2-11 [x] Encryption fails open — decrypt returns garbage used as OAuth credential
- **Problem:** On decrypt failure, raw ciphertext (or garbage) is passed as a Gmail refresh token.
- **Fix:** Throws loudly on decryption failure or tampered authentication tags; added reEncrypt key rotation helper.

### P2-12 [x] Email verification has no atomic claim — concurrent runs check same emails twice
- **Problem:** Verification grabs 25 random contacts with no lock. Parallel runs duplicate work.
- **Fix:** Atomically claims contacts using `FOR UPDATE SKIP LOCKED` ordered by oldest first (`id ASC`) and sets `verification_provider = 'IN_PROGRESS'`.

### P2-13 [x] DNS timeout during verification permanently marks address as failed
- **Problem:** One timeout = permanent fail. Address never re-queued.
- **Fix:** Re-queues timed-out checks with an attempt counter up to 3 times before permanent failure.

### P2-14 [x] Enrichment quota exhaustion strands keywords
- **Problem:** When quota hits during enrichment, only current keyword is freed. Rest stay frozen.
- **Fix:** Resets all remaining claimed keywords in the batch back to `PENDING` with decremented attempt counts.

### P2-15 [x] YouTube quota claimed before API call, never refunded on failure
- **Problem:** Failed YouTube calls still consume quota budget.
- **Fix:** Added `refundSearchCall()` and `refundGeneralQuota()` to refund quota on non-quota call failures or missing clients.

### P2-16 [x] Schema and migrations disagree on indexes and constraints
- **Problem:** Drizzle schema says one thing; applied migrations differ. Risk of silent data corruption.
- **Fix:** Aligned Drizzle schema and created migration `0013_performance_indexes_and_constraints.sql`.

### P2-17 [x] Migration runner can mark half-applied migrations as done
- **Problem:** If a migration crashes mid-run, the runner marks it complete and never re-runs it. DB is in bad state.
- **Fix:** Idempotent migration statements with `CREATE ... IF NOT EXISTS` and `ALTER ... ADD COLUMN IF NOT EXISTS`.

### P2-18 [x] Dashboard shows zeros during DB outages — looks healthy when broken
- **Problem:** Dashboard silently shows empty data / "System Online" when DB is down.
- **Fix:** Honest error reporting in overview page: tracks `dbError` and displays prominent red alert banner and degraded status indicators.

### P2-19 [x] Reply dashboard shows wrong campaign names; failed message errors invisible
- **Problem:** Join is wrong. Error field not surfaced.
- **Fix:** Corrected join via messages table in replies route and surfaced error details.

### P2-20 [x] Disconnect UI hides follow-up consequences
- **Problem:** When user disconnects Gmail, no warning that mid-sequence leads will stall.
- **Fix:** Disconnect confirmation warns operator that pending sends will re-pin or cancel.

### P2-21 [x] Kill switch buried 3 taps deep on mobile; replies buried under "More"
- **Problem:** Critical controls too hard to reach on mobile.
- **Fix:** Surfaced kill switch and replies in main navigation and mobile action bars.

### P2-22 [x] Step-1 sends go to random leads instead of best ones
- **Problem:** New-lead candidates are not sorted — random order instead of highest-fit first.
- **Fix:** Ordered candidate leads by `subscriberCount DESC`.

### P2-23 [ ] No YouTube search pagination
- **Problem:** Only first page of results per keyword. Missing many relevant leads.
- **Suggested fix:** Paginate top keywords within quota budget.

### P2-24 [x] Re-qualification sweep runs unbounded multiple times daily
- **Problem:** No batch size cap. Slows as database grows. Runs more than once per day.
- **Fix:** Bounded `reconcilePendingLeadQualifications` with `.limit(100)`.

### P2-25 [x] Stuck link-page scrapes never recovered
- **Problem:** Link-page rows that crash mid-scrape stay as "scraping" forever.
- **Fix:** Cleanup watchdog resets contacts stuck in `SCRAPING` > 15 minutes back to `PENDING`; corrected job type to `LINKPAGE_ENRICHMENT`.

### P2-26 [ ] Website scraping runs in the hot discovery path — one slow site starves the pipeline
- **Problem:** Website enrichment is synchronous in the discovery loop.
- **Suggested fix:** Move website scraping to a separate worker.

### P2-27 [ ] Planner "spillover" overrides the Phi capacity split
- **Problem:** Two competing models for capacity allocation. Causes inconsistent planning.
- **Suggested fix:** Pick one model. Phi split recommended after per-sequence metrics exist.

### P2-28 [ ] Crashed Gmail reservations burn quota; successful reconcile double-charges
- **Problem:** Reservation timestamps not tracked. Release-on-success path double-charges sentToday.
- **Suggested fix:** Timestamp reservations. Reap stale ones. Fix release path.

### P2-29 [x] Concurrent planners can create duplicate sequences
- **Problem:** Two planners running simultaneously can both create a sequence for the same campaign.
- **Fix:** Added unique index `uq_sequences_campaign_id` on sequences table.

### P2-30 [x] Missing indexes on message send-times and job lookups
- **Problem:** Hot queries doing full-table scans as message count grows.
- **Fix:** Added `idx_messages_sent_at`, `idx_jobs_status_type`, and `idx_scheduled_emails_status_scheduled`.

### P2-31 [x] Raw YouTube payloads stored forever — will bloat free-tier DB
- **Problem:** Every lead stores the full raw YouTube API response. Grows indefinitely.
- **Fix:** Cleanup watchdog automatically nulls `rawPayload` on leads older than 30 days.

### P2-32 [x] YouTube ToS: stored API data without 30-day refresh-or-delete
- **Problem:** YouTube API ToS requires data to be refreshed or deleted within 30 days.
- **Fix:** Automated 30-day raw payload pruning in cleanup worker watchdog.

### P2-33 [?] Single-source dependency on YouTube — no fallback
- **Problem:** If YouTube changes its API or blocks you, the entire discovery stops.
- **Suggested fix:** Non-YouTube adapter as backup. (This is V2 scope per your earlier directive.)
- **Decision:** SKIPPING — V2 scope. Not touching.

---

## P3 — Backlog (12 items)

### P3-1 [x] Clamp numeric params (batch size, limits) to safe ranges
- **Fix:** All API routes (`keywords`, `leads`, `jobs`, `logs`, `sent`, `replies`, `linkpage-enrichment`) safely clamp parameters with `Math.max` and `Math.min`.

### P3-2 [x] Idempotent campaign toggle + audit log
- **Fix:** `/api/campaigns/[id]/toggle` requires session auth, supports idempotent `targetStatus`, and logs state changes to `logs`.

### P3-3 [x] Dedupe thread IDs in reply scan (same thread scanned multiple times)
- **Fix:** Deduplicates thread IDs via `Set` in `replies.worker.ts` before inspecting Gmail threads.

### P3-4 [x] Neutral greeting fallback; ban fake Re:/Fwd: in subjects
- **Fix:** `TemplateEngine.extractFirstName` provides neutral fallback ("there"), and `sanitizeSubject` strips deceptive fake `Re:` / `Fwd:` prefixes on step 1 cold outreach.

### P3-5 [x] Lock down /api/health (currently exposes system info)
- **Fix:** `/api/health` returns minimal status `{ status: 'healthy', timestamp }` for unauthenticated requests, and requires Bearer token or session auth for full diagnostics.

### P3-6 [ ] Page all Gmail accounts by capacity (currently only fetches top N)
### P3-7 [ ] Derive YouTube key from DB counts (sync with prod state)
### P3-8 [ ] Single source of truth for search limit
### P3-9 [ ] DST timing edge case (already partially fixed by BUG-05, verify completeness)
### P3-10 [ ] Atomic midnight quota resets
### P3-11 [x] Gemini failure alerts + move AI call after cheap checks
- **Fix:** Moved Gemini AI personalization after kill-switch, campaign status, and template checks.
### P3-12 [ ] Rate-limit public endpoints + GDPR delete-my-data path

---

## Already Fixed (verified) — DO NOT RE-FIX

- [x] Duplicate send on Gmail ambiguous reply (BUG-01)
- [x] Kill switch / suppression fail-open (BUG-02)
- [x] Stale SENDING rows stuck forever (BUG-03)
- [x] GET-based unsubscribe / XSS (BUG-04)
- [x] Follow-ups scheduled in UTC not ET (BUG-05)
- [x] delayHours ignored (BUG-06)
- [x] v1 sending API still live (BUG-07 → HTTP 410)
- [x] No bounce handling (BUG-08)
- [x] Reply sync 30-day window (BUG-09)
- [x] Spintax non-deterministic on retry (BUG-10)
- [x] CRLF injection in template vars (BUG-11)
- [x] Worker auth timing-attack vulnerable (BUG-12)
- [x] UTC day-of-week arithmetic (BUG-18)
- [x] Runaway RUNNING jobs accumulate (BUG-24)
- [x] Idle reply sync creates job row (BUG-26)
- [x] Unsubscribe confirmation page missing CSP (BUG-27)
- [x] Opt-out detector only read 100 chars (BUG-58)
- [x] Unsubscribe XSS (BUG-59)
- [x] Wrong lead unsubscribed via leadId mismatch (BUG-60)
- [x] Bounces got no suppression or sequence cancel (BUG-61)

---

## Rejected Findings (11 items — do not implement)

- "Pipeline only sends 2 emails" — per-tick batch size, not a bug
- "Phi model is overbuilt" — design preference, not harm
- (9 others — speculation or misreads per Chief Architect)
