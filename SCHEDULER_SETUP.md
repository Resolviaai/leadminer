# LeadMiner — Scheduler & Automation Setup Guide

This document describes the unified, conflict-free scheduling setup for LeadMiner.

---

## Architecture Overview

| Process | Frequency | Scheduler | Auth Header |
|---------|-----------|-----------|-------------|
| **Daily Pipeline** | Daily at 13:30 UTC (9:30 AM EDT) | **GitHub Actions** | `Authorization: Bearer <CRON_SECRET>` |
| **15-Min Dispatcher** | Every 15 minutes (during daytime) | **cron-job.org** | `Authorization: Bearer <CRON_SECRET>` |
| **Vercel Cron** | *Disabled* | None | Vercel crons deleted to eliminate duplicate runs |

Both endpoints are protected by `pg_try_advisory_lock` in PostgreSQL, guaranteeing that even if two requests arrive simultaneously, only one can execute.

---

## 1. GitHub Secrets Configuration (Daily Pipeline)

Go to your repository on GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

Add the following secret:

- **Name:** `CRON_SECRET`
- **Value:** Your secret token (must match `CRON_SECRET` in your Vercel Environment Variables)

Optional:
- **Name:** `APP_URL`
- **Value:** `https://leadminer-app.vercel.app` (defaults to this if not set)

---

## 2. cron-job.org Configuration (15-Minute Dispatcher)

1. Log in to [cron-job.org](https://cron-job.org).
2. Click **Create Cronjob**.
3. Fill in the details:
   - **Title:** `LeadMiner Dispatcher`
   - **URL:** `https://leadminer-app.vercel.app/api/workers/dispatch`
   - **Schedule:**
     - Option A: **Every 15 minutes** (`*/15 * * * *`)
     - Option B (Recommended): **Every 15 minutes from 13:00 to 22:00 UTC** (corresponds to 9:00 AM – 6:00 PM Eastern, when your US creator recipients check email)
   - **Request Method:** `POST`
   - **Request Headers:**
     - Add Header:
       - **Key:** `Authorization`
       - **Value:** `Bearer YOUR_CRON_SECRET_HERE`
     - Add Header:
       - **Key:** `Content-Type`
       - **Value:** `application/json`
   - **Request Body:** `{}`
   - **Advanced Settings:**
     - Execution timeout: `60 seconds`
     - Failure notifications: Enable email alerts on failure
4. Save and enable the job.

---

## 3. Environment Variables in Vercel

Ensure these are set under **Project Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | 32+ character random secret string |
| `DASHBOARD_EMAIL` | Email address for operator dashboard login |
| `DASHBOARD_PASSWORD` | Strong password for operator dashboard login |
| `SESSION_SECRET` | 32+ character random string for signing cookies |
| `ENCRYPTION_KEY` | 64-character hex string for AES-256-GCM token encryption |
| `DRY_RUN` | Set to `false` for live sending, `true` for dry run |

---

## 4. Emergency Controls

If sending ever needs to be stopped immediately:
1. Open dashboard: `https://leadminer-app.vercel.app/settings`
2. Toggle the **Hardware Kill Switch** to `ARMED / ACTIVE`.
3. All workers immediately halt sending, even mid-batch.
