# LeadMiner — Full Audit Findings (66 real problems)
# Source: 12-agent red team audit. Solutions are suggestions — not gospel.
# Status column: [ ] = open, [x] = already fixed, [?] = needs owner decision
# Last updated: 2026-09-23

---

## P0 — Fix Before Next Unattended Run (4 items)

### P0-1 [?] Worker auth accepts forged browser headers
- **Problem:** sec-fetch-site, user-agent, origin/referer headers can be faked by any HTTP client. Every "protected" worker route is effectively public.
- **Suggested fix:** Require only real Bearer secret. Delete the header-trust branches. Refuse to boot in prod with empty secret.
- **Decision needed:** If we remove same-origin trust, the UI dashboard buttons that call workers will stop working unless they send a Bearer token. Do you want the dashboard to send the Bearer token in its API calls, or handle UI actions differently?

### P0-2 [ ] Mutating routes have NO auth at all
- **Problem:** Gmail disconnect, campaign toggle, templates update, kill switch flip — all unprotected. Anyone with the URL can use them.
- **Suggested fix:** One shared Bearer-secret wrapper on every mutating route.

### P0-3 [?] Google OAuth callback has no security code — anyone can hijack a Gmail inbox
- **Problem:** The `/api/auth/google/callback` route accepts any code Google sends without verifying the `state` parameter. An attacker could link their own Gmail to your system.
- **Suggested fix:** Add signed single-use `state` param; require operator to be logged in before linking.
- **Decision needed:** Do you have a login system? Or is the dashboard completely open (no user accounts)?

### P0-4 [ ] Kill switch accepts garbage values — can be armed/disarmed by accident
- **Problem:** `{"enabled":"false"}` (string, not boolean) is treated as truthy. Empty body disarms it.
- **Suggested fix:** Strictly accept only `true`/`false` booleans, reject everything else.

---

## P1 — Fix This Week (17 items)

### P1-1 [?] Two schedulers firing simultaneously (Vercel cron + GitHub Actions)
- **Problem:** Both fire the daily pipeline at the same time. Doubles YouTube quota burn, corrupts planning.
- **Suggested fix:** Keep only GitHub Actions (can carry Bearer secret), delete Vercel cron.
- **Decision needed:** Do you have GitHub Actions set up? Or only Vercel cron?

### P1-2 [ ] Watchdog can trigger duplicate live email after crash
- **Problem:** If server dies after Gmail accepts the send but before DB records it, the watchdog resends.
- **Suggested fix:** Watchdog heals stale rows to terminal never-resend state, never requeues ambiguous rows.

### P1-3 [ ] Gmail 429 "slow down" burns all 3 retries — email permanently fails
- **Problem:** Rate-limit errors get the same 10-min fixed retry as real failures. All 3 used up fast.
- **Suggested fix:** Classify 429/5xx as transient. Exponential backoff. Alert via Telegram. Dead-letter queue.

### P1-4 [?] Entire pipeline runs as one function — Hobby plan cap is 60s, Pro is 300s
- **Problem:** If one step is slow, later steps never run that day.
- **Suggested fix:** Split steps into separate ≤60s routes.
- **Decision needed:** Are you on Vercel Hobby or Pro plan?

### P1-5 [ ] cron-job.org dispatcher is unmonitored
- **Problem:** Nothing alerts if the 15-min sender stops firing. Emails silently pile up.
- **Suggested fix:** Watchdog alerts if no dispatch ran in 3+ hours; Telegram daily digest as dead-man's switch.

### P1-6 [ ] Disconnecting Gmail inbox stalls all leads mid-sequence silently
- **Problem:** Pending scheduled emails on a disconnected account retry every 10 min forever.
- **Suggested fix:** On disconnect, re-pin pending rows to an active account OR cancel them with a clear reason.

### P1-7 [ ] YouTube quota fails open when DB is down
- **Problem:** If DB hiccups, every server instance uses its own in-memory counter and keeps spending quota past limit.
- **Suggested fix:** Fail closed: pause discovery on DB errors.

### P1-8 [ ] One YouTube key hitting cap zeroes budget for ALL keys; flags only in memory
- **Problem:** When key A hits limit, discovery stops for all keys. Flag resets on next server start.
- **Suggested fix:** Track per-key exhaustion in DB. Skip exhausted keys. Never zero aggregate budget.

### P1-9 [ ] Gmail OAuth tokens die every 7 days with no warning (Google Testing mode)
- **Problem:** If OAuth app is still in "Testing" mode, refresh tokens expire after 7 days silently.
- **Suggested fix:** Publish OAuth app to Production mode. Store token dates. Warn at day 5.
- **Decision needed:** Is your Google OAuth app in Testing or Production mode? Check at console.cloud.google.com.

### P1-10 [ ] No YouTube key → app silently invents fake leads and cold-emails them
- **Problem:** With no API key, mock leads with fake Gmail addresses are treated as real and emailed.
- **Suggested fix:** Refuse to run discovery with zero keys. Alert loudly.

### P1-11 [ ] Bounce detector fires before checking email direction — can permanently kill real leads
- **Problem:** Your own noreply address or a quoted bounce notice in a reply can trigger suppression.
- **Suggested fix:** Filter outbound emails first. Require real bounce envelope signals.

### P1-12 [ ] Out-of-office and soft bounces treated as permanent hard bounces
- **Problem:** A "currently out of office" reply kills the lead forever.
- **Suggested fix:** Distinguish OOO/auto-reply vs hard bounce. Pause sequence on OOO, retry soft bounces.

### P1-13 [?] Lead with 5 email addresses gets 5 simultaneous cold emails
- **Problem:** Step-1 outreach dispatches to ALL contacts of a lead at once.
- **Suggested fix:** Limit step-1 to primary contact only OR stagger contacts 24h apart.
- **Decision needed:** Which do you prefer — primary contact only, or stagger?

### P1-14 [ ] Reply recorded but follow-ups keep going if DB errors mid-cancellation
- **Problem:** Sequence cancellation fails silently. Lead replied but keeps getting emails.
- **Suggested fix:** Propagate cancellation errors. Watchdog re-cancels leads with replies but active sequences.

### P1-15 [?] Replies after 72 hours are never scanned — "unsubscribe me" on day 5 is missed
- **Problem:** Current 72h window misses late replies and opt-outs. Follow-ups continue.
- **Suggested fix:** Always scan for opt-out phrases in any thread with new activity, regardless of age.
- **Decision needed:** The 72h window was set deliberately to limit API cost. Do you want to extend it, or only scan for opt-out phrases in older threads?

### P1-16 [ ] Campaign metrics double-count replies and mix steps — corrupts planning
- **Problem:** Metrics use thread join that counts replies per message, not per thread. Stats are wrong.
- **Suggested fix:** Filter stats by sequence_id, count each reply once, count only confirmed sends.

### P1-17 [ ] Telegram alerts fire-and-forget — failures marked "notified" anyway
- **Problem:** If Telegram is down, alerts are silently dropped.
- **Suggested fix:** Only mark notified on success. Retry from cleanup sweep.

---

## P2 — Fix This Month (33 items)

### P2-1 [ ] Unsigned unsubscribe URLs — anyone knowing an email can mass-unsubscribe
- **Problem:** URL has no HMAC signature. Anyone who knows an email address can unsubscribe them.
- **Suggested fix:** Sign URLs with HMAC. Rate-limit the endpoint. Log all unsubscribes.

### P2-2 [ ] SSRF: scraped website URLs can make server fetch internal cloud addresses
- **Problem:** Website enrichment fetches user-controlled URLs without IP-range filtering.
- **Suggested fix:** Block private IP ranges (169.254.x.x, 10.x.x.x, etc.) after redirect resolution.

### P2-3 [ ] Scraped channel text goes straight into AI prompts (prompt injection)
- **Problem:** A creator's YouTube bio could inject instructions into your Gemini prompt.
- **Suggested fix:** Mark as untrusted. Cap length. Reject suspicious output.

### P2-4 [ ] Planner advances sequence before email row exists — crash silently skips step
- **Problem:** Race: sequence marked "advanced" before insert succeeds. Step is skipped forever.
- **Suggested fix:** Do both in one transaction.

### P2-5 [ ] Mid-batch kill switch only releases current row, not all claimed rows
- **Problem:** If kill switch fires mid-batch, other claimed rows stay stuck in SENDING.
- **Suggested fix:** Release all claimed rows when kill switch triggers. Age-gate job superseding.

### P2-6 [ ] Second active campaign gets zero sends forever
- **Problem:** Planner stops after first active campaign.
- **Suggested fix:** Loop over all active campaigns, split capacity.

### P2-7 [?] New inboxes send 25/day from day one — no warmup
- **Problem:** Fresh Gmail accounts sending max volume immediately triggers spam filters.
- **Suggested fix:** Ramp over ~14 days. Auto-pause on high bounce rates.
- **Decision needed:** Do you want automatic warmup, or do you manually warm up inboxes before connecting?

### P2-8 [ ] Quoted footers trigger false unsubscribes; no total-touch cap
- **Problem:** Re: emails containing unsubscribe keywords in quoted text fire the opt-out detector.
- **Suggested fix:** Scan above quote separators only. Cap total touches per lead (e.g. max 4 emails).

### P2-9 [?] Unknown-country leads pass the "Tier-1 only" filter
- **Problem:** Leads with no country listed are not rejected when Tier-1 targeting is on.
- **Suggested fix:** Default-deny unknown countries when Tier-1 filter is active.
- **Decision needed:** Should leads with no country data be rejected or queued for review?

### P2-10 [ ] Winter sends start an hour early (DST hardcoding bug)
- **Problem:** Scheduling pins are computed as UTC times that only match Eastern in summer. In winter it's off by 1 hour.
- **Suggested fix:** Always compute from `America/New_York` dynamically (BUG-05 fix applied to the right place).

### P2-11 [ ] Encryption fails open — decrypt returns garbage used as OAuth credential
- **Problem:** On decrypt failure, raw ciphertext (or garbage) is passed as a Gmail refresh token.
- **Suggested fix:** Throw loudly on decrypt failure. Never return garbage. Add re-encrypt path for key rotation.

### P2-12 [ ] Email verification has no atomic claim — concurrent runs check same emails twice
- **Problem:** Verification grabs 25 random contacts with no lock. Parallel runs duplicate work.
- **Suggested fix:** Claim contacts atomically. Order by oldest-first.

### P2-13 [ ] DNS timeout during verification permanently marks address as failed
- **Problem:** One timeout = permanent fail. Address never re-queued.
- **Suggested fix:** Re-queue timed-out checks with a counter. Only fail permanently after N timeouts.

### P2-14 [ ] Enrichment quota exhaustion strands keywords
- **Problem:** When quota hits during enrichment, only current keyword is freed. Rest stay frozen.
- **Suggested fix:** Reset the whole claimed batch on quota exhaustion.

### P2-15 [ ] YouTube quota claimed before API call, never refunded on failure
- **Problem:** Failed YouTube calls still consume quota budget.
- **Suggested fix:** Claim quota lazily (after success) or refund on failure.

### P2-16 [ ] Schema and migrations disagree on indexes and constraints
- **Problem:** Drizzle schema says one thing; applied migrations differ. Risk of silent data corruption.
- **Suggested fix:** Corrective migration to align them.

### P2-17 [ ] Migration runner can mark half-applied migrations as done
- **Problem:** If a migration crashes mid-run, the runner marks it complete and never re-runs it. DB is in bad state.
- **Suggested fix:** Make migration statements idempotent. Verify objects exist before marking done.

### P2-18 [ ] Dashboard shows zeros during DB outages — looks healthy when broken
- **Problem:** Dashboard silently shows empty data / "System Online" when DB is down.
- **Suggested fix:** Honest error envelopes. Real health indicators.

### P2-19 [ ] Reply dashboard shows wrong campaign names; failed message errors invisible
- **Problem:** Join is wrong. Error field not surfaced.
- **Suggested fix:** Fix the join. Surface errors. Add dead-letter view with requeue.

### P2-20 [ ] Disconnect UI hides follow-up consequences
- **Problem:** When user disconnects Gmail, no warning that mid-sequence leads will stall.
- **Suggested fix:** Show consequences in the disconnect modal. Add token-age banners.

### P2-21 [ ] Kill switch buried 3 taps deep on mobile; replies buried under "More"
- **Problem:** Critical controls too hard to reach on mobile.
- **Suggested fix:** Surface kill switch and replies in main nav.

### P2-22 [ ] Step-1 sends go to random leads instead of best ones
- **Problem:** New-lead candidates are not sorted — random order instead of highest-fit first.
- **Suggested fix:** Order candidates by subscriber count and fit score.

### P2-23 [ ] No YouTube search pagination
- **Problem:** Only first page of results per keyword. Missing many relevant leads.
- **Suggested fix:** Paginate top keywords within quota budget.

### P2-24 [ ] Re-qualification sweep runs unbounded multiple times daily
- **Problem:** No batch size cap. Slows as database grows. Runs more than once per day.
- **Suggested fix:** Cap batch. Run once daily.

### P2-25 [ ] Stuck link-page scrapes never recovered
- **Problem:** Link-page rows that crash mid-scrape stay as "scraping" forever.
- **Suggested fix:** Watchdog resets them like keywords are reset. Fix the job type name.

### P2-26 [ ] Website scraping runs in the hot discovery path — one slow site starves the pipeline
- **Problem:** Website enrichment is synchronous in the discovery loop.
- **Suggested fix:** Move website scraping to a separate worker.

### P2-27 [ ] Planner "spillover" overrides the Phi capacity split
- **Problem:** Two competing models for capacity allocation. Causes inconsistent planning.
- **Suggested fix:** Pick one model. Phi split recommended after per-sequence metrics exist.

### P2-28 [ ] Crashed Gmail reservations burn quota; successful reconcile double-charges
- **Problem:** Reservation timestamps not tracked. Release-on-success path double-charges sentToday.
- **Suggested fix:** Timestamp reservations. Reap stale ones. Fix release path.

### P2-29 [ ] Concurrent planners can create duplicate sequences
- **Problem:** Two planners running simultaneously can both create a sequence for the same campaign.
- **Suggested fix:** Unique index on campaign_id in sequences table. Graceful halt if already exists.

### P2-30 [ ] Missing indexes on message send-times and job lookups
- **Problem:** Hot queries doing full-table scans as message count grows.
- **Suggested fix:** Add indexes on messages.sentAt, jobs.status+jobType.

### P2-31 [ ] Raw YouTube payloads stored forever — will bloat free-tier DB
- **Problem:** Every lead stores the full raw YouTube API response. Grows indefinitely.
- **Suggested fix:** Prune raw payloads after extracting needed fields. Or store elsewhere.

### P2-32 [?] YouTube ToS: stored API data without 30-day refresh-or-delete
- **Problem:** YouTube API ToS requires data to be refreshed or deleted within 30 days.
- **Suggested fix:** 30-day refresh-or-delete job.
- **Decision needed:** Are you aware of this ToS requirement? Do you want automated deletion or refresh?

### P2-33 [?] Single-source dependency on YouTube — no fallback
- **Problem:** If YouTube changes its API or blocks you, the entire discovery stops.
- **Suggested fix:** Non-YouTube adapter as backup. (This is V2 scope per your earlier directive.)
- **Decision:** SKIPPING — V2 scope. Not touching.

---

## P3 — Backlog (12 items)

### P3-1 [ ] Clamp numeric params (batch size, limits) to safe ranges
### P3-2 [ ] Idempotent campaign toggle + audit log
### P3-3 [ ] Dedupe thread IDs in reply scan (same thread scanned multiple times)
### P3-4 [ ] Neutral greeting fallback; ban fake Re:/Fwd: in subjects
### P3-5 [ ] Lock down /api/health (currently exposes system info)
### P3-6 [ ] Page all Gmail accounts by capacity (currently only fetches top N)
### P3-7 [ ] Derive YouTube key from DB counts (sync with prod state)
### P3-8 [ ] Single source of truth for search limit
### P3-9 [ ] DST timing edge case (already partially fixed by BUG-05, verify completeness)
### P3-10 [ ] Atomic midnight quota resets
### P3-11 [ ] Gemini failure alerts + move AI call after cheap checks
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
