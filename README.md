# LeadMiner — YouTube Lead Generation & Outreach Platform

An autonomous, incremental, and highly resilient lead-generation and cold-outreach system for YouTube creators and video production agencies.

```text
Keyword Taxonomy → YouTube API Discovery → Lead Extraction → Contact Discovery → Email Verification → Qualification → Campaign → Personalization → Gmail Sending → Reply Detection → Telegram Alerts → SaaS Dashboard
```

---

## Architecture & Guiding Philosophy

> **Build it once and forget it.**

* **Incremental Batching:** Processes the 25,391 keyword corpus in small configurable batches (`KEYWORD_BATCH_SIZE=10`).
* **Stateful Database, Stateless Process:** Never relies on in-memory state. Survives process crashes, server restarts, network timeouts, and quota caps without losing progress.
* **Dual-Bucket YouTube Quota:** Respects YouTube's dedicated `search.list` bucket (100 calls/day by default) and general unit quota (10,000 units/day) with automatic midnight Pacific Time calculation.
* **Pre-Send Safety & Emergency Kill Switch:** Every outbound message undergoes pre-send suppression checks, daily account limits, idempotency guards, and an instant global Kill Switch check.
* **Modular Provider Layer:** Replaceable verifiers (Local DNS MX, Hunter, ZeroBounce), Gemini AI personalization with automated fallback, and multi-inbox Gmail OAuth sending.
* **High-Signal Telegram Alerts:** Reserved exclusively for incoming creator replies and critical system failures.

---

## Tech Stack

* **Runtime:** Node.js 20+ (LTS), TypeScript.
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Lucide React (anti-AI design, Jensen Huang high-density grid).
* **Database & ORM:** PostgreSQL / Supabase, Drizzle ORM (`pg`).
* **External APIs:** Official YouTube Data API v3, Gmail REST API v1, Google Gemini AI (`@google/generative-ai`), Telegram Bot API.

---

## Project Structure

```text
├── LeadMiner.xlsx           # Confidential legacy taxonomy (read-only reference)
├── migrations/
│   └── 0000_init_schema.sql # Core PostgreSQL DDL schema & triggers
├── src/
│   ├── app/                 # Next.js SaaS dashboard & API routes
│   │   ├── api/             # API routes (/health, /kill-switch, /workers)
│   │   ├── keywords/        # Keyword queue management page
│   │   ├── leads/           # Discovered leads & verification page
│   │   ├── campaigns/       # Outreach campaigns page
│   │   ├── templates/       # Template variable editor & preview page
│   │   ├── gmail/           # Connected Gmail inboxes page
│   │   ├── replies/         # Inbound replies inbox page
│   │   ├── jobs/            # Worker execution telemetry page
│   │   ├── logs/            # Audit event stream page
│   │   └── settings/        # Kill switch & health diagnostics page
│   ├── config/              # Type-safe environment variables (Zod)
│   ├── db/                  # Drizzle ORM schema & client connection pool
│   ├── services/
│   │   ├── youtube/         # YouTube Discovery Service & Dual Quota Manager
│   │   ├── extraction/      # Email & Social handle regex parsers
│   │   ├── verification/    # Multi-stage DNS/MX & provider email verifier
│   │   ├── qualification/   # Configurable lead qualification rules engine
│   │   ├── ai/              # Gemini AI personalized hook generator with fallback
│   │   ├── outreach/        # Template engine & Gmail multi-inbox sender
│   │   ├── replies/         # Thread matching & reply detector
│   │   ├── notifications/   # High-signal Telegram Bot dispatcher
│   │   └── jobs/            # Job lifecycle, heartbeats & crash recovery
│   ├── workers/             # Schedulable batch worker scripts
│   │   ├── discovery.worker.ts
│   │   ├── verification.worker.ts
│   │   ├── outreach.worker.ts
│   │   ├── replies.worker.ts
│   │   └── cleanup.worker.ts
│   └── scripts/             # CLI utilities (migrate, seed, healthcheck)
├── tests/                   # Vitest unit & integration test suites
└── docs/                    # Complete architectural & database documentation
```

---

## Quick Start & Setup

### 1. Prerequisites
* Node.js 20+ installed (`node -v`)
* PostgreSQL or Supabase database instance

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Key environment settings:
* `DATABASE_URL`: PostgreSQL / Supabase connection string.
* `YOUTUBE_API_KEY`: Google Cloud API Key with YouTube Data API v3 enabled.
* `GEMINI_API_KEY`: Google AI Studio Gemini API Key.
* `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Web Application credentials.
* `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`: Telegram bot credentials for reply notifications.
* `DRY_RUN=true`: When true, emails are simulated safely in logs without real dispatch.

### 4. Run Database Migrations
Create tables, enums, indexes, and triggers:
```bash
npm run db:migrate
```

### 5. Ingest Taxonomy & Seed Defaults
Populate default settings, templates, and the 25,391 normalized keywords from `LeadMiner.xlsx`:
```bash
npm run db:seed
```

### 6. Run System Healthcheck
Verify connectivity and credential status:
```bash
npm run healthcheck
```

### 7. Start Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the SaaS dashboard.

---

## Worker Execution & Scheduling

The platform does **not** require a 24/7 background process. Workers can be invoked independently via cron, task schedulers, or CLI:

| Command | Role | Behavior |
| :--- | :--- | :--- |
| `npm run worker:discovery` | YouTube Channel Discovery | Claims 10 keywords, queries YouTube, deduplicates leads, extracts emails. |
| `npm run worker:verification` | Email Verification | Runs DNS MX checks, verifies emails, qualifies leads against criteria. |
| `npm run worker:outreach` | Outreach Dispatcher | Renders templates, generates Gemini hook (fallback-safe), dispatches emails. |
| `npm run worker:replies` | Inbound Reply Detector | Scans threads for replies, marks leads `REPLIED`, fires Telegram alerts. |
| `npm run worker:cleanup` | Watchdog Recovery | Resets stale `PROCESSING` keywords (>30m) to `RETRY` and closes abandoned jobs. |

### Sample Crontab (e.g. on Linux VPS or Cloud Scheduler)
```bash
# Discovery runs every hour during business hours
0 9-18 * * * cd /app && npm run worker:discovery >> /var/log/discovery.log 2>&1

# Verification runs every 30 minutes
*/30 * * * * cd /app && npm run worker:verification >> /var/log/verification.log 2>&1

# Outreach runs every 2 hours
0 10,12,14,16 * * 1-5 cd /app && npm run worker:outreach >> /var/log/outreach.log 2>&1

# Reply detection runs every 15 minutes
*/15 * * * * cd /app && npm run worker:replies >> /var/log/replies.log 2>&1

# Cleanup watchdog runs once daily
0 2 * * * cd /app && npm run worker:cleanup >> /var/log/cleanup.log 2>&1
```

---

## Testing

Run all 33 unit and integration tests:
```bash
npm run test
```

---

## Production Deployment

### 1. Web Dashboard (Vercel / Next.js)
* Connect repository to Vercel (or any Node.js container host).
* Add all environment variables from `.env`.
* Deploy the Next.js App Router dashboard. Note: Vercel Hobby is for personal/non-commercial use; use Vercel Pro or Docker for commercial production.

### 2. Workers (VPS / Docker / GitHub Actions / Cron)
* Run the worker commands on a lightweight VPS (Hetzner, DigitalOcean) or scheduled serverless jobs.
* Workers connect to the same PostgreSQL / Supabase database.

---

## License & Legacy Asset Notice
`LeadMiner.xlsx` is proprietary confidential evidence preserved unchanged. All application code is provided under the MIT License.
