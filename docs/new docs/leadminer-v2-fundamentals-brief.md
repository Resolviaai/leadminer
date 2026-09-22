# LeadMiner v2 — Engineering Fundamentals Brief
**For: the coding agent. Paste this whole document as the agent's instructions.**

## PART A — Your job (read first)

You are the senior engineer on LeadMiner. Do this in order:

1. **Review** the current LeadMiner codebase against every fundamental in Part C. For each one, mark: FOLLOWED / VIOLATED / MISSING.
2. **Gap report:** list everything violated or missing, ranked by impact (what breaks at scale, what corrupts data, what gets accounts banned, what blocks v2).
3. **Design v2** (Part B vision + Part D modules) so that every fundamental in Part C is satisfied. No fundamental is optional.

Definitions: "Lead" = a business/contact that matches the campaign's ideal customer. "Source" = any platform we collect leads from (YouTube, Instagram, etc.). "Campaign" = one configured, approved, autonomous lead-generation run.

---

## PART B — Product vision: LeadMiner v2

**Where v1 stands:** scrapes YouTube only, with a fixed keyword set. Simple HTML parsing. Narrow by design.

**Where v2 must go:**

1. **Pluggable multi-source architecture.** ANY lead source must be connectable — YouTube, Instagram, TikTok, X, LinkedIn, Google Maps, business directories, websites, podcasts, newsletters. Every source is an *adapter* implementing one common interface (search, paginate, extract, rate-limit rules). Adding a new source = writing one new adapter, touching nothing else.
2. **Campaign generator.** User inputs a website link OR a business description. The system generates the full campaign: ideal customer profile, per-source search keywords/queries, extraction rules, outreach message drafts. The user **approves** before anything runs.
3. **Fully autonomous execution.** After approval, the campaign runs forever on a schedule: discovers leads, enriches them, dedupes, scores, and queues them for outreach. The user only returns to tweak the campaign (monthly/quarterly) or change the service being sold (video editing now, consulting later, other services later).
4. **Powerful scrapers, not simple HTML parsing.** Upgrade path: resilient selectors, JavaScript-rendered page handling (headless browser), AJAX/XHR interception, automatic retry with backoff, proxy rotation, change detection when a site's layout breaks.
5. **Enrichment chains.** One source leads to another, automatically. Example: YouTube video description → Instagram link → Instagram bio → business email/website. The system must follow these chains and merge everything into one lead record. Build this as a general mechanism, not a one-off hack — any hop (A→B→C) should be expressible.
6. **Account pool.** The app currently supports ~10 accounts (per prior note). Keep that working, but design the account manager so the pool size is a config number, not an architectural ceiling. Per-account daily quotas, rotation, health monitoring, cooldowns.
7. **Scale-ready, not scale-theoretical.** Must handle 10x lead volume without redesign: queues between pipeline stages, idempotent jobs (safe to retry), no single point of failure in the scraping path.

**Email sending IS in scope:** the autonomous flow is scrape → process → send outreach emails, all on schedule, with zero laptop involvement for weeks. Use a free-tier sender (Resend free tier / Gmail API within limits), per-day caps, idempotent send log (never email the same lead twice), unsubscribe + bounce handling.

---

## PART C — Fundamentals checklist (every item is mandatory)

### C1. Software Engineering (how professionals build)
- **C1.1 Modular design.** Scraper, normalizer, enricher, deduper, scorer, scheduler, and account manager are separate modules with clean interfaces. No module reaches into another's internals.
- **C1.2 Version control + change log.** Every change committed with a clear message; every release tagged. You must be able to roll back a bad scraper update in minutes.
- **C1.3 Configuration over code.** Keywords, selectors, rate limits, quotas, schedules live in config files / DB — never hardcoded. A campaign tweak must not require a code deploy.
- **C1.4 Testing.** Unit tests for parsers/dedupe/scoring; integration tests per source adapter against recorded fixtures; a "canary" check that alerts when a source's layout changes and extraction starts failing.
- **C1.5 Documentation.** Each adapter documents: what it extracts, its rate limits, its failure modes.
- **C1.6 Ship like the best programs teach (BU CS411).** CI pipeline runs the full test suite on every commit; short-lived branches; every release goes to staging first (C11.4). `main` is always deployable. [TOP-UNI]

### C2. System Architecture (how the pieces fit)
- **C2.1 Pipeline, not a script.** Stages: Discover → Extract → Normalize → Enrich → Dedupe → Score → Queue. Each stage reads from a queue and writes to the next. A failure in one stage never loses data from another.
- **C2.2 Adapter pattern for sources.** One interface, N implementations. `search(query)`, `next_page()`, `extract(item)`, `rate_limit()`. New source = new file, zero changes to core.
- **C2.3 Stateless workers.** Scraping workers hold no in-memory state that matters; any worker can die and another picks up the job. All state lives in the DB/queue.
- **C2.4 Idempotency.** Re-running any job twice must never create duplicate leads or double-count. Design every write to be safe on retry.
- **C2.5 Backpressure.** If enrichment is slower than discovery, the queue absorbs it — the system slows down instead of crashing or dropping data.
- **C2.6 Distributed-systems basics (MIT 6.824).** Past one machine, the pipeline IS a distributed system: jobs must be *atomically claimed* (Redis SET NX / DB row-lock) so two workers never own the same job; crashed workers' jobs time out and return to the queue (crash recovery); design for at-least-once delivery with idempotent consumers (C2.4). [TOP-UNI]

### C3. Data Structures & Algorithms (efficiency at scale)
- **C3.1 Dedupe by hashing.** Every lead gets a canonical key (normalized email / phone / URL). Use hash sets for O(1) duplicate checks; consider Bloom filters when the lead table gets huge.
- **C3.2 Queues for scheduling.** Job queues (per source, per account) with priorities — never a naive "loop over everything" design.
- **C3.3 Graphs for enrichment chains.** Model hops (video → Instagram → email) as graph edges so multi-hop enrichment is traversable, not hardcoded.
- **C3.4 Know your Big-O.** Any routine that runs per-lead must be sub-linear or linear; anything quadratic (comparing every lead to every other lead) is banned — use blocking/indexing instead.
- **C3.5 Retry with exponential backoff + jitter.** Failed requests wait 2s, 4s, 8s… with random jitter. Never hammer a failing endpoint.

### C4. Databases (data is the product — treat it like it)
- **C4.1 Normalized schema.** Separate tables for leads, sources, campaigns, accounts, enrichment events, outreach queue. No repeating groups; every fact stored once (1NF→3NF thinking).
- **C4.2 Indexes on lookup fields.** Email, phone, URL, campaign_id, status — indexed. Full-table scans on the leads table are a bug.
- **C4.3 Transactions.** Multi-step writes (lead + enrichment events) happen in one transaction — all or nothing. Half-written leads must be impossible.
- **C4.4 Dedupe keys + constraints.** Unique constraints on canonical email/phone/URL at the DB level, not just in code. The database is the last line of defense against duplicates.
- **C4.5 Redis for hot state.** Rate-limit counters, per-account quotas, dedupe Bloom filters, job queues live in Redis — fast, expiring, and separate from the source of truth.
- **C4.6 Flexible payloads.** Raw scraped data varies per source — store it as documents (JSONB / Mongo-style), normalized fields in columns. Never lose raw data; you will need it when extractors improve.
- **C4.7 Backups.** Automated daily backups of the lead database with tested restore. Leads are revenue — losing them is the worst possible failure.
- **C4.8 Know your database's internals (CMU 15-445).** Know the transaction isolation level you're running under and what it guarantees; run EXPLAIN on every hot query; choose B-tree vs hash indexes deliberately; understand MVCC basics (readers don't block writers). Don't treat the DB as a black box. [TOP-UNI]

### C5. Networking (talk to the internet correctly)
- **C5.1 HTTP done right.** Correct headers, user-agents, cookies, sessions. Handle redirects, compression, and status codes (429 = back off, not retry instantly).
- **C5.2 Proxies + rotation.** Distribute requests across IPs; per-source proxy pools; automatic cool-down of flagged IPs.
- **C5.3 Rate limiting as a first-class citizen.** Every adapter declares its limits (requests/minute, per account, per IP). The scheduler enforces them — limits are never "hoped for."
- **C5.4 Timeouts everywhere.** No network call without a timeout. A hung request must never hang a worker.
- **C5.5 Respect the rules.** robots.txt honored; terms of service reviewed per source; human-like delays between actions on any logged-in account.
- **C5.6 Networking depth (Stanford CS144).** Honor `Retry-After` on 429; reuse connections (keep-alive / pooling) instead of opening a new TCP connection per request; understand that retry storms trigger congestion control against you. [TOP-UNI]

### C6. Web Scraping (the core craft — level it up from v1)
- **C6.1 Beyond simple HTML parsing.** v1's plain parsing is the floor. v2 uses: resilient selector strategies (multiple fallback selectors per field), DOM-based extraction, and headless-browser rendering for JavaScript-heavy pages.
- **C6.2 AJAX/XHR interception.** Many sites load data via background API calls — intercept those directly instead of scraping rendered HTML. Cleaner, faster, more stable.
- **C6.3 Layout-change detection.** Sites redesign constantly. Every adapter has a canary: if extraction yield drops suddenly, alert + pause that source instead of silently collecting garbage.
- **C6.4 Pagination + infinite scroll handled.** Every adapter knows how to walk all pages / scroll to the end, with resume-from-last-position.
- **C6.5 Enrichment chains (C2.3's graph, in action).** YouTube description → Instagram URL → bio → email/website is ONE example. The chain engine must support arbitrary hops configured per campaign, merging all hops into a single lead record with provenance (which hop found what).

### C7. Automation & OS fundamentals (runs forever, unattended)
- **C7.1 Scheduler.** Campaigns run on cron-like schedules (hourly/daily). Missed runs catch up; overlapping runs never duplicate work (idempotency, C2.4).
- **C7.2 Logging.** Every significant event logged with timestamp, campaign, source, account: discovered, enriched, deduped, failed, rate-limited. Logs are how you debug a system you weren't watching.
- **C7.3 Alerting.** Failures, quota exhaustion, layout-change canaries, and empty yields page the owner. Silence is not success — a campaign returning zero leads for 48h is an alert, not a quiet week.
- **C7.4 Resource limits.** Workers have memory/CPU caps; runaway scrapers get killed, not the whole machine.
- **C7.5 Graceful shutdown.** The system can stop and restart without losing in-flight jobs.

### C8. OOP & Code Quality
- **C8.1 One adapter = one class** implementing the source interface. Shared behavior in base classes, never copy-pasted between adapters.
- **C8.2 Strategy pattern for extractors.** Field-extraction logic is swappable per source without touching pipeline code.
- **C8.3 DRY.** Any logic appearing twice gets extracted. Scraping code rots fast when fixes must be applied in five places.
- **C8.4 Small functions, clear names.** A new developer (or future you) must understand any module in under 30 minutes.

### C9. Security (non-negotiable)
- **C9.1 Secrets management.** API keys, account credentials, proxy passwords live in a secrets manager / env vault — never in code, never in git.
- **C9.2 Injection-proof queries.** Parameterized queries / ORM everywhere. A scraped field containing `' OR '1'='1` must be harmless data, not an attack.
- **C9.3 Account safety.** Warmup schedules for new accounts, human-like randomized delays, per-account daily action caps, immediate cooldown on any warning signal. Banned accounts are lost assets.
- **C9.4 Input validation.** Every scraped value is untrusted: validate/sanitize before storage and before display. Assume the internet is trying to break you.
- **C9.5 Least privilege.** Scraping workers get only the DB permissions they need; admin credentials never touch worker machines.
- **C9.6 Web security model (Stanford CS142, BU CS411).** The campaign approval UI is a web app: HttpOnly + SameSite cookies, CSRF tokens on state-changing requests, OAuth/JWT for logins, server-side validation of every input. Browser isolation is a security boundary — don't work around it. [TOP-UNI]

### C10. AI/ML Campaign Intelligence (v2's brain)
- **C10.1 Campaign generation.** From a website URL or business description, generate: ideal customer profile, per-source keywords/queries, extraction priorities, outreach drafts. This can use an LLM with strict output schemas — validated, never free-form into the pipeline.
- **C10.2 Lead scoring.** Score every lead (0–100) on fit: regression/classification on features like bio keywords, follower ranges, business category. Outreach queue is always sorted by score.
- **C10.3 NLP on text fields.** Classify bios/descriptions into business categories; flag buying signals. Reuse for parsing outreach replies later.
- **C10.4 Human approval gate.** Nothing runs until the user approves the generated campaign. AI proposes, human disposes — always.

### C11. Testing & QA (prove it works)
- **C11.1 Fixture-based adapter tests.** Each source adapter tested against recorded real responses. If the site changes, the test fails before production does.
- **C11.2 Data-quality checks.** Automated: % of leads with email, % duplicates slipping through, enrichment yield per hop. Trends visible on a dashboard.
- **C11.3 Load test the pipeline.** Simulate 10x lead volume; find the bottleneck before real scale does.
- **C11.4 Staging campaign.** Every new source/campaign runs in staging (no real accounts, no real outreach queue) before production.
- **C11.5 Chaos check.** Kill a worker mid-run and restart it: verify no lead is lost and none is duplicated. If the pipeline can't survive this, it can't survive production. [TOP-UNI]

---

## PART D — v2 module breakdown (build in this order)

1. **Core pipeline** (C2.1): queues + stage workers + scheduler. The skeleton everything hangs on.
2. **Database layer** (C4): schema, indexes, constraints, Redis hot state, backups.
3. **Source adapters** (C2.2, C6): YouTube first (port v1 as the reference adapter), then Instagram, then the rest. Each with canary tests (C11.1).
4. **Enrichment chain engine** (C6.5, C3.3): graph-based multi-hop enrichment with provenance.
5. **Account manager** (B.6, C9.3): pool, quotas, rotation, health, cooldowns. Size = config.
6. **Campaign generator + approval UI** (C10.1, C10.4): URL/description in → campaign out → approve.
7. **Lead scoring** (C10.2): fit scoring feeding the outreach queue order.
8. **Monitoring + alerting** (C7.2, C7.3, C11.2): logs, dashboards, alerts. Built alongside, not after.
9. **Outreach email sender** (in scope): scheduled sends from the scored queue via free-tier provider; idempotent send log; bounce/reply tracking.

---

## PART E — Non-negotiables (if these aren't true, v2 isn't done)

- [ ] A new lead source can be added without touching core pipeline code.
- [ ] Re-running any job never duplicates a lead (idempotent end to end).
- [ ] The database has unique constraints on canonical contact keys.
- [ ] Every adapter has a layout-change canary that pauses it on failure.
- [ ] No secrets in code or git. Ever.
- [ ] A campaign runs for 30 days with zero human touch and stays healthy (alerts only on real problems).
- [ ] 10x lead volume requires config changes, not a redesign.
- [ ] The gap report from Part A is empty or explicitly accepted in writing by the owner.

---

## PART F — Cross-university validation (new)

The fundamentals in Part C were cross-checked against the official, published syllabi of six top CS programs. Topic lists were taken from official university pages only (course URLs below). Result: the core of this brief matches what the best programs agree on. The gaps found became the [TOP-UNI] rules added above.

### What 3+ of these programs all teach (validates this brief)
- **Algorithms & DS:** Big-O/recurrences, sorting + lower bounds, hashing, balanced trees, BFS/DFS/topological sort, Dijkstra/Bellman-Ford, MST, DP, greedy, max-flow, NP-completeness (MIT 6.006, Stanford CS161, IITB CS213, Oxford, BU CS330)
- **Databases:** ER modeling, relational algebra + SQL, normalization, B+ tree/hash indexing, cost-based query optimization, ACID transactions, concurrency control, recovery (MIT 6.830, CMU 15-445, IITB CS317, Oxford, BU CS460)
- **Systems:** processes/threads/synchronization, virtual memory, filesystems, syscalls, caching (Stanford CS110, CMU 15-213, IITB CS347)
- **Networking:** sockets, TCP/IP + congestion control, routing, DNS, NAT (Stanford CS144, CMU 15-213)
- **Web:** HTML/CSS/DOM, React/Angular SPAs, Node/Express, REST, cookies/sessions, input validation, web security (Stanford CS142, BU CS411)
- **SE practice:** SDLC, source control, DevOps/CI, testing, SOLID/DRY (BU CS411)

### Gaps found → new rules added
1. **Distributed systems** (MIT 6.824: RPC, Paxos, 2-phase commit, crash recovery) — absent from MU BSc; critical once scraping scales past one machine → C2.6
2. **Database internals** (CMU 15-445: storage engines, MVCC, ARIES recovery, index concurrency) — MU stops at SQL + normalization → C4.8
3. **Networking depth with labs** (Stanford CS144: sockets, TCP congestion, CDNs) — MU is a survey → C5.6
4. **SE as practiced** (BU CS411: CI/DevOps, REST design, OAuth/JWT) — MU SE is theory → C1.6
5. **Modern web security model** (Stanford CS142, BU CS411: CORS/CSRF, browser isolation) — MU web focuses on building → C9.6
6. **Resilience testing** (kill-worker chaos check) → C11.5

### Official sources (all fetched from university domains, Sept 2026)
- MIT 6.006: https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/
- MIT 6.824: https://ocw.mit.edu/courses/6-824-distributed-computer-systems-engineering-spring-2006/resources/lecture-notes/
- MIT 6.830: https://ocw.mit.edu/courses/6-830-database-systems-fall-2010/pages/syllabus/
- Stanford CS161: https://web.stanford.edu/class/archive/cs/cs161/cs161.1182/
- Stanford CS110: https://web.stanford.edu/class/cs110/summer-2021/
- Stanford CS142: https://web.stanford.edu/class/cs142/lectures.html
- Stanford CS144: http://www.scs.stanford.edu/10au-cs144/
- CMU 15-213: https://cs.cmu.edu/~213
- CMU 15-445: https://15445.courses.cs.cmu.edu/fall2026/schedule.html
- IITB CS213: https://www.cse.iitb.ac.in/~akg/courses/2025-ds/
- IITB CS347: https://www.cse.iitb.ac.in/~mythili/teaching/cs347_autumn2016/index.html
- IITB CS317: https://www.cse.iitb.ac.in/~cs317/syllabus.html
- Oxford Algorithms & DS: https://www.cs.ox.ac.uk/teaching/courses/2023-2024/algorithms/
- Oxford Databases: https://www.cs.ox.ac.uk/teaching/courses/2022-2023/databases/
- BU CS330: https://www.bu.edu/riscs/cascs330/
- BU CS411: https://sites.bu.edu/perryd/cs411-software-engineering/
- BU CS460/660: https://www.bu.edu/riscs/cascs460660/

*Derived from: Mumbai University B.Sc. CS (NEP 2020) fundamentals, cross-validated against official syllabi from MIT, Stanford, CMU, IIT Bombay, Oxford, and Boston University (see Part F).*
