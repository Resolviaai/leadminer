# LeadMiner — Comprehensive Implementation Audit & Hardening Analysis

**Audit Date:** 2026-09-15  
**Codebase:** https://github.com/Resolviaai/leadminer  
**Audit Standard:** Strict "Build Once, Test Properly, Forget It" Production Reliability  

---

## 1. Executive Summary & Audit Findings

An exhaustive, line-by-line inspection of the LeadMiner codebase was conducted across all database schemas, backend workers, integration services, API routes, and unit tests.

The architecture possesses strong scaffolding (Next.js 14, Drizzle ORM, Supabase PostgreSQL, dual-bucket YouTube quota management, and rich UI components), but contains **critical operational flaws and stubs** that would prevent reliable autonomous execution in production.

---

## 2. Component-by-Component Classification

### 🟢 Implemented & Functioning
* **YouTube Dual-Bucket Quota Manager (`src/services/youtube/quota.ts`):** Correctly tracks search calls (`100/day`) and general unit quota (`10,000/day`) with Pacific Time reset boundaries and database state synchronization.
* **Template Rendering Engine (`src/services/outreach/template.engine.ts`):** Robust variable substitution (`{{first_name}}`, `{{channel_name}}`, `{{custom_line}}`), capitalization heuristics, and live preview rendering.
* **Emergency Kill Switch (`src/services/outreach/gmail.service.ts` & `src/app/api/kill-switch`):** Real-time database check pauses outreach dispatch instantly when tripped.
* **Suppression List Guard (`src/services/outreach/gmail.service.ts`):** Blocks email transmission if recipient is present on the unsubscribed/suppression registry.
* **PWA & UI Design System:** Lucide SVGs, Jensen Huang grid hierarchy, anti-AI palette, and live system status bar.

---

### 🟡 Partially Implemented
* **YouTube Discovery Pipeline (`src/services/youtube/discovery.service.ts`):** Executes `search.list` followed by `channels.list`, but does not deduplicate IDs in memory and does not check the database before calling `channels.list`, wasting YouTube API quota on known channels.
* **Social & Link Extraction (`src/services/extraction/social.extractor.ts`):** Detects standard Instagram, Twitter, and TikTok usernames, but fails to categorize creator hub pages (`linktr.ee`, `beacons.ai`, `stan.store`) and leaves `otherSocial` unpopulated.
* **Gemini AI Personalization (`src/services/outreach/gemini.service.ts`):** Generates intro lines with fallback to base template on error, but lacks strict output validation (e.g. stripping quotation marks, length limits, hallucination guards).
* **Telegram Notification Service (`src/services/notifications/telegram.service.ts`):** Has HTML formatting and alert structure, but is not defensively decoupled (failures can affect caller) and fails unit tests without mock token.

---

### 🔴 Missing / Stubs
* **Reply Detection Worker (`src/workers/replies.worker.ts`):** **Critical stub.** Queries 20 sent messages, logs that it is monitoring them, sets `let detected = 0`, and completes. It never connects to Gmail or queries thread messages.
* **Lead Provenance Multi-Keyword Association (`lead_keyword_sources`):** Channels appearing across multiple search terms overwrite or discard discovery history; no secondary relationship table exists.
* **Keyword Performance Feedback Loop:** Keywords record `channelsFound`, but lack metrics for `new_channels_found`, `qualified_leads_found`, `emails_found`, `verified_emails`, `last_run_at`, or dynamic priority scoring for queue ordering.
* **Multi-Contact Storage:** The database schema restricts leads to a 1:1 relation with `contacts` (`uq_contacts_lead_id`), and discovery discards all emails after `extractedEmails[0]`.

---

### ⚠️ Incorrect / Risky
* **Gmail Sending Fake Fallback (`src/services/outreach/gmail.service.ts` L125):** 
  ```typescript
  if (env.DRY_RUN || !account)
  ```
  If `DRY_RUN=false` and no active Gmail account is found, the system simulates sending and marks the database message as `SENT` with mock IDs. **This falsely reports delivery in production.**
* **Email Verification Deliverability Assumption (`src/services/verification/local.verifier.ts`):** Labels Gmail/Yahoo/Outlook domains as `VALID` based strictly on domain name without testing mailbox deliverability. Must be explicitly classified as `DOMAIN_VALID`.
* **Insecure Production Secret Defaults (`src/config/env.ts`):** Provides hardcoded fallback strings for `SESSION_SECRET` and `ENCRYPTION_KEY`. In production (`NODE_ENV=production`), the application must fail fast instead of running with known keys.
* **Database Concurrency & Pre-Send Race Conditions:** Outreach worker lacks atomic row locking (`FOR UPDATE SKIP LOCKED`) during lead claim and account assignment, allowing concurrent workers to potentially double-contact leads.
* **Hardcoded Qualification Thresholds:** Qualification worker hardcodes `subscriberCount >= 1000`, bypassing campaign-specific audience filter settings.

---

### ⚪ Unnecessary / Overengineered
* **Premature Automatic Keyword AI Generation:** Keyword generation should remain grounded in the deterministic taxonomy rather than speculative LLM expansion before core pipeline reliability is proven.
* **Mock Inbox Preview in Template Manager:** Displayed misleading static dummy rows in the live preview (already removed in recent commit).

---

## 3. Detailed Audit of the 11 Identified Gaps

| # | Identified Gap | Current Status | Required Production Fix |
| :--- | :--- | :--- | :--- |
| **1** | Current-batch dedup before `channels.list` | Missing | Deduplicate `channelIds` from `search.list` in memory using `Set<string>` before any downstream calls. |
| **2** | Skipping already-known channels | Incorrect | Query PostgreSQL batch `SELECT channel_id FROM leads WHERE channel_id IN (...)`. Discard known channels from `channels.list` enrichment queue. |
| **3** | Discovery Quality Filters missing | Missing | Apply `MIN_DISCOVERY_SUBSCRIBERS` (10) and `MIN_DISCOVERY_VIDEOS` (10) before contact extraction. Keep campaign qualification separate. |
| **4** | Only 1st email stored; multiple discarded | Incorrect schema & worker | Redesign `contacts` table to 1:N supporting multiple contact records per lead with `contact_type` enum. Store all unique emails. |
| **5** | Linktree / Beacons / Social link extraction | Incomplete | Detect Linktree, Beacons, personal sites, and normalize URLs while filtering out navigation links. |
| **6** | Reply detection is a stub | Stub (`detected = 0`) | Connect to Gmail API via OAuth, fetch sent thread messages, detect inbound replies, update lead to `REPLIED`, alert Telegram. |
| **7** | Gmail sending fake fallback | Risky / Dangerous | Remove `!account` fallback. If `DRY_RUN=false` and no account is available, abort send, log error, leave in retry state. |
| **8** | Gmail daily counters not day-aware | Risky | Calculate daily quota from `messages` table sent timestamps for current UTC day or deterministic date bucket. |
| **9** | Insecure production environment defaults | Insecure | Enforce strict Zod validation in production: abort startup if `SESSION_SECRET`, `ENCRYPTION_KEY`, or `DATABASE_URL` are missing or default. |
| **10** | Misleading email verification status | Misleading | Distinguish `DOMAIN_VALID`, `MAILBOX_VERIFIED`, `INVALID`, `DISPOSABLE`, `UNKNOWN`, `FAILED`. |
| **11** | Keyword yield feedback loop missing | Missing | Add yield metrics and priority scoring (`priority_score`) to `keywords` table. Process high-yield keywords first. |

---

## 4. Hardening Roadmap

1. **Database Schema Evolution:** Safe non-destructive migrations for `contacts` (1:N), `lead_keyword_sources`, and `keywords` performance metrics.
2. **Discovery Pipeline Overhaul:** In-memory Set dedup -> Batch DB check -> Quota-safe `channels.list` -> Lightweight quality filter -> Multi-contact extraction -> Provenance recording.
3. **Gmail Sending & Reply Engine:** Remove fake fallback, implement real Gmail thread reply polling, and enforce pre-send Postgres row locking.
4. **Environment & Security Hardening:** Strict production validation rules and safe local development defaults.
5. **Test Suite Expansion & Verification:** Comprehensive unit tests covering all edge cases, end-to-end dry run verification, and healthcheck.