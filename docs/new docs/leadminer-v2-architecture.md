# LeadMiner v2 — System Architecture (draft)
Companion to `leadminer-v2-fundamentals-brief.md`. This is the buildable shape of the system; the brief is the rules it must obey.

## Assumptions (from current stack — correct me if v1 differs)
TypeScript/Node.js, Supabase (Postgres), Redis available, n8n in the toolbox. If v1 is Python, the component boundaries below still hold — only the language changes.
**Hard constraints from owner:** fully autonomous; dashboard accessible via link from mobile/any device (like v1); **zero VPS, zero self-hosting, 100% free tiers — not a single penny spent.**

## Deployment (free-tier only — no VPS, no self-hosting)
- **Dashboard (link-accessible, mobile-friendly):** Next.js on Vercel free tier (or Render free web service — same pattern as v1). Always reachable via link; responsive UI for phone.
- **Database:** Supabase free tier (Postgres + Auth).
- **Redis/queues:** Upstash free tier (serverless Redis) — managed, no self-hosting.
- **Autonomous runs:** free tiers don't allow always-on workers, so the pipeline runs as **scheduled jobs**, not a 24/7 server:
  - pg_cron inside Supabase (free) or GitHub Actions scheduled workflows (free) trigger each campaign on its cadence.
  - Each run: wake → claim due jobs → work through the queues → sleep. Same autonomy, zero idle cost.
  - Queues/state live in Postgres + Upstash, so nothing is lost between runs.
- **LLM (campaign generator):** free tier (e.g. Google AI Studio) — runs rarely (campaign setup only).
- **Cold starts:** first dashboard load after idle may take ~30–60s on free tiers; acceptable trade for ₹0.

## Big picture

```
                        ┌─────────────────────┐
                        │  Control UI (Next.js)│  campaign CRUD, approval gate, dashboards
                        └─────────┬───────────┘
                                  ▼
┌──────────────┐        ┌─────────────────────┐
│   Campaign   │───────▶│   API / Control     │──▶ Scheduler (cron-like, per-campaign)
│  Generator   │ approve│   plane             │         │
└──────────────┘        └─────────────────────┘         ▼
                                                        ┌──────────────────────────────┐
                                                        │  Queue layer (BullMQ/Redis)  │
                                                        │  one queue per stage         │
                                                        └──────────────┬───────────────┘
                                                                       ▼
                    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
                    │ Discover │──▶│ Extract  │──▶│ Normalize│──▶│  Enrich  │──▶│  Dedupe  │──▶ Score ──▶ Outreach queue
                    └────┬─────┘   └──────────┘   └──────────┘   └────┬─────┘   └──────────┘
                         │                                          │
                    Source adapters                            Enrichment chain
                    (YouTube, IG, TikTok…)                    engine (graph hops)
                         ▲
                    ┌────┴─────────┐
                    │Account Manager│  pool, quotas, rotation, health, cooldowns
                    └──────────────┘
                              │
                    ┌───────────┴────────────┐
                    │  Postgres (truth)      │  campaigns, leads, accounts, events, jobs
                    │  Redis (hot state)     │  queues, quota counters, locks, Bloom
                    └────────────────────────┘
```

## Components

### 1. Control plane (UI + API)
Next.js app. Campaign list/create, the **approval gate** (generated campaign shown as a diffable draft — ICP, queries per source, extractor config, outreach drafts — Approve/Edit/Reject), lead browser, per-source yield dashboards, alert inbox. Auth: OAuth/JWT, CSRF tokens, HttpOnly SameSite cookies (brief C9.6).

### 2. Campaign generator
Input: website URL or business description. An LLM with a **strict JSON schema** produces: ideal customer profile, per-source search queries/keywords, extraction priorities, enrichment hops to attempt, outreach message drafts. Output is validated against the schema before it ever touches the pipeline; a human approves before anything runs (brief C10.1, C10.4).

### 3. Scheduler
Cron-like per campaign (e.g. "YouTube discovery every 6h, Instagram enrichment hourly"). Missed runs catch up; overlapping runs are impossible — a run claims a slot atomically (brief C2.6, C7.1).

### 4. Queue layer (BullMQ on Redis)
One queue per pipeline stage: `discover → extract → normalize → enrich → dedupe → score`. Priorities (enrichment of high-intent leads first), delayed retries with exponential backoff + jitter, dead-letter queue for poison jobs (brief C2.1, C3.2, C3.5).

### 5. Workers (stateless, horizontally scalable)
Each stage is a worker pool with **zero local state** — any worker can die and another picks up. Concurrency per worker is capped (memory/CPU limits, brief C7.4). Scale = add workers, no code change.

### 6. Source adapters (the plugin system)
One TypeScript interface, N implementations:
```ts
interface SourceAdapter {
  sourceId: string;
  search(query: string, page?: PageToken): Promise<RawItem[]>;
  extract(item: RawItem): Promise<PartialLead>;
  rateLimit(): RatePolicy;          // requests/min per account, per IP
  canary(): Promise<HealthCheck>;   // layout-change detection
}
```
v1's YouTube scraper becomes the **reference adapter**. New source = one new file implementing this interface; core never changes (brief C2.2, C6).

### 7. Enrichment chain engine
Hops modeled as a **graph**: `youtube_video --description--> instagram_profile --bio--> email`. Each hop is a small declared step (source adapter + link extractor + target adapter). Every discovered value carries **provenance** (which hop, which campaign run, when). Merged into one lead record; conflicts resolved by recency + source trust order (brief C3.3, C6.5).

### 8. Account manager
Pool of accounts (10 today, size is a config number). Per account: daily action quota (Redis counter, resets at midnight), rotation across jobs, health score (warnings → cooldown → quarantine), warmup schedule for new accounts. Jobs **atomically claim** an account (SET NX); no two workers share one (brief B.6, C2.6, C9.3).

### 9. Outreach email sender (in scope)
Takes scored leads from the `outreach_queue` and sends emails autonomously on schedule. Free-tier provider (Resend free tier ~100/day, or Gmail API within its limits). Per-day caps, idempotent send log (never email the same lead twice), unsubscribe handling, bounce/reply tracking written back to the lead record. Runs as a scheduled job like everything else — no laptop required.

### 10. Data layer
**Postgres (source of truth):**
- `campaigns` — config, schedule, status, approved_by/at
- `sources` — adapter id, rate policy, health
- `accounts` — pool membership, quotas, health, cooldown_until
- `leads` — normalized fields; **UNIQUE on canonical email/phone/url** (brief C4.4)
- `lead_identities` — raw per-source payloads (JSONB, never deleted — brief C4.6)
- `enrichment_events` — every hop with provenance
- `outreach_queue` — scored leads, ordered by score desc
- `jobs` — scheduler runs, claims, retries

**Redis (hot state):** BullMQ queues, per-account quota counters (TTL), distributed locks/claims, dedupe Bloom filter, rate-limit buckets.

### 11. Monitoring & alerting
Structured logs (timestamp, campaign, source, account, stage, outcome). Metrics: discovery yield, extraction success %, enrichment yield **per hop**, dedupe rate, queue depth per stage. Alerts: canary failure → pause source; zero yield 48h → page owner; quota exhaustion; dead-letter growth (brief C7.2, C7.3, C11.2).

## Walkthrough: a lead's life
1. Scheduler fires "video-editing campaign / YouTube discovery".
2. Worker claims an account, runs `YouTubeAdapter.search("real estate agent vlog")`.
3. `extract` pulls channel title, subs, description links → `normalize` → `dedupe` (new lead).
4. Chain engine: description has instagram.com/x → `InstagramAdapter` scrapes bio → finds email → `enrichment_events` records both hops with provenance.
5. Scorer rates fit 0–100 (niche keywords, business signals) → lands in `outreach_queue` sorted by score.
6. Repeat forever. Owner only returns to tweak the campaign or switch the service (video editing → consulting).

## Scaling path (10 accounts → 100)
- Workers: more scheduled runs / larger job batches, same Postgres + Upstash. No redesign (stateless, brief C2.3).
- DB: read replicas for dashboards; partition `enrichment_events` by month when large.
- Queues: split hot queues by source if one stage saturates.
- Accounts: raise the config number; quotas and rotation already per-account.
- **Free-tier ceiling:** if volume ever outgrows free tiers, the architecture already isolates the cost centers (bigger Redis, bigger DB) — paying later is a config change, not a rewrite.

## Failure handling (from the brief, made concrete)
| Failure | Handling |
|---|---|
| Worker crash mid-job | Job lease expires → returns to queue → another worker picks up; idempotent writes prevent dupes |
| Source layout change | Canary fails → adapter paused + alert; other sources keep running |
| 429 / IP flagged | Backoff + jitter; proxy rotation; account cooldown |
| Duplicate lead | DB unique constraint rejects; logged, not crashed |
| LLM generates bad campaign | Schema validation rejects; human approval gate stops it anyway |

## Build order (matches brief Part D)
1. Postgres schema + Redis + queue skeleton
2. Scheduler + one worker stage (discover→extract for YouTube, porting v1)
3. Remaining stages (normalize → enrich → dedupe → score)
4. Enrichment chain engine (YouTube→Instagram→email first)
5. Account manager
6. Campaign generator + approval UI
7. Monitoring/alerts (alongside, not after)

## Open questions for Rohit
1. v1's language/stack — TypeScript/Node or Python? (Boundaries above survive either way.)
2. ~~Outreach sender: still out of scope for v2, or should the queue feed Sequence v2 directly?~~ Answered: email sending is in scope for v2 (autonomous flow includes it).
3. ~~Where does this run — your laptop, a VPS, or cloud?~~ Answered: free-tier cloud, link-accessible dashboard (see Deployment).
4. Which source after YouTube + Instagram — TikTok, Google Maps, or directories?
