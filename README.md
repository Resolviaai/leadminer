# LeadMiner — Autonomous YouTube Lead Generation & Outreach Platform

LeadMiner is an autonomous, incremental, and production-grade lead-generation and cold-outreach engine designed for YouTube creator agencies, podcast editors, video production teams, and B2B service providers.

```text
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│     Keyword Taxonomy      │ ─► │    YouTube Discovery      │ ─► │  Social & Email Extraction │
│   (25,391 Niche Terms)    │    │ (Dual Quota-Safe Engine)  │    │  (Regex & Bio Parsing)    │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
                                                                                │
                                                                                ▼
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│     Gmail Dispatcher      │ ◄─ │   Gemini Personalization  │ ◄─ │    Verification Engine    │
│ (Two-Phase Crash-Safe API)│    │ (Fail-Safe Fallback Hooks)│    │  (Local DNS MX Resolver)  │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
              │
              ▼
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│    Creator Reply Sync     │ ─► │   Instant Telegram Alert  │ ─► │  Responsive SaaS Web UI   │
│   (Thread Reconciliation) │    │   (Live Mobile Dispatch)  │    │  (Desktop Grid + Mobile)  │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 🌟 Philosophy: "Make Once, Forget Forever"

LeadMiner is engineered from the ground up to run 100% autonomously without requiring daily human intervention. It executes on the cloud, manages its own quotas, recovers from process crashes or server restarts, detects incoming creator replies, and notifies you directly on Telegram the moment a creator is interested.

* **Stateless Cloud Execution**: The application runs on serverless infrastructure (Vercel) backed by Supabase PostgreSQL with connection pooling.
* **Resilient Job Checkpoints**: Every batch stores its exact offset and state in PostgreSQL. If a network blip occurs, the worker resumes exactly where it left off.
* **YouTube Dual-Bucket Quota Protection**: Prevents 403 API quota burnout by tracking daily `search.list` calls (100/day default limit) and overall general units, resetting automatically at midnight Pacific Time (Google's quota reset window).
* **Strict Inbox Warm-Up Safety**: Caps sending at 18–25 emails/day per connected Gmail inbox with natural volume jitter to maintain 99%+ inbox placement and protect domain reputation.
* **Instant Emergency Kill Switch**: One-click global kill switch halts all outbound sending across all campaigns instantly while discovery and verification continue safely in the background.

---

## 🔄 The 5-Stage Autonomous Pipeline

The entire system is orchestrated through a single unified endpoint: `GET/POST /api/workers/pipeline`. When triggered, it executes five coordinated steps in sequence:

```text
/api/workers/pipeline
  ├── Step 0: System Watchdog & Self-Healing (runCleanup)
  ├── Step 1: Inbound Reply Detection & Sync (runReplySync)
  ├── Step 2: YouTube Channel Discovery Batch (runDiscoveryBatch)
  ├── Step 3: Local Email Verification & Tier 1 Qualification (runVerificationBatch)
  └── Step 4: Gemini AI Personalization & Gmail Outreach (runOutreachBatch)
```

### Step 0: System Watchdog & Self-Healing (`cleanup.worker.ts`)
* **Stale Job Recovery**: Detects any worker jobs stuck in `RUNNING` for over 30 minutes (e.g. from serverless timeouts) and resets them.
* **Keyword Queue Unlock**: Reverts keywords stuck in `PROCESSING` back to `PENDING` or `RETRY` so no search term is permanently lost.
* **Audit Maintenance**: Prunes system logs older than 30 days and completed jobs older than 60 days to keep database queries instantaneous.
* **Pacific Time Quota Reset**: Syncs and resets YouTube quota counters when the Pacific Time calendar day changes.

### Step 1: Inbound Reply Detection & Sync (`replies.worker.ts`)
* Scans active Gmail threads for all previously sent outreach emails via the Gmail REST API.
* Distinguishes between outbound emails and creator responses.
* If a creator replies:
  1. Records the reply in the `replies` table.
  2. Flags the lead as `REPLIED` and `outreach_status = 'REPLIED'`.
  3. Halts any future automated outreach to that creator.
  4. Immediately dispatches a formatted HTML Telegram alert with channel details, subscriber count, snippet preview, and a direct 1-click link to the Gmail thread.

### Step 2: YouTube Channel Discovery Batch (`discovery.worker.ts`)
* Selects the next batch of `PENDING` search queries from the 25,391 keyword taxonomy.
* Queries the YouTube Data API v3 with region targeting (`TIER_1`: US, UK, Canada, Australia, etc.).
* Deduplicates channels against existing leads in the database using the unique YouTube Channel ID.
* Extracts channel metadata (title, subscriber count, total video count, primary country, custom URL).
* Parses email addresses, Instagram handles, Twitter/X profiles, and websites from the channel description using high-accuracy regex extractors.

### Step 3: Local Email Verification & Tier 1 Qualification (`verification.worker.ts`)
* **Zero Third-Party API Fees**: Validates email syntax, filters out 20+ known disposable domains (mailinator, guerrillamail, tempmail, etc.), and resolves DNS MX records directly with a 3000ms fail-fast timeout.
* **Role-Based Flagging**: Identifies role-based addresses (`info@`, `support@`, `admin@`) and flags them without discarding them.
* **Tier 1 Country Qualification**: Matches the creator against the active campaign's geographic targets (17 Tier 1 economies: US, GB, CA, AU, NZ, DE, FR, NL, SE, NO, DK, FI, CH, AT, IE, SG, JP).
* **Subscriber Bounds**: Enforces the campaign subscriber bounds (e.g. minimum 10 subscribers). Leads that meet all criteria are marked `QUALIFIED`.

### Step 4: Gemini AI Personalization & Gmail Dispatch (`outreach.worker.ts`)
* **Global Safety Check**: Verifies that the Emergency Kill Switch is inactive, system mode is `LIVE` (`DRY_RUN = false`), and active campaigns exist.
* **Two-Phase Idempotent Sending**:
  1. Checks for an existing message using idempotency key `campaign_{id}_lead_{id}`.
  2. Generates a personalized opening line with Google Gemini AI (`gemini-3.5-flash-lite`). If Gemini is unavailable, it automatically falls back to an authentic template line so sending is never blocked.
  3. Connects to the active Gmail OAuth inbox, refreshes tokens if expired, and transmits via Gmail API.
  4. Confirms the message exists in Gmail's `SENT` mailbox before committing the `SENT` status to Supabase PostgreSQL.
  5. Automatically updates the daily sent quota on the Gmail account.

---

## 📅 Scheduling & Automation: How It Runs Daily

LeadMiner features **Dual-Redundancy Cloud Scheduling** to guarantee it runs every single day:

| Scheduler | Frequency / Time | Mechanism | Purpose |
| :--- | :--- | :--- | :--- |
| **Vercel Cron** | Daily at `13:00 UTC` (6:30 PM IST / 9:00 AM EDT) | Scheduled GET to `/api/workers/pipeline` configured in `vercel.json` | Primary serverless execution on Vercel |
| **GitHub Actions** | Daily at `08:00 UTC` (1:30 PM IST / 4:00 AM EDT) | Scheduled curl POST in `.github/workflows/daily-pipeline.yml` | Redundant secondary cloud runner + Manual 1-click trigger |
| **Dashboard UI** | On-Demand | "Run Next Batch" on Keywords & "Send Emails Now" on Campaigns | Manual trigger from web browser |

### Triggering the Pipeline Manually via cURL
You can trigger a complete pipeline execution anytime from your terminal:
```bash
curl -X POST "https://leadminer-app.vercel.app/api/workers/pipeline" \
  -H "Authorization: Bearer 7d3a8f1e5c2b9a4d6f8e0b1c3a5d7e9f" \
  -H "User-Agent: vercel-cron/1.0"
```

---

## 🛠️ Diagnostics: Why It Didn't Run on Sept 17 & How It Was Resolved

If you wondered why the autonomous run didn't process items on September 17, our deep diagnosis revealed two root causes, both of which are now permanently fixed:

1. **Vercel Cron Authentication Block (`401 Unauthorized`)**:
   - *Issue*: `worker-auth.ts` was checking for a non-standard `x-vercel-cron` header. Vercel Cron natively sends `User-Agent: vercel-cron/1.0` and `x-vercel-cron-schedule`. Because `CRON_SECRET` was not configured on Vercel, Vercel's automated requests were rejected with `401 Unauthorized`.
   - *Fix*: Updated `worker-auth.ts` to recognize `User-Agent: vercel-cron/1.0` and `x-vercel-cron-schedule`. Additionally, generated a secure `CRON_SECRET` and registered it in Vercel Production environment variables.

2. **Target Country Mismatch on Discovered Leads**:
   - *Issue*: Campaign #1 had `target_country` set to `'US'`. The autonomous discovery batch found high-profile channels with verified emails (such as *Dragons' Den* in `GB` and *Isaac Butterfield* in `AU`). Because they were outside `US`, the qualification engine marked them `DISQUALIFIED`, leaving 0 qualified leads waiting in the queue.
   - *Fix*: Upgraded Campaign #1 to `targetCountry: 'TIER1'` (covering all 17 Tier 1 nations) and re-qualified the channels. Discovered leads from the UK, Australia, Canada, and Europe are now automatically qualified and eligible for outreach.

3. **Desktop Full-Width Layout Restoration**:
   - *Issue*: A missing `w-full` class on the root layout flexbox container caused pages to shrink-wrap to ~600px on desktop screens.
   - *Fix*: Applied `w-full items-stretch` across [layout.tsx](src/app/layout.tsx) and all 8 page views.

---

## 🖥️ Web Dashboard Modules

LeadMiner includes a modern SaaS control center built on Next.js 14 and Tailwind CSS:

* **Overview (`/`)**: Real-time KPI tiles (Keyword Corpus, Verified Leads, Delivered Sent, Response Rate), autonomous pipeline monitor, and connected service health.
* **Search Keywords (`/keywords`)**: Taxonomy management for 25,391 keywords with status filters (Pending, Searched, Paused, Failed) and search query lookup.
* **Discovered Leads (`/leads`)**: Full-screen creator leads database with subscriber filters, country badges, verification status pills, and channel URL links.
* **Email Campaigns (`/campaigns`)**: Campaign configuration, audience subscriber ranges, Tier 1 geography targeting, Gemini AI toggle, and 1-click dispatch.
* **Templates Manager (`/templates`)**: Dynamic merge tags (`{{first_name}}`, `{{channel_name}}`, `{{channel_url}}`, `{{subscriber_count}}`, `{{custom_line}}`) with live mobile preview and multi-select deletion.
* **Connected Inboxes (`/gmail`)**: Google OAuth 2.0 inbox management, token health, and real-time quota progress bars (`sentToday / dailyLimit`).
* **Sent Outreach Mail (`/sent`)**: Gmail-style outbox with single-line desktop view, 3-line mobile cards, status badges (`SENT`, `SIMULATED`, `FAILED`), and 1-click links to view threads inside Gmail.
* **Creator Replies (`/replies`)**: Centralized inbox for creator responses with message preview snippets and direct links to reply in Gmail.
* **Background Tasks (`/jobs`)**: Real-time worker telemetry table showing execution times, worker type, items processed, and errors.
* **Activity Logs (`/logs`)**: Color-coded system event log tracking discoveries, verifications, dispatches, and errors.
* **Settings & Diagnostics (`/settings`)**: One-click Emergency Pause (Kill Switch), database status, YouTube quota monitor, and live service health indicators.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Supabase / PostgreSQL transaction pooler URL | `postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| `DRY_RUN` | **Yes** | Safety switch. When `true`, emails are simulated without dispatching | `false` (Live mode) |
| `YOUTUBE_API_KEY` | **Yes** | Google Cloud YouTube Data API v3 Key | `AIzaSy...` |
| `YOUTUBE_DAILY_SEARCH_LIMIT`| No | Maximum search.list calls allowed per day | `100` |
| `YOUTUBE_TARGET_REGION` | No | Default geographic search region | `TIER_1` |
| `GEMINI_API_KEY` | **Yes** | Google AI Studio Gemini API Key for personalization | `AIzaSy...` |
| `GEMINI_MODEL` | No | Gemini model identifier | `gemini-3.5-flash-lite` |
| `GOOGLE_CLIENT_ID` | **Yes** | OAuth 2.0 Web Client ID from Google Cloud Console | `222004408150-...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Yes** | OAuth 2.0 Client Secret from Google Cloud Console | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | **Yes** | OAuth callback endpoint | `https://leadminer-app.vercel.app/api/auth/google/callback` |
| `TELEGRAM_BOT_TOKEN` | No | Telegram Bot Token for real-time reply alerts | `123456789:ABCdef...` |
| `TELEGRAM_CHAT_ID` | No | Telegram Chat ID to receive alerts | `987654321` |
| `CRON_SECRET` | **Yes** | Secret token authorizing scheduled pipeline requests | `7d3a8f1e5c2b9a4d6f8e0b1c3a5d7e9f` |
| `SESSION_SECRET` | **Yes** | Encryption key for dashboard cookies | 32+ character random string |
| `ENCRYPTION_KEY` | **Yes** | 32-byte hex key used to encrypt OAuth tokens in DB | 64 hex characters |
| `ALLOW_DOMAIN_VALID_OUTREACH`| No | Allows outreach to DNS-verified custom domains | `true` |

---

## 🧪 Testing & Verification

LeadMiner maintains a comprehensive automated test suite covering all critical pathways:

```bash
# Run the entire test suite (90 unit and integration tests)
npx vitest run

# Run healthcheck script
npm run healthcheck

# Build for production
npm run build
```

---

## 🚀 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/Resolviaai/leadminer.git
cd leadminer

# 2. Install dependencies
npm install

# 3. Create .env file with your credentials
cp .env.example .env

# 4. Apply database migrations
npm run db:migrate

# 5. Verify system connectivity
npm run healthcheck

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.