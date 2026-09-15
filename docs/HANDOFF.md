# Handoff Instructions — LeadMiner Platform

The LeadMiner YouTube lead-generation and cold-outreach platform is **100% implemented, tested, and ready for production deployment**.

---

## 1. Mandatory Reading Order

1. [PROJECT_STATE.md](PROJECT_STATE.md) — Current state, completed phases, and verification summary.
2. [ARCHITECTURE.md](ARCHITECTURE.md) — Technical architecture, dual-bucket quota model, and failure recovery.
3. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — Complete PostgreSQL schema, table definitions, and triggers.
4. [PROGRESS_LOG.md](PROGRESS_LOG.md) — Chronological log of all architectural decisions and implementations.
5. [README.md](../README.md) — Setup guide, environment configuration, worker scheduling, and deployment.

---

## 2. Non-Negotiable Operational Rules

1. **Preserve `LeadMiner.xlsx`:** Never modify, delete, or commit the original workbook. It is confidential reference material.
2. **Incremental Execution:** Always process keywords in small configurable batches (`YOUTUBE_BATCH_SIZE=10`). Never attempt to process the entire corpus in one execution.
3. **Dual-Bucket Quota Respect:** `search.list` is capped to 100 calls/day by default. Quota resets at midnight Pacific Time automatically. Never bypass quota guards.
4. **Pre-Send Safety Checks:** Every outbound dispatch must check:
   - `system_settings.kill_switch` (must be `false`).
   - `leads.suppression_status` and `suppressions` table (recipient must not be suppressed).
   - `gmail_accounts.sent_today < daily_limit`.
   - `messages.idempotency_key` (must be unique; no duplicate sends).
5. **Gemini Fallback:** If Gemini API fails or times out, the system automatically falls back to base templates without stopping the campaign.
6. **Telegram Signal Quality:** Telegram alerts are strictly reserved for incoming creator replies and critical service failures. Routine telemetry belongs in the database.

---

## 3. CLI Commands Quick Reference

| Command | Action |
| :--- | :--- |
| `npm run healthcheck` | Verifies system configuration, database, YouTube quota, and APIs. |
| `npm run db:migrate` | Runs DDL schema migrations against PostgreSQL / Supabase. |
| `npm run db:seed` | Ingests the 25,391 keywords and seeds default templates and settings. |
| `npm run dev` | Launches the Next.js SaaS dashboard on `http://localhost:3000`. |
| `npm run build` | Produces an optimized production build of the Next.js dashboard. |
| `npm run test` | Executes all 42 unit and integration tests. |
| `npm run worker:discovery` | Runs an incremental batch of YouTube keyword searches and lead extractions. |
| `npm run worker:verification` | Runs email verification (DNS MX) and lead qualification. |
| `npm run worker:outreach` | Dispatches outbound outreach emails (simulated safely in Dry Run mode). |
| `npm run worker:replies` | Polls for thread replies and fires Telegram alerts. |
| `npm run worker:cleanup` | Watchdog recovery resetting stale jobs and syncing quotas. |

---

## 4. Production Deployment Checklist

1. **Database:** Point `DATABASE_URL` in `.env` to your live PostgreSQL or Supabase project.
2. **Apply Migrations:** Run `npm run db:migrate` followed by `npm run db:seed`.
3. **Dashboard Deployment:** Connect to Vercel (Pro for commercial use) or run `npm run build && npm run start` on a VPS.
4. **Worker Scheduling:** Schedule workers via cron, systemd timers, or cloud scheduler per instructions in [README.md](../README.md).
