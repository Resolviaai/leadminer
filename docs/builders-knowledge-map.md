# 📕 The Builder's Handbook
### From syllabus to shipped: everything a software builder needs to know

**What this book is.** A practical, book-scale manual for designing and building real software — websites, web apps, SaaS, mobile apps (Android & iOS), automations, games, and the systems behind them. It distills the fundamental knowledge taught in the world's best computer-science programs — Mumbai University, IIT Bombay, MIT, Stanford, Harvard, Carnegie Mellon — into builder-first chapters: every topic goes from concept → technique → tips & tricks → mistakes to avoid → best practices → rules an AI agent must follow.

**Who it's for.**
- **You, the builder** — read a part when you're about to build in that area, or work through it to level up systematically.
- **Your AI coding agents** — hand this book (or the relevant part) to any coding agent before it starts work. Every chapter ends with 🤖 **Build rules**: MUST/SHOULD/NEVER directives that keep agent-built software correct, secure, and maintainable.

**How to use it.**
- *In a hurry?* Read **Part 0: The Map** (15 minutes) — the whole territory on a few pages.
- *Starting a project?* Read the part that matches it (Part 2 for web/SaaS, Part 3 for mobile, Part 6.3 for the shipping playbook), then give the agent the same part.
- *Going deep?* Read front to back. Each chapter is self-contained.

**A note on sources.** Course references (MIT 6.031, Stanford CS193P, etc.) were verified against official course pages — no invented course numbers. The knowledge itself is timeless: the techniques don't expire when frameworks do.

---

## 📑 Index

**Part 0 — The Map** · the entire syllabus reframed as builder knowledge, scannable in 15 minutes

**Part 1 — Foundations: Think Like a Computer Scientist**
- 1.1 Programming craft
- 1.2 Data structures & algorithms for products
- 1.3 How computers really work (builder's cut)
- 1.4 OOP & design thinking
- 1.5 Math for builders

**Part 2 — Web: Websites, Web Apps & SaaS**
- 2.1 Frontend fundamentals, deep
- 2.2 Modern frontend (React, Next.js, performance, accessibility)
- 2.3 Backend engineering (Node, APIs, auth)
- 2.4 SaaS engineering specifics (multi-tenancy, billing, 12-factor)
- 2.5 Web performance & SEO

**Part 3 — Mobile: Android, iOS & Cross-Platform**
- 3.1 Android, deep (Kotlin, Compose, architecture)
- 3.2 iOS, deep (Swift, SwiftUI, HIG, App Store)
- 3.3 Cross-platform, honest (Flutter vs React Native)
- 3.4 Mobile hard problems (offline-first, sync, push, security)
- 3.5 Shipping mobile apps

**Part 4 — Software Architecture & Engineering**
- 4.1 How software gets built (SDLC, Agile, requirements, estimation)
- 4.2 SOLID + the essential design patterns
- 4.3 Architecture styles (monolith → microservices → serverless)
- 4.4 API design mastery
- 4.5 Testing
- 4.6 Code quality
- 4.7 Paradoxes & tradeoffs every architect must know

**Part 5 — Data, DevOps & Security**
- 5.1 Databases, deep
- 5.2 Beyond SQL (NoSQL, caching, queues)
- 5.3 Servers & DevOps (Linux, Docker, CI/CD, cloud)
- 5.4 Reliability engineering (observability, incidents, DR)
- 5.5 Security for builders (OWASP, auth, secrets)

**Part 6 — AI, Games & The Builder's Playbook**
- 6.1 AI for builders (ML vs rules, LLM integration, RAG, evals)
- 6.2 Games (loops, engines, ECS, multiplayer netcode)
- 6.3 The Builder's Playbook (MVP → shipped: planning, estimation, debugging, checklists)
- 6.4 The Good vs Bad catalog (30 goods, 30 bads)
- 6.5 How to use this book as an AI agent
- 6.6 Vibecoding: Do's and Don'ts (+ coding with AI agents: Antigravity, Codex & beyond)
- 6.7 The Audit-Fix-Audit Trap: paradoxes of building with AI (bike-shedding, 90-90 rule, Goodhart's Law, escape protocol)
- 6.8 Karpathy Guidelines: behavioral rules for coding agents (think first, simplicity, surgical changes, verifiable goals)
- 6.9 The Elite Thinking Engine: structured framework for hard problems (first principles, inversion, leverage, execution)

**Part 7 — The 250 Concepts: Engineering Deep Reference**
- 7.1 Security (#1–40)
- 7.2 Databases & Data (#41–75)
- 7.3 Distributed Systems (#76–89)
- 7.4 Resilience & Performance Patterns (#90–106)
- 7.5 Messaging & Async (#107–115)
- 7.6 Networking, HTTP & APIs (#116–133)
- 7.7 Cloud & Infrastructure (#134–150)
- 7.8 Reliability & Operations (#151–179)
- 7.9 Delivery & DevOps (#180–201)
- 7.10 Testing (#202–211)
- 7.11 Code-Level Pitfalls (#212–231)
- 7.12 Compliance & Business Realities (#232–243)
- 7.13 AI Engineering (#244–250)

**Appendix A** — Mumbai University B.Sc. CS syllabus: full subject list (all 8 semesters)
**Appendix B** — Where the world's best learn this (curriculum map: MU · IIT · MIT · Stanford · Harvard · CMU)

---

# Part 0: The Map — the whole syllabus as builder knowledge
*Read this in 15 minutes when you're in a hurry. Every bullet is real Mumbai University B.Sc. CS (NEP 2020) syllabus content; the (Sem · Subject) tag tells you when you'll study it formally.*

*Source: official University of Mumbai B.Sc. Computer Science (NEP 2020) syllabus, all 8 semesters. Every bullet below is real syllabus content — nothing invented. The tag at the end of each bullet tells you which semester + subject it comes from, so you can practice now what you'll formally study later.*

**Legend:** ⭐ = highest leverage for your current work (websites, SaaS, apps, automations) — practice these first

---

## ⭐ Practice-now shortlist (the 15 that pay off fastest)

1. **HTML structure + CSS selectors + DOM** — read and target any web page `(Sem II · Web Technologies)` ⭐
2. **JavaScript: events, browser objects, form validation** — understand dynamic pages `(Sem II · Web Technologies)` ⭐
3. **AJAX / XMLHttpRequest** — fetch data like a browser, no page reload `(Sem II · Web Technologies)` ⭐
4. **Python: regex + HTML parsing + file handling** — the core scraping toolkit `(Sem I · Python)` ⭐
5. **SQL: SELECT, JOINs, aggregates, indexes** — store and query everything you collect `(Sem I · DBMS)` ⭐
6. **Database design: ER diagrams + normalization (1NF–3NF)** — design clean schemas before you code `(Sem I · DBMS)` ⭐
7. **REST APIs with Node.js + Express** — the standard SaaS backend `(Sem IV · MEAN Stack)` ⭐
8. **Async programming (event loop)** — handle many users/jobs at once without blocking `(Sem IV · MEAN Stack)` ⭐
9. **Linux terminal + ssh + cron + shell scripting** — run automations on a server 24×7 `(Sem I · Linux)` ⭐
10. **Git-style thinking via Software Engineering: Agile/Scrum, SRS, UML** — stop building chaotically `(Sem IV · Software Engineering)` ⭐
11. **Testing: test-case design + QA process** — ship without embarrassing bugs `(Sem V · Software Testing & QA)` ⭐
12. **Cloud deployment basics** — put your SaaS on the internet properly `(Sem VI · Cloud Computing)` ⭐
13. **Security basics: access control, input validation, DB privileges** — don't get hacked on day one `(Sem V · Cyber Security)` ⭐
14. **Kotlin + Android components (Activities, Intents, RecyclerView)** — real Android apps `(Sem IV · Mobile App Development)` ⭐
15. **UI/UX principles** — make things people actually enjoy using `(Sem VII · UI/UX Design)` ⭐

---

## 1. 🌐 Websites & Web Pages

- **HTML: structure, text, lists, links, tables, forms, media** — every page is built from these tags `(Sem II · Web Technologies)` ⭐
- **CSS: selectors, box model, positioning, fonts, backgrounds** — target any element, style any page `(Sem II · Web Technologies)` ⭐
- **JavaScript fundamentals: variables, functions, control flow** — the language of the browser `(Sem II · Web Technologies)` ⭐
- **DOM (Document Object Model)** — the tree map of a page; how code finds and changes any part `(Sem II · Web Technologies)` ⭐
- **Browser objects: Window, Document, Location, History, Cookies** — how JS controls the browser `(Sem II · Web Technologies)` ⭐
- **Form validation with JavaScript** — check user input in the browser before it hits your server `(Sem II · Web Technologies)`
- **AJAX + XMLHttpRequest** — background data requests; pages that update without reloading `(Sem II · Web Technologies)` ⭐
- **XML structure + XSLT transforms** — parse structured data feeds `(Sem II · Web Technologies)`
- **Cookies, sessions, headers** — how the web remembers who you are across visits `(Sem II · Web Technologies)` ⭐
- **Responsive layouts (from Android layouts thinking)** — screens that adapt to any size `(Sem IV · Mobile App Development)`
- **UI/UX Design: wireframes, usability principles, design process** — design before you code `(Sem VII · UI/UX Design)` ⭐
- **Psychology of Digital Influence** — why users click, stay, and convert `(Sem III · OE)` 

## 2. 🖥️ Web Apps & SaaS — Backend

- **Node.js: runtime, npm, modules, event loop, async programming** — JavaScript on the server, non-blocking I/O `(Sem IV · MEAN Stack)` ⭐
- **Express.js: routing, middleware, request handling** — the standard way to build server apps in JS `(Sem IV · MEAN Stack)` ⭐
- **RESTful API design** — clean URLs + HTTP methods; how frontends talk to backends `(Sem IV · MEAN Stack)` ⭐
- **MongoDB + NoSQL thinking: documents, collections, querying, indexing** — flexible data for fast-moving products `(Sem IV · MEAN Stack; Sem VII · NoSQL)` ⭐
- **Full-stack architecture: how frontend, backend, and DB fit together** — see the whole machine `(Sem IV · MEAN Stack)`
- **PHP + MySQL: server-side scripting, form handling, DB connections** — powers a huge share of the existing web `(Sem II · Web Technologies)`
- **Java + OOP: classes, inheritance, polymorphism, exception handling** — enterprise-grade backend thinking `(Sem III · Java Programming)`
- **Stored procedures (PL/SQL)** — reusable logic living inside the database `(Sem II · PL/SQL)` 
- **Sequences for auto IDs** — reliable unique identifiers `(Sem II · PL/SQL)`
- **Exception handling in data code** — pipelines that fail gracefully, not catastrophically `(Sem II · PL/SQL)` ⭐
- **Software architecture design + coupling/cohesion** — keep parts independent, each part focused `(Sem IV · Software Engineering)` ⭐
- **Component-based development** — assemble software from ready-made parts instead of reinventing `(Sem IV · Software Engineering)`

## 3. 📱 Mobile Apps (Android — syllabus covers Android; iOS note at the end)

- **Kotlin basics: variables, types, control flow, functions, OOP** — the modern Android language `(Sem IV · Mobile App Development)` ⭐
- **Android Studio + emulator setup** — the professional build environment `(Sem IV · Mobile App Development)`
- **Activities + Intents + Fragments** — screens, messages between screens, reusable UI pieces `(Sem IV · Mobile App Development)` ⭐
- **Activity lifecycle** — what happens when users switch apps, rotate, or get a call `(Sem IV · Mobile App Development)`
- **Layouts: Linear, Relative, ConstraintLayout** — arrange any screen `(Sem IV · Mobile App Development)`
- **RecyclerView + adapters** — smooth scrolling lists of thousands of items `(Sem IV · Mobile App Development)` ⭐
- **Event handling + input validation** — taps, forms, and checking user input `(Sem IV · Mobile App Development)`
- **Themes, styles, menus, dialogs, navigation** — make it look and feel like a real app `(Sem IV · Mobile App Development)`
- **SQLite: on-device database with full CRUD** — your app's local storage `(Sem IV · Mobile App Development)` ⭐
- **SharedPreferences** — tiny local settings (tokens, usernames, flags) `(Sem IV · Mobile App Development)`
- **Firebase Realtime Database: read/write, rules, live sync** — cloud data without managing a server `(Sem IV · Mobile App Development)` ⭐
- **Camera, GPS/location, audio, animations** — hardware features users expect `(Sem IV · Mobile App Development)`
- **JobScheduler: background tasks** — work that runs even when the app is closed `(Sem IV · Mobile App Development)`
- **App signing + versioning + Play Store publishing** — ship it for real `(Sem IV · Mobile App Development)`
- **iOS note:** the syllabus teaches Android only. For iOS you'll learn Swift/SwiftUI outside the syllabus — but Kotlin, OOP, lifecycles, and mobile architecture transfer directly.

## 4. 🤖 Automations, Scraping & Workflows

- **Python core: data types, loops, functions, modules** — the automation language `(Sem I · Python)` ⭐
- **Regular expressions** — pattern-match and extract text from anything `(Sem I · Python)` ⭐
- **Parsing HTML files programmatically** — the literal core of web scraping `(Sem I · Python)` ⭐
- **Files, directories, zip handling in code** — manage scraped data on disk `(Sem I · Python)`
- **Date/time handling + timestamps** — track when everything happened `(Sem I · Python)`
- **CSS selectors + DOM + AJAX/XHR** — scrape even JavaScript-heavy dynamic sites `(Sem II · Web Technologies)` ⭐
- **HTML forms + links + tables** — submit forms and follow links like a user `(Sem II · Web Technologies)`
- **Shell scripting: variables, conditionals, loops** — glue programs together on a server `(Sem I · Linux)` ⭐
- **cron: schedule jobs to run automatically** — scrapers that run while you sleep `(Sem I · Linux)` ⭐
- **ssh: control remote machines securely** — your laptop closed, work still running `(Sem I · Linux)` ⭐
- **Text-processing commands: grep, sed, awk, sort, uniq, cut** — parse scraped data from the terminal `(Sem I · Linux)`
- **R data frames + Python data tools** — clean and analyze collected data `(Sem I · Statistics with R; Sem IV · Python for Data Science)`
- **Transaction control (COMMIT/ROLLBACK)** — pipelines that never leave data half-written `(Sem I · DBMS)` ⭐
- **IoT Technologies** — when automation meets physical devices and sensors `(Sem IV · IoT)`

## 5. 🗄️ Databases & Data

- **ER modeling: entities, relationships, constraints** — draw your data design before building `(Sem I · DBMS)` ⭐
- **SQL CRUD: INSERT, SELECT, UPDATE, DELETE** — the four operations everything runs on `(Sem I · DBMS)` ⭐
- **WHERE, IN, BETWEEN, LIMIT** — filter precisely `(Sem I · DBMS)`
- **JOINs (inner, left/right/full outer)** — combine tables into answers `(Sem I · DBMS)` ⭐
- **Aggregates: COUNT, SUM, AVG, MIN, MAX + GROUP BY/HAVING** — dashboards and stats in one query `(Sem I · DBMS)` ⭐
- **Subqueries + EXISTS/ANY/ALL** — queries inside queries `(Sem I · DBMS)`
- **String/date/math functions in SQL** — clean data without leaving the database `(Sem I · DBMS)`
- **Normalization: 1NF, 2NF, 3NF, BCNF** — kill duplication and update anomalies `(Sem I · DBMS)` ⭐
- **Indexes** — make searches on big tables fast `(Sem I · DBMS)` ⭐
- **Views** — saved queries that act like virtual tables `(Sem I · DBMS)`
- **Users, privileges, GRANT/REVOKE** — who can touch what `(Sem I · DBMS)`
- **Backups + restore** — never lose client data `(Sem I · DBMS)`
- **NoSQL: when not to use SQL** — documents, key-value, flexible schemas `(Sem VII · NoSQL Technologies)`
- **Data Science: cleaning, analysis, visualization** — turn raw data into decisions `(Sem VI · Data Science)`

## 6. 🔐 Security — Best Practices

- **Threat model thinking: how attackers see your app** — you can't defend what you don't understand `(Sem V · Ethical Hacking)` ⭐
- **Access control + authentication basics** — who gets in, and what they can do `(Sem V · Cyber & Information Security)`
- **Input validation (frontend + backend)** — never trust user input, ever `(Sem II · Web Technologies; Sem IV · Mobile App Development)` ⭐
- **Database privileges + roles** — least-privilege access to data `(Sem I · DBMS)`
- **Secure sessions/cookies** — don't leak logins `(Sem II · Web Technologies)`
- **Network security: HTTPS, secure communication, QoS** — data in transit must be protected `(Sem IV · Computer Networks)`
- **Linux permissions (chmod/chown) + sudo discipline** — secure your own servers `(Sem I · Linux)`
- **Backups as a security practice** — ransomware and accidents happen `(Sem I · DBMS)`

## 7. ☁️ Cloud, Servers & Deployment

- **Cloud service models: IaaS, PaaS, SaaS** — know what you're renting `(Sem VI · Cloud Computing)` ⭐
- **Deploying applications to the cloud** — from laptop to internet `(Sem VI · Cloud Computing)` ⭐
- **Linux server administration: services, users, packages** — run your own VPS with confidence `(Sem VI · Linux Server Administration)`
- **TCP/IP, DNS, HTTP: how the internet actually moves data** — debug "it's not loading" like a pro `(Sem IV · Computer Networks)` ⭐
- **IPv4/IPv6 addressing + subnetting** — networking literacy `(Sem IV · Computer Networks)`
- **Web servers + application deployment concepts** — where your code lives `(Sem VI · Cloud Computing)`
- **Software Defined Networking** — modern programmable infrastructure `(Sem VII · SDN)`

## 8. 🧠 CS Fundamentals — Think Faster, Build Better

- **Big-O notation + complexity analysis** — know if your code will survive 10× users `(Sem II · DAA)` ⭐
- **Sorting & searching: binary search, merge sort, quicksort thinking** — the right tool for the data size `(Sem II · DAA)`
- **Pattern matching in strings** — find needles in haystacks `(Sem II · DAA)`
- **Recursion vs iteration** — two ways to break down any problem `(Sem II · DAA)`
- **Greedy, divide-and-conquer, dynamic programming** — strategy patterns for hard problems `(Sem II · DAA)`
- **Data structures: arrays, stacks, queues, linked lists, trees, graphs, hash tables** — pick the right container `(Sem III · Data Structures)` ⭐
- **OOP: encapsulation, inheritance, polymorphism, abstraction** — design code that grows without rotting `(Sem II · OOP with C++; Sem III · Java)` ⭐
- **UML: class, sequence, use-case diagrams** — sketch designs before coding `(Sem IV · Software Engineering)`
- **OS concepts: processes, threads, concurrency, memory** — why apps freeze and servers choke `(Sem III · Operating Systems)`
- **Theory of Computation: what's solvable at all** — recognize impossible problems early `(Sem III · TOC)`

## 9. 🛠️ Engineering Like a Pro — Process & Quality

- **Agile, Scrum, XP: sprints, stand-ups, iterations** — ship in weeks, not "someday" `(Sem IV · Software Engineering)` ⭐
- **SRS: writing down what you're actually building** — kill scope creep before it starts `(Sem IV · Software Engineering)`
- **Estimation: story points, COCOMO II thinking** — quote projects without guessing `(Sem IV · Software Engineering; Sem VI · Software Project Management)`
- **Make-or-buy decisions** — build vs. use a library/service `(Sem IV · Software Engineering)` ⭐
- **Test-case design + QA process** — systematic bug-hunting `(Sem V · Software Testing & QA)` ⭐
- **Risk management + configuration control** — professional-grade project hygiene `(Sem IV · Software Engineering)`
- **Project planning: scope, feasibility, scheduling** — run client work like a studio `(Sem VI · Software Project Management)`
- **Mini Project I (real-world app) + Mini Project II (research)** — portfolio pieces built into the degree `(Sem V–VI)`
- **On-Job Training (Sem VIII)** — real industry exposure before you graduate `(Sem VIII · OJT)`

## 10. 📊 Data & AI — Future Leverage

- **Machine Learning fundamentals** — predictions and personalization in your products `(Sem VIII · ML)`
- **NLP: text understanding, embeddings** — chatbots, search, sentiment `(Sem VIII · NLP)`
- **Web Data Analytics** — measure what users do, then improve it `(Sem VIII · Web Data Analytics)` ⭐
- **Information Retrieval: how search engines work** — build search into your apps `(Sem VI · Information Retrieval)`
- **Deep Learning + Computer Vision + Simulation** — advanced tools when you need them `(Sem VII–VIII)`
- **Statistics with R: distributions, regression, visualization** — make claims with numbers, not gut feel `(Sem I · Statistics)`

---

## 🗺️ How to use this map

1. **Pick what you're building** → jump to its section → scan the bullets.
2. **⭐ items first** — they're the 20% that covers 80% of real product work.
3. **The (Sem · Subject) tag** tells you when you'll study it formally — practice the ⭐ ones *now* and you'll walk into those semesters already ahead.
4. **Gaps the syllabus doesn't cover** (learn outside): iOS/Swift, modern frontend frameworks (React/Next.js — syllabus teaches Angular/PHP), DevOps tooling (Docker, CI/CD), payment integrations (Stripe/Razorpay), and marketing/SEO.

*Built from the official MU B.Sc. CS (NEP 2020) syllabus. Full topic-level syllabus: `workspace/syllabus/mumbai-univ-bsc-cs-syllabus.md`*


---

# Part 1: Foundations — Think Like a Computer Scientist

*Grounded in what the world's best programs actually teach: MIT 6.006 Introduction to Algorithms (Demaine, Rivest, Devadas — "methods useful in practice": sorting, hashing, divide-and-conquer, dynamic programming, graphs, amortized analysis), MIT 6.031/6.1020 Software Construction (code that is safe from bugs, easy to understand, ready for change: specs, invariants, testing, ADTs, concurrency), Stanford CS107 Computer Organization & Systems (C down to the microprocessor: data representation, memory organization, performance), Stanford CS106B Programming Abstractions (recursion, dynamic data structures, classic structures and algorithms, good engineering), and the IIT Bombay CSE core (discrete math, programming, computer organization, DSA, OS, networks, databases, theory of computation, software engineering). Distilled to the builder-relevant core — no interview trivia, only what changes how you build.*

---

## 1.1 Programming Craft

### Core concepts

- **Variables are names bound to values, not boxes.** Two names can point at the same object; mutating through one surprises you through the other (aliasing). Understand your language's model or it will bite you.
- **Types are contracts.** A type states what operations are legal and what guarantees hold. Be explicit about what every function accepts and returns, whatever the language.
- **Control flow is sequencing, selection, iteration.** Every program is built from these three. If you can't trace which path your code takes for a given input, you don't understand your own program yet.
- **Functions are abstraction boundaries.** A good function hides *how* and exposes *what*. The caller needs the contract (inputs, outputs, side effects) and nothing else — this is how you manage complexity.
- **Scope decides visibility.** Bugs love scope confusion: shadowed variables, closures capturing loop variables, globals mutated from far away.
- **State is the root of most bugs.** Every variable that changes over time is state you must reason about. Less mutable state = fewer surprises. Prefer computing values over maintaining them.
- **Reading code is a core skill.** You will read 10× more code than you write — libraries, frameworks, AI-generated code, your own code from six months ago. Reading fluency is what makes debugging fast.

### Techniques & methods

- **Hypothesis-driven debugging.** Form one hypothesis ("the list is empty because the filter ran before the fetch finished"), design the cheapest test that would disprove it, run it. One hypothesis at a time — never shotgun-debug.
- **Bisect the problem.** Worked yesterday, fails today? Find the change in between. `git bisect`, disabling half the code, halving the pipeline — narrowing the search space beats reading everything.
- **Reproduce first, fix second.** A bug you can trigger on demand is 80% solved. Write the smallest reproduction before touching the fix; if you can't reproduce it, you can't verify the fix.
- **Read the full stack trace.** Beginners read the last line; professionals read the chain — the real cause is often two frames up from where it exploded.
- **Trace with a debugger, not just prints.** Step through execution, watch variables change, set conditional breakpoints. Prints lie by omission; a debugger shows actual state.
- **Read code from the outside in.** Find the entry point (main, route handler, event listener), follow calls one level at a time. Don't try to understand a whole codebase at once — understand the path your request takes.

### Tips & tricks

- **Name things so code reads like sentences.** `if user.is_verified` beats `if check_flag(u, 2)`. You read a name hundreds of times and write it once — optimize for reading.
- **Small functions with one job.** If you can't describe it in one sentence without "and", split it.
- **Guard clauses beat nested ifs.** Return early for invalid cases; keep the happy path at the left margin. Deep nesting is where bugs hide.
- **No magic numbers.** `retry_after(30)` means nothing; a named constant explains itself.
- **Comments explain *why*, not *what*.** `# skip retried webhooks: Stripe may deliver twice` saves someone an hour; `i += 1  # increment i` is noise.
- **Commit small, commit often.** One logical change per commit with a why-message. Your future self running `git bisect` will thank you.

### Common mistakes (the bad)

- **Copy-pasting code you don't understand.** It works until the context changes, then fails in ways you can't diagnose because you never owned the logic. Understand it, then adapt it — or don't use it.
- **Cargo-cult programming.** Sleep calls to "fix" races, `try/except: pass` to silence errors, flags copied from Stack Overflow. Every line should have a reason you can state out loud.
- **Swallowing errors.** Empty catch blocks turn small failures into mysterious corruption three layers away. An error you hide is a bug you'll meet at 2 AM in production.
- **Giant functions doing five things.** Untestable, unreadable, unchangeable — when requirements shift, you can't touch one behavior without breaking four others.
- **Mutable global state.** A global anything can change anytime makes every function's behavior depend on invisible history. The #1 source of "works on my machine" and flaky tests.
- **Not reading the docs or source of dependencies.** Guessing at a library's behavior from its name, then being surprised. The source is the ultimate documentation — read it when behavior matters.

### Best practices (the good)

- **DRY with judgment.** Three copies is a signal; two is often fine. Wrong abstractions are worse than duplication — don't abstract before the pattern is proven.
- **Fail fast, fail loudly.** Validate inputs at the boundary and crash with a clear message rather than limping on with bad data. Loud failure at the source beats silent corruption downstream.
- **Validate at the edges, trust the inside.** Check everything from outside your system (user input, API responses, files). Inside your modules, rely on contracts.
- **Make illegal states unrepresentable.** Enums instead of magic strings, required fields instead of nullable ones — let the type system reject bad data before it exists.
- **Prefer pure functions; push side effects to the edges.** Pure functions are trivially testable and reusable. I/O, network, and DB writes belong at the boundaries, not scattered through logic.

### 🤖 Build rules

1. **MUST reproduce a bug with a minimal case before fixing it.** No "I think this fixes it" without proof.
2. **MUST read the full stack trace and fix the root frame, not the crash site.** Fix causes, not symptoms.
3. **NEVER swallow exceptions silently.** Every catch must log, re-raise, or handle — empty catches are forbidden.
4. **NEVER use code you cannot explain line by line** — including AI-generated code. Verify before shipping.
5. **MUST keep functions small and single-purpose.** If the description needs "and", split it.
6. **SHOULD validate all external input at the system boundary.** Assume every input is hostile until checked.
7. **MUST use version control with small, meaningful commits.** No "final final v2" dumps.
8. **NEVER commit secrets, keys, or credentials.** Environment variables or a secret store, always.
9. **SHOULD prefer pure functions and immutable data in core logic.** Isolate side effects at the edges.
10. **MUST name things for the reader.** If a name needs a comment to explain it, rename it.

---

## 1.2 Data Structures & Algorithms That Actually Matter in Products

### Core concepts

- **Big-O is about growth, not speed.** O(n) vs O(n²) doesn't matter at n=10 — it matters at n=1,000,000, exactly when your product starts succeeding. Big-O answers: "what breaks first when we grow?"
- **Arrays: ordered, indexable, cache-friendly.** The default container — great for lists you iterate, terrible for mid-list inserts or key lookups. Feeds, timelines, search results.
- **Hash maps: the workhorse of real software.** O(1) average lookup by key. Sessions by token, config by name, dedup sets, caches — most product logic is hash maps all the way down.
- **Trees: order + hierarchy.** BSTs give sorted data with fast insert/lookup; database indexes are B-trees; tries power autocomplete. DOM, file systems, comment threads are all trees.
- **Heaps: "give me the top K."** Priority queues run schedulers and "trending" feeds. If you sort an entire list just to take the top 5, you wanted a heap.
- **Graphs: relationships.** Social connections, recommendations, dependency resolution, routing — all graphs. BFS and DFS are the two traversals; learn them cold.
- **Amortized analysis (from MIT 6.006):** some operations are occasionally expensive but cheap *on average* — array growth, hash map resizing. Design for the average, budget for the worst.

### Techniques & methods

- **Choose by access pattern.** How do you look things up — by key, by order, by range? How often do you insert/delete? How big does it get? Key → hash map. Sorted/range → tree. Top-K → heap. Relationships → graph.
- **Two pointers and sliding window.** For array/string work (dedup, windowed stats, merging sorted feeds), these turn O(n²) into O(n) — constant presence in data pipelines.
- **Memoize repeated work.** Same function, same arguments, repeated calls (pricing calc, permission check)? Cache the result. This one technique fixes a shocking number of performance problems.
- **Index like a database does.** An index trades write speed and space for read speed. If a query is slow, the answer is almost always "add the right index", not "rewrite the query cleverly".
- **Paginate and stream.** Never load "all records" into memory. Cursors, limits, and streaming process data in bounded chunks — your code should behave identically on 100 rows and 100 million.

### Tips & tricks

- **The 80/20 of performance: it's the database and the network.** Slow code is rarely the bottleneck — N+1 queries, missing indexes, and chatty APIs are. Profile before optimizing; the problem is usually I/O, not CPU.
- **Know your n.** n=100: anything works. n=10⁴: avoid O(n²). n=10⁶: need O(n log n) or better, plus streaming. n=10⁹: you need distributed systems. Estimate n *before* choosing.
- **Sorting is universal preprocessing.** Sorted data enables binary search, dedup, merging, and range queries. When in doubt, sort once and exploit the order many times.
- **Trade space for time deliberately.** Caches, indexes, precomputed tables — all buy speed with memory. The most common performance trade in products, and usually worth it.

### Common mistakes (the bad)

- **The N+1 query.** Load a list (1 query), then loop fetching each item's details (N queries). Fine with 10 users, catastrophic with 10,000. Fix with joins, batching, or eager loading.
- **Nested loops over growing data.** O(n²) hiding in innocent code — comparing every user with every other, re-filtering inside a loop. Works in dev, melts in prod.
- **Sorting to get top-K.** O(n log n) for what a heap does in O(n log k). Minor at small scale, embarrassing at large.
- **Loading everything into memory.** `SELECT *` with no limit, giant in-memory lists. Memory is finite; data grows forever. Stream it.
- **Premature cleverness.** A hand-rolled balanced tree where a dict would do. Clever structures have subtle bugs; boring structures have battle-tested libraries. Boring wins in products.

### Best practices (the good)

- **Default to the boring structure.** Array for lists, hash map for lookups, database for persistence. Exotic structures only with measured justification.
- **Let the database do what databases do.** Filtering, sorting, joining, aggregating — the DB does these in optimized C with indexes. Don't pull 100k rows into your app to filter in a loop.
- **Design for the read/write ratio.** Read-heavy: index aggressively, cache hard. Write-heavy: keep writes cheap, batch them, defer indexing.
- **Bound everything.** Bounded queues, caches with eviction (LRU), bounded retries and page sizes. Unbounded growth is how outages happen.
- **Measure, then optimize, then measure again.** A profiler beats intuition. Most guesses about "slow code" are wrong about where the time goes.

### 🤖 Build rules

1. **MUST choose data structures by access pattern, never by habit.** State the pattern before the structure.
2. **MUST estimate n (data size) before writing data-processing code.** The estimate decides the algorithm.
3. **NEVER write N+1 queries.** Batch, join, or eager-load — one query per page render, not per row.
4. **NEVER load unbounded result sets into memory.** Paginate, cursor, or stream — always.
5. **MUST add database indexes for every query pattern in a hot path.** If you query by it, index it.
6. **SHOULD prefer O(1)/O(log n) lookups over scans in anything user-facing.**
7. **NEVER hand-roll crypto, hashing, or exotic structures when a standard library exists.** Boring and correct beats clever and subtly broken.
8. **MUST profile before optimizing.** No rewrites based on gut feeling about "slow" code.
9. **SHOULD cache repeated expensive computations with explicit invalidation rules.** A cache without invalidation is a bug factory.
10. **MUST bound queues, caches, retries, and page sizes.** Unbounded = outage waiting to happen.

---

## 1.3 How Computers Really Work — Builder's Cut

### Core concepts

- **A process is a running program with its own memory.** The OS gives each process an isolated address space — one crashing app doesn't take down the others. Your server runs many processes; your app is one of them.
- **Threads share memory within a process.** Cheap communication, spectacular bugs: two threads writing the same variable without coordination = race condition = Heisenbugs that vanish when you look at them.
- **Memory: stack vs heap.** Stack holds calls and locals — fast, automatic, small. Heap holds long-lived dynamic data — flexible, fragmented. Stack overflows come from runaway recursion; heap exhaustion from leaks or unbounded growth. (Stanford CS107 drills this until it's instinct.)
- **Concurrency ≠ parallelism.** Concurrency is juggling many things (a server handling 1,000 connections); parallelism is doing many things at once (multiple cores). I/O-bound work needs concurrency; CPU-bound work needs parallelism. Mix them up and a 32-core server blocks on one thread.
- **DNS turns names into addresses — then HTTP rides on TCP.** Before any request, a domain resolves to an IP (cached at many layers; failures look like "the internet is down"). TCP provides reliable ordered streams so HTTP can pretend the network is simple request/response. The pretense leaks: handshakes cost time, connections break, and latency dominates everything.
- **An HTTP request is text with a contract.** Method + URL + headers + body in; status code + headers + body out. 2xx success, 3xx redirect, 4xx *your* fault, 5xx *their* fault. Speak status codes fluently — it's how you debug every API integration.
- **Latency is the tax on everything.** Every network round-trip costs tens to hundreds of milliseconds. This single fact drives caching, batching, CDNs, and keeping servers close to users.

### Techniques & methods

- **Async / non-blocking I/O.** Don't hold a thread hostage waiting on the network. Event loops and async/await let one process juggle thousands of concurrent operations. Never block the event loop with CPU-heavy or synchronous work.
- **Connection pooling.** Opening a fresh DB/HTTP connection per request wastes the handshake every time. Pools keep warm connections ready — sized to actual concurrency, not vibes.
- **Retries with exponential backoff + jitter.** Transient failures are normal. Retry, wait longer each time (1s, 2s, 4s…), add randomness so a thousand clients don't retry in lockstep and DDoS your own recovery.
- **Timeouts on everything.** Every network call, lock, and external dependency gets a deadline. A call without a timeout is a thread that can hang forever — and hung threads accumulate until the server dies.
- **Idempotency.** Design operations so repeating them is safe (unique request IDs, upserts, natural keys). Networks deliver twice sometimes; you must not double-charge because of it.
- **Backpressure.** When downstream can't keep up, slow upstream instead of queueing infinitely. Bounded queues, load shedding, "try again later". Infinite queues are slow-motion crashes.

### Tips & tricks

- **Read the status code before the body.** 401 = your auth is wrong; 429 = slow down; 503 during a deploy = wait. The code tells you *who* should act — no body-parsing needed.
- **`curl -v` is a superpower.** Shows DNS, TLS handshake, headers, redirects — the full anatomy of a request. Half of "the API is broken" mysteries die in 30 seconds of verbose curl.
- **Localhost lies about latency.** Everything is instant on your machine. Throttle your network in testing or you'll ship an app making 40 sequential requests that feels broken on real networks.
- **Logs need correlation IDs.** In a concurrent server, interleaved logs are unreadable. Tag every line with a request ID so you can follow one request through the chaos.

### Common mistakes (the bad)

- **No timeouts.** The #1 production killer. One slow dependency without a timeout cascades: threads pile up, memory grows, the whole service falls over.
- **Unbounded retries.** Retrying forever on a failing dependency turns a small outage into a self-inflicted DDoS (retry storm). Bound retries, back off, then fail openly.
- **Blocking the event loop.** Heavy computation or sync I/O on the event loop freezes *everything*. Offload CPU work to workers; keep the loop for I/O.
- **Shared mutable state across threads without synchronization.** Works 999 times, corrupts data the 1,000th. If two threads touch it and one writes, you need a lock, an atomic, or a better design (message passing, immutability).
- **Assuming the network is reliable.** Packets drop, connections reset, DNS flakes. Every remote call can fail, hang, or return partial data — design for all three.
- **Deep synchronous service chains.** A calls B calls C calls D — each hop adds latency and multiplies failure odds. Prefer async where possible; never build latency lotteries.

### Best practices (the good)

- **Design for failure as the normal case.** Timeouts, backoff, circuit breakers, graceful degradation. Ask of every dependency: "what happens when this is slow? when it's down?"
- **Make the happy path fast and the failure path obvious.** Cache the common case; make errors loud, specific, actionable. Silent degradation is worse than a clear error.
- **Separate I/O-bound from CPU-bound work.** I/O-bound → async/concurrency. CPU-bound → workers/parallelism. Right tool, right job.
- **Keep services stateless where possible.** State lives in the database or cache, not server memory — then any instance handles any request and scaling is just adding instances.
- **Observe everything.** Metrics (how many, how slow), logs (what happened), traces (which path). Production *will* surprise you; make sure you can see it.

### 🤖 Build rules

1. **MUST set timeouts on every network call, lock, and external dependency.** A call without a timeout is a bug.
2. **MUST retry with exponential backoff + jitter, bounded (3–5 attempts), then fail openly.** Never retry forever.
3. **NEVER block an event loop with CPU-heavy or synchronous I/O work.** Offload to workers/threads.
4. **MUST make all externally-visible operations idempotent** (request IDs, upserts, natural keys). Assume delivery can duplicate.
5. **NEVER share mutable state across threads without synchronization.** Prefer message passing or immutability.
6. **MUST propagate a correlation/request ID through every log line in a request's path.**
7. **SHOULD keep application servers stateless.** Persist state in the database/cache, not process memory.
8. **MUST implement backpressure: bounded queues and explicit load shedding (429), never unbounded buffering.**
9. **NEVER assume the network is reliable.** Handle failure, slowness, and partial responses for every remote call.
10. **SHOULD test under simulated latency and failure** (throttled network, killed dependencies) before shipping anything networked.

---

## 1.4 OOP & Design Thinking

### Core concepts

- **A class is a blueprint; an object is the thing built from it.** The class defines shape and behavior; objects carry data. Confusing the two is the root of most beginner OOP bugs.
- **Encapsulation: hide the how, expose the what.** Internal data reachable only through methods. This isn't about security — it's about *change*: rewrite internals freely as long as the public interface holds. (MIT 6.031's "ready for change" starts here.)
- **Composition vs inheritance: the central design decision.** Inheritance says "A *is a* B"; composition says "A *has a* B". Inheritance couples permanently along one axis; composition lets you mix and match. When in doubt, compose.
- **Interfaces define *capability*, not identity.** "Anything that can `send(email)`" beats "must be an `EmailSender`". Program to the capability and swap implementations (real, mock, logging) without touching callers.
- **Polymorphism: one interface, many behaviors.** What makes plugins, strategies, and test doubles possible.
- **An ADT is a contract + hidden representation.** (Straight from MIT 6.031.) Clients see operations and specs; representation is invisible and swappable — list today, tree tomorrow, no client notices.

### Techniques & methods

- **Model the domain, not the database.** Start from real-world concepts (Order, Customer, Shipment) and their relationships. Good domain models make business logic obvious; table-shaped models scatter it across queries.
- **Favor composition over inheritance.** Combine small focused objects instead of extending big base classes. Hierarchies deeper than two levels are a design smell.
- **Dependency injection.** Don't let objects construct their dependencies — pass them in. Dependencies become visible in the signature, implementations become swappable, and everything becomes testable with fakes.
- **Small, focused interfaces.** An interface with twenty methods burdens every implementer. Split by role; clients shouldn't depend on methods they don't use.
- **Patterns that earn their keep:** Strategy (swap algorithms), Factory (centralize construction), Observer (notify many of one event), Adapter (bridge incompatible interfaces), Repository (hide data access behind a domain interface). Learn these five deeply; ignore the rest until you feel the pain they solve.
- **Tell, don't ask.** Instead of pulling data out to decide (`if account.balance > x: account.balance -= x`), tell the object (`account.withdraw(x)`) and let it enforce its own rules. Logic stays with the data it governs.

### Tips & tricks

- **Name classes as nouns, methods as verbs.** `invoice.send()` reads right. If naming is hard, the design is probably wrong — the struggle is diagnostic.
- **A constructor should leave the object valid.** Required data goes in the constructor; invalid states should be unconstructable.
- **Immutability as default.** Immutable objects can't be corrupted by aliasing and are thread-safe by construction. Reach for mutation only where needed.
- **Write the interface before the implementation.** Draft public methods and contracts first. If the interface is awkward to *use*, the design is wrong — cheapest to discover before writing the body.

### Common mistakes (the bad)

- **Deep inheritance hierarchies.** `Vehicle → MotorVehicle → Car → Sedan → SportsSedan` — changing a grandparent breaks grandchildren unpredictably. Hierarchies ossify; requirements change along axes you didn't predict.
- **Inheritance for code reuse.** Inheriting just for helper methods creates a false "is-a" and drags along the whole parent. Reuse via composition or plain functions.
- **God objects.** A `User` class with 60 methods covering auth, billing, and notifications — the file everyone fears touching. Split by responsibility.
- **Anemic models + procedural code.** Data-bag objects with all logic in "manager"/"util" classes — procedural code wearing an OOP costume. You've lost encapsulation's benefit and gained nothing.
- **Over-abstracting.** Interfaces with one implementation, factories for things built once, "flexibility" for futures that never come. Abstraction is a cost paid now for a benefit later — don't pay without evidence.
- **Leaky abstractions.** An API that forces callers to understand its internals anyway (the "simple" client that requires knowing its caching). If using it requires knowing what's underneath, it failed.

### Best practices (the good)

- **Encapsulate what varies.** Pricing rules, notification channels, storage backends — hide each behind a stable interface. Change becomes swapping an implementation, not editing fifty call sites.
- **Program to interfaces, not implementations.** This is what makes testing possible (mocks) and refactoring safe (swap internals freely).
- **Single Responsibility, honestly applied.** One reason to change per class. "User authentication" and "user billing" are two reasons — two classes.
- **Keep the public surface small.** Every public method is a promise kept forever. Expose the minimum; you can always add, never take back.

### 🤖 Build rules

1. **MUST favor composition over inheritance.** Hierarchies deeper than two levels are forbidden without explicit justification.
2. **MUST depend on interfaces/capabilities, not concrete classes,** for anything touching I/O, time, randomness, or external services (so it can be faked in tests).
3. **NEVER create god objects.** More than ~10 public methods or multiple responsibilities → split it.
4. **MUST keep constructors honest: an object is valid immediately after construction.** No half-built objects.
5. **NEVER use inheritance merely to reuse code.** Reuse via composition or functions.
6. **SHOULD make domain objects immutable by default.** Mutate only where genuinely required.
7. **MUST keep each class to one reason to change.** Two unrelated reasons → two classes.
8. **NEVER expose internal representation.** Behavior goes through methods that enforce invariants — no public fields callers manipulate directly.
9. **SHOULD apply "tell, don't ask":** put behavior with the data it operates on.
10. **MUST NOT introduce an abstraction without a second concrete use case or a test double that needs it.** No speculative generality.

---

## 1.5 Math for Builders

### Core concepts

- **Boolean logic is the atoms of code.** Every `if`, filter, and validation rule is logic. De Morgan's laws (`not (A and B)` = `(not A) or (not B)`) appear every time you negate a compound condition — mis-negation is a top source of security and correctness bugs.
- **Sets describe collections precisely.** Union, intersection, difference — the mental model behind SQL joins, permission checks (user's roles ∩ required roles), and dedup. Thinking in sets prevents whole classes of missed edge cases.
- **Probability is calibrated uncertainty.** P(A|B) is the most useful formula in product work: given this alert fired, how likely is it real? Most builder mistakes come from ignoring the base rate.
- **Expected value drives decisions.** EV = Σ(probability × payoff). A 10% shot at +$100k vs 90% chance of −$10k has EV = +$1k. Use it for prioritization, pricing experiments, and judging whether an optimization is worth the engineering time.
- **Distributions beat averages.** Mean, median, variance, percentiles — the *shape* of data matters more than any single number. Latency, revenue per user, and bug counts are all heavily skewed; the average lies about all of them.
- **Vectors and matrices are lists and tables with superpowers.** Similarity = angle between vectors; transformation = matrix multiplication. Embeddings, graphics, and recommendation math all rest on this intuition.

### Techniques & methods

- **Fermi estimation.** Break the unknown into multipliable chunks: users × actions/user/day × bytes/action = storage/day. Round aggressively. If the answer is 10GB vs 10TB, you've learned what you needed.
- **Think in p50/p95/p99, not averages.** "Average latency 200ms" can hide 5% of users waiting 5 seconds. p99 is where user pain lives — alert on percentiles, optimize the tail.
- **Base-rate reasoning (Bayes intuition).** A "99% accurate" fraud detector on a population with 0.1% fraud still yields ~9 false alarms per real catch. Always ask "99% of *what*, out of *how many*?" before trusting any classifier or alert.
- **A/B thinking.** Change one variable, hold a control constant, decide the success metric *before* running. Peeking early and stopping when it "looks good" manufactures false wins.
- **Expected-value prioritization.** Score opportunities as (probability × payoff) − cost. Imprecise, but it forces the two questions that matter: how likely, and how big.
- **Sanity-check with extremes.** Plug in 0, 1, and infinity. Does pricing work for 1 user and 1M? Does pagination handle page 1 and page 10,000? Extremes expose broken assumptions fast.
- **Back-of-envelope capacity math.** Requests/sec × bytes × seconds = bandwidth; users × session MB = RAM. Do this *before* choosing infrastructure — it turns "scale" arguments into arithmetic.

### Tips & tricks

- **Median for skewed data, mean for symmetric.** Incomes, latencies, session lengths: medians. Using the wrong one misleads everyone downstream.
- **Percentages need denominators.** "Conversion up 50%!" — from 2% to 3%, or from 40 to 60 users? A percentage without its base is marketing, not math.
- **Independence is rare; assume correlation.** Retry storms, correlated failures, users behaving alike — real events cluster. Math assuming independence underestimates worst cases; design margins for the clustered case.
- **Small samples lie confidently.** Five users loving a feature proves nothing. Treat tiny samples as signals, not conclusions.

### Common mistakes (the bad)

- **Base-rate neglect.** "95% accurate test" for a rare condition means most positives are false. Builders ship alert systems and ML features on this mistake constantly.
- **Confusing correlation with causation.** Users of feature X retain better — or do retained users just explore more? Correlate to generate hypotheses; experiment to confirm.
- **Averages hiding the tail.** Optimizing mean latency while p99 burns; "average revenue per user" dominated by one whale. The average can summarize dishonestly.
- **The gambler's fallacy in systems.** "Failed 3 times, must succeed now" — retries don't get luckier. Each attempt is independent; fix the cause or back off instead.
- **False precision.** "Migration will take 37.5 hours" from ±50% estimates. Round to the uncertainty: "~1–2 days."
- **Survivorship bias.** Studying only successes and concluding "just do what they did" — the invisible failures often did the same things. Ask what's *missing* from the data.

### Best practices (the good)

- **Measure distributions, decide on percentiles.** Instrument p50/p95/p99 for every latency and size metric touching users. Dashboards of averages are decoration.
- **Do the Fermi estimate before the architecture.** Ten minutes of arithmetic prevents ten days of building the wrong system. Every design doc starts with the numbers.
- **State uncertainty explicitly.** Ranges, "roughly", "order of" — honest uncertainty beats false precision and lets others reason correctly.
- **Keep a decision log with the math.** "Chose X because EV ≈ $N under assumptions A, B." When assumptions change, you revisit exactly what matters instead of re-arguing from scratch.

### 🤖 Build rules

1. **MUST do back-of-envelope capacity math (requests/sec, storage, bandwidth) before choosing infrastructure or data structures for anything at scale.**
2. **MUST report and alert on p50/p95/p99 — never on averages alone** — for every user-facing latency or size metric.
3. **MUST state the denominator with every percentage** in reports, dashboards, and experiment results.
4. **NEVER ship a classifier, alert, or detection rule without base-rate analysis.** Compute precision on *your* population, not the vendor's benchmark.
5. **MUST round estimates to their uncertainty.** No false precision in timelines, costs, or capacity plans.
6. **SHOULD sanity-check every formula and pricing model at extremes (0, 1, very large)** before shipping.
7. **NEVER confuse correlation with causation in product decisions.** Correlational findings are hypotheses; only controlled comparisons confirm.
8. **MUST treat retries as independent attempts** — back off and fix causes; never assume "it must work this time."
9. **SHOULD log the assumptions behind every estimate** so they can be revisited when reality differs.
10. **MUST prefer medians over means** for skewed operational data (latency, revenue, session length).


---

# Part 2: Web — Websites, Web Apps & SaaS

*From raw HTML to production SaaS. Grounded in what top programs teach: Stanford CS142 (Web Applications — React frontend, Node/MongoDB backend, API design across HTTP/AJAX/REST/GraphQL, sessions/cookies), Harvard CS50 Web (Django models/migrations, React UIs, testing/CI/CD, caching, scaling, security), MIT 6.813 Web Development Labs (cascade/specificity, box model, flexbox/grid, responsive design, events, async JS).*

---

## 2.1 Frontend fundamentals, deep

### Core concepts

- **Semantic HTML is a contract, not decoration.** `<header>`, `<nav>`, `<main>`, `<article>`, `<button>` tell browsers, screen readers, and search engines what things *are*. A `<div>` tells them nothing. Semantics buy you accessibility and SEO for free — this is why every serious web course starts here.
- **The cascade is a conflict-resolution algorithm.** Winner is decided by origin → specificity → source order. Read specificity as a score (inline, IDs, classes, elements) instead of fighting it blindly.
- **Inheritance vs. cascade are different things.** Inheritance passes *some* properties (color, font) parent→child automatically; the cascade resolves competing rules. Confusing them is the #1 source of "why won't this style apply" — MIT's web labs drill exactly this.
- **The box model is the physics of layout.** Every element is content + padding + border + margin. `box-sizing: border-box` makes width include padding and border — without it, percentage layouts silently overflow.
- **Layout models, and when each wins:** **flexbox** (one-dimensional — navbars, card rows, centering), **grid** (two-dimensional — page skeletons, galleries), positioning (absolute/fixed/sticky for overlays). Rule of thumb: flexbox for components, grid for layouts. Floats are legacy — don't build with them.
- **The DOM is a live tree, not a string.** `document` is an object graph; changing it re-renders the page. Every framework is just a disciplined way of mutating this tree.
- **Events propagate in two phases:** capturing (down) then bubbling (up). One listener on a parent handles clicks from hundreds of children — event delegation, how dynamic lists stay fast.
- **Responsive design is three ideas:** fluid grids (percentages/`fr`, not fixed pixels), flexible media (`max-width: 100%`), and media queries (adapt at breakpoints). Mobile-first means you write the small-screen CSS by default and *add* complexity as screens grow.

### Techniques & methods

- **Landmark-first page skeleton:** `header > nav`, `main` (exactly one), `footer`, plus `section`/`article` with headings. Screen-reader users navigate by these.
- **Flexbox patterns that cover 90% of needs:** `display: flex; justify-content: space-between; align-items: center` (navbar), `gap` instead of margins (no collapsing-margin surprises), `flex-wrap: wrap` for responsive rows, `margin-left: auto` to push one item to the far edge.
- **Grid patterns:** `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))` gives you a responsive card grid with zero media queries. `grid-template-areas` makes page skeletons readable.
- **Event delegation:** attach one `click` listener to `<ul>`, read `event.target.closest('li')`. Works for elements added later — no re-binding after every render.
- **Debounce vs. throttle:** debounce (search input — wait until typing stops), throttle (scroll/resize — at most once per X ms). Both exist to stop handlers from firing hundreds of times per second.
- **Mobile-first media queries:** `@media (min-width: 768px) { … }` — base styles are mobile, enhancements layer on. Fewer overrides, smaller CSS.
- **Fluid typography:** `font-size: clamp(1rem, 2vw + 1rem, 2rem)` — type that scales smoothly instead of jumping at breakpoints.
- **Progressive enhancement:** core content works with HTML alone; CSS and JS are layers on top. If your page is blank with JS disabled, the foundation is wrong.

### Tips & tricks

- Set `*, *::before, *::after { box-sizing: border-box; }` on every project, day one.
- Use `gap` in flex/grid — it doesn't collapse and doesn't need `:last-child` margin hacks.
- `<details>`/`<summary>` gives you an accessible accordion with zero JavaScript.
- The browser devtools device toolbar + "disable cache" checkbox catch most responsive bugs in seconds.
- `prefers-reduced-motion: reduce` media query: disable your animations for users who need it — one block, big accessibility win.
- `object-fit: cover` makes images fill fixed-ratio boxes without distortion.
- Name classes by *purpose* (`.card`, `.btn-primary`), not appearance (`.big-blue-box`) — appearance changes, purpose doesn't.

### Common mistakes (the bad)

- **Div soup:** `<div>` for buttons, headings, and links. Kills keyboard access, screen readers, and SEO in one move. If it acts like a button, it must *be* a `<button>`.
- **`!important` wars:** each one forces the next override to be louder. Specificity debt compounds exactly like technical debt.
- **Fixed pixel widths on containers** (`width: 1200px`) — guaranteed horizontal scroll on small screens. Use `max-width` + fluid widths.
- **Missing `<meta name="viewport">`** — without it, mobile browsers render the desktop layout scaled down. One line, catastrophic if forgotten.
- **Rebuilding in JS what CSS does natively:** hover states, accordions, smooth scrolling, sticky headers — CSS handles these with less code and better performance.
- **Layout thrash:** reading layout (`offsetHeight`) then writing style in a loop forces the browser to re-layout every iteration. Batch reads, then batch writes.
- **Click handlers on non-focusable elements:** `<div onclick>` is invisible to keyboard and screen-reader users. Use real interactive elements.

### Best practices (the good)

- Write semantic HTML first, then style it — structure before paint.
- Keep specificity flat: prefer classes, avoid ID selectors and deep nesting (`.card .title` beats `div#app > section ul li span`).
- Design mobile-first; enhance upward. It's easier to add than to subtract.
- Every image gets `alt` (meaningful) or `alt=""` (decorative) — no exceptions.
- Validate your HTML early (validator.w3.org); malformed markup causes the weirdest cross-browser bugs.
- Separate concerns: HTML for structure, CSS for presentation, JS for behavior. When they tangle, everything becomes harder to change.

### 🤖 Build rules

1. MUST use semantic landmarks (`header`, `nav`, `main`, `footer`) on every page — no landmark-less div shells.
2. MUST include `<meta name="viewport" content="width=device-width, initial-scale=1">` in every HTML document.
3. MUST make every interactive element keyboard-reachable and operable (real `<button>`/`<a>`, visible focus styles).
4. NEVER use `!important` except in utility classes; fix specificity at the source instead.
5. MUST use event delegation for any list whose items are added/removed dynamically.
6. SHOULD prefer CSS over JavaScript for visual state (hover, transitions, sticky, accordions).
7. MUST NOT set fixed pixel widths on page-level containers; use `max-width` with fluid widths.
8. MUST give every `<img>` an `alt` attribute (or empty `alt=""` for decorative images).

---

## 2.2 Modern frontend

### Core concepts

- **The React mental model: UI = f(state).** Describe what the UI *should look like* for a given state; React reconciles the DOM to match. Think "this state produces this screen," not "click → update these three elements."
- **Components, props, state:** components are functions of props; props flow *down* and are read-only; state is private, mutable memory owned by one component. Data flows one way — down. Events flow up via callbacks. This unidirectional flow is what keeps large UIs debuggable.
- **Hooks are stateful functions:** `useState` (component memory), `useEffect` (sync with *outside systems* — not a general "do stuff" hook), `useMemo`/`useCallback` (skip expensive recomputation), `useRef` (mutable box that never re-renders — DOM nodes, timers).
- **Reconciliation:** React diffs the new virtual tree against the old and patches only what changed. Keys tell React *which* item is which — wrong keys attach state to the wrong rows.
- **Next.js rendering models — pick deliberately:** SSG (build-time HTML — blogs, docs), SSR (per-request — personalized pages), ISR (SSG that revalidates), RSC / Server Components (render on server, ship zero JS — your default). Client Components are the exception, for interactivity only.
- **Core Web Vitals — the three numbers Google grades you on:** LCP (Largest Contentful Paint — how fast the main content appears; target < 2.5s), INP (Interaction to Next Paint — how fast the page *responds* to input; target < 200ms), CLS (Cumulative Layout Shift — how much the page jumps around; target < 0.1). They are ranking signals and user-experience signals at once.
- **Accessibility essentials:** semantic HTML (free), keyboard operability (Tab order must make sense, everything reachable), visible focus indicators, sufficient color contrast (4.5:1 for text), labels on every input, `aria-*` attributes only to *fill gaps* semantics can't express.

### Techniques & methods

- **State colocation:** keep state as close as possible to where it's used. Lift state up only when two components genuinely need the same data. Most "global state" problems are colocation failures.
- **Composition over prop drilling:** pass components as `children` or slots instead of threading props through five layers. Context is for truly global, rarely-changing data (theme, auth user) — not as a junk drawer.
- **Custom hooks:** extract reusable stateful logic (`useDebounce`, `useLocalStorage`, `useFetch`) — the unit of reuse in React is the hook, not the HOC.
- **Next.js App Router patterns:** `loading.tsx`/`error.tsx` for route-level states, `generateMetadata` for SEO, route groups for organization without URL impact, server actions for mutations without building a separate API.
- **Streaming with Suspense:** wrap slow sections in `<Suspense fallback>` so the rest of the page renders immediately — perceived performance beats actual performance.
- **Code splitting by route:** each page loads only its own JS. Frameworks do this automatically *if* you don't import the world into a shared bundle.
- **Image discipline:** `next/image` (or equivalent) — automatic resizing, modern formats, lazy loading, and reserved dimensions that prevent layout shift.
- **A11y techniques:** skip-to-content links, focus management on route change in SPAs (move focus to the new heading), `aria-live` regions for async updates (form errors, toasts), `prefers-reduced-motion` respected everywhere.

### Tips & tricks

- React DevTools Profiler shows *which* components re-rendered and why — profile before you memoize anything.
- `useMemo`/`useCallback` without a measured problem just add code. Memoization is an optimization with its own cost.
- Stable, unique keys (database IDs) for list items; index-as-key is only safe for static, never-reordered lists.
- In Next.js, fetch data in Server Components and pass it down — one request on the server beats a client-side waterfall of three.
- `font-display: swap` (or Next.js font optimization) prevents invisible text while webfonts load.
- Keep a `components/` folder flat until it hurts; premature folder taxonomies slow everyone down.

### Common mistakes (the bad)

- **Effects as event handlers:** fetching or mutating inside `useEffect` when it should happen in response to an event creates waterfalls, double-fires (StrictMode), and race conditions. Effects synchronize with *external systems*; events respond to *users*.
- **Storing derivable data in state:** `const [fullName, setFullName] = useState()` next to `firstName`/`lastName` — now two sources of truth that drift. Compute during render instead.
- **Index as key in dynamic lists:** reorder or filter the list and React attaches state/DOM to the wrong items. Classic source of "my checkbox checked the wrong row."
- **Hydration mismatch:** server renders one HTML, client renders another (dates, random values, `window` usage during SSR) — React throws away the server HTML and re-renders, killing your SSR performance win.
- **`<div onClick>` instead of `<button>`:** breaks keyboard, screen readers, and built-in button behaviors. Every time.
- **Unsized images:** no width/height → the page jumps when they load → CLS penalty and a janky feel.
- **Prop drilling through six layers** instead of composing or colocating — the component tree becomes unchangeable.

### Best practices (the good)

- Derive state during render; sync with effects only to external systems; handle user actions in event handlers. Three buckets, no mixing.
- Server Components by default; `"use client"` only where interactivity genuinely lives. Less client JS is almost always faster.
- Measure with Lighthouse/WebPageTest *before* optimizing — fix the biggest bar first, usually images or third-party scripts.
- Keyboard-first development: if you can use the whole app without a mouse, screen-reader users are 80% covered.
- Colocate data fetching with the component that needs the data; avoid global fetch waterfalls.

### 🤖 Build rules

1. MUST NOT fetch data in chained `useEffect` calls when Server Components, loaders, or route-level data fetching exist — fetch at the route/server level.
2. MUST use stable unique IDs (never array indexes) as React keys for dynamic or reorderable lists.
3. MUST reserve dimensions (width/height or aspect-ratio) for every image to prevent layout shift.
4. MUST use real `<button>`/`<a>`/`<input>` elements for interactive controls — NEVER `<div onClick>`.
5. MUST keep `"use client"` boundaries as small as possible; default to Server Components in Next.js.
6. SHOULD compute derived values during render instead of storing them in state.
7. MUST ensure every page is fully keyboard-navigable with visible focus indicators.
8. MUST NOT read `window`/`document` during server rendering — guard client-only code or move it into effects/event handlers.
---

## 2.3 Backend engineering

### Core concepts

- **Node.js event loop: single thread, non-blocking I/O.** One thread runs your JS; slow operations (DB, network, disk) offload and resume via callbacks/promises. Thousands of concurrent connections on modest hardware — *as long as you never block the thread*.
- **Express middleware pipeline:** a request passes through a chain — `request → middleware → … → route handler → response`. Order matters: logging → security headers → body parsing → auth → routes → 404 → error handler. Every cross-cutting concern (auth, validation, rate limiting) is just a function in this chain — Stanford CS142 builds its backend exactly this way on Node.js.
- **REST, done right:** resources are nouns (`/orders`), verbs are HTTP methods (GET/POST/PUT/PATCH/DELETE), responses carry proper status codes, and the API is stateless — every request carries its own auth. REST's power is its constraints: uniform interface, cacheability, statelessness.
- **GraphQL basics:** one endpoint, client asks for exactly the fields it needs (kills over- and under-fetching), schema + resolvers define the graph. Trade-off: caching and rate-limiting are harder than REST, and naive resolvers create N+1 query storms.
- **Auth, three models:** **Sessions** — server stores state, client holds an opaque cookie ID; instant revocation, needs server storage. **JWT** — self-contained signed token; stateless and scalable, but revocation is hard (short lifetimes + rotation required). **OAuth2/OIDC** — delegated auth ("log in with Google"); authorization-code flow with PKCE is the modern standard for SPAs and mobile.
- **Validation is a security boundary, not a UX nicety.** Frontend validation is for user experience; backend validation is for survival. Everything crossing the network is attacker-controlled until proven otherwise.
- **Error handling, two kinds:** operational errors (DB down, invalid input — expected, handle gracefully) vs. programmer errors (bugs — crash loudly, fix the code). Mixing them up means either swallowing bugs or crashing on bad input.

### Techniques & methods

- **Middleware ordering template:** `helmet()` → `cors()` → `express.json()` → request logging → rate limiter → auth → routes → 404 handler → centralized error handler. Get this order wrong and auth runs after your routes, or errors bypass your formatter.
- **REST conventions that scale:** plural nouns, `GET /orders?status=paid&sort=-created&page[cursor]=…`, proper codes (200/201/204, 400/401/403/404/409/422/429/500), cursor-based pagination for feeds (offset breaks under inserts), `ETag`/`If-None-Match` for conditional requests, idempotency keys on `POST` so retries don't double-create.
- **Schema validation at the boundary:** validate every request body/query with a schema (zod, Joi) *before* business logic runs. Reject with 422 + a machine-readable error shape: `{ code, message, details[] }`.
- **Password storage:** Argon2 (first choice) or bcrypt (cost factor ≥ 12). Never MD5/SHA — they're fast, which is exactly what you *don't* want for password hashing.
- **Token strategy that works:** short-lived access JWT (5–15 min) + rotating refresh token in `httpOnly; Secure; SameSite=Lax` cookie. Rotation detects theft (reuse of an old refresh token = compromise signal).
- **OAuth2/OIDC login flow:** redirect to provider → authorization code → server exchanges code (+ PKCE verifier) for tokens → create your own session. Your server holds the secrets; the browser never does.
- **Centralized error middleware:** one function formats all errors into the same JSON shape, logs with a correlation/request ID, hides internals in production. Controllers throw; middleware translates.
- **Authorization, not just authentication:** knowing *who* (authN) is step one; checking *whether they may* (authZ) on every route — "does this user own this resource?" — is where most breaches live.

### Tips & tricks

- Put a request ID on every request (`X-Request-Id`) and include it in every log line — debugging distributed issues without it is archaeology.
- Rate-limit auth endpoints aggressively (login, password reset, OTP) — they're the front door attackers knock on.
- Graceful shutdown: stop accepting connections, drain in-flight requests, then exit. Deployments shouldn't drop users mid-checkout.
- Health-check endpoints (`/healthz`) separate from business routes — load balancers and orchestrators need them.
- Keep controllers thin: HTTP in/out at the edge, business logic in services, data in repositories. You'll thank yourself at 50 routes.

### Common mistakes (the bad)

- **JWT in `localStorage`:** any XSS vulnerability hands attackers your tokens. `httpOnly` cookies aren't reachable from JS — use them for anything sensitive.
- **Rolling your own crypto or auth protocol:** you will get it wrong. Use vetted libraries (OAuth providers, argon2, `jsonwebtoken` correctly) — this is settled science.
- **Blocking the event loop:** `bcrypt.hashSync` or giant JSON parsing inside a request handler freezes *every* connection on that process. Async versions or worker threads for CPU-heavy work.
- **N+1 queries:** one query for the list + one per item. Fine at 10 rows, fatal at 10,000. Solve with joins, eager loading, or DataLoader-style batching (GraphQL resolvers are the classic crime scene).
- **Trusting client-supplied IDs for authorization:** `GET /invoices/123` where 123 belongs to another user (IDOR). Every data access must re-check ownership — *every single one*.
- **Leaking internals:** stack traces, SQL errors, or `err.message` from the DB driver in API responses hand attackers a map of your system.
- **Sessions/cookies without flags:** missing `Secure`, `HttpOnly`, or `SameSite` turns cookies into low-hanging fruit for XSS and CSRF.

### Best practices (the good)

- Validate at the boundary, authorize on every route, fail closed (deny unless explicitly allowed).
- Authenticate first, then authorize — and never confuse the two.
- Log structured events with correlation IDs; never log passwords, tokens, or PII.
- Version your API (`/v1/`) from day one — you *will* need to change it without breaking existing clients.
- Prefer boring, standard solutions for auth, crypto, and validation — novelty here is risk.
- Document the API as you build it (OpenAPI); the next developer — or your future self — needs it.

### 🤖 Build rules

1. MUST validate every request input server-side with a schema — NEVER rely on frontend validation alone.
2. MUST hash passwords with Argon2 or bcrypt (cost ≥ 12) — NEVER MD5/SHA/custom hashing.
3. NEVER store tokens or session IDs in `localStorage`/`sessionStorage` — use `httpOnly; Secure; SameSite` cookies.
4. MUST re-check resource ownership (authorization) on every data-accessing endpoint — no IDOR by design.
5. MUST return a single consistent error shape `{ code, message, details }` and NEVER leak stack traces or DB errors in production responses.
6. MUST place auth middleware before routes and the error handler last in the Express pipeline.
7. SHOULD use cursor-based pagination (not offset) for any feed that grows or reorders.
8. MUST set `Secure`, `HttpOnly`, and `SameSite` flags on all auth cookies.
9. SHOULD attach idempotency keys to all mutating endpoints so safe retries never double-apply.

---

## 2.4 SaaS engineering specifics

### Core concepts

- **Multi-tenancy models — pick deliberately:** *Silo* (DB per tenant — strongest isolation, highest ops cost), *Pool* (shared DB, `tenant_id` per row — cheapest, one missed filter from a cross-tenant leak), *Bridge* (separate schemas, shared DB). Most SaaS starts with pool. The model is a business decision disguised as technical: it sets your blast radius.
- **Subscriptions & billing, Stripe-style:** Checkout → Customer → Subscription → Invoices → Payment attempts. Plans define *what* (features, seats, meters); subscriptions define *who pays for what, when*. Trials, proration, metered billing, and dunning (failed-payment retries) are where the real complexity lives — not the happy path.
- **Webhooks are untrusted input.** Providers notify you of events via HTTP callbacks anyone can forge — signature verification is the *only* thing separating real events from fake ones.
- **Idempotency: exactly-once effects from at-least-once delivery.** Webhooks retry; users double-click; networks duplicate. Design every mutating handler so repeating it is harmless: idempotency keys, "already processed" event logs, database uniqueness constraints as backstops.
- **Transactional email is infrastructure, not marketing.** Password resets, receipts, invites — these must deliver reliably and fast, on a separate domain/subdomain and provider configuration from marketing blasts (one spam complaint shouldn't sink your login emails).
- **Feature flags decouple deploy from release.** Ship code dark, then roll out to 1% → 10% → 100%, target by tenant/plan, and kill-switch instantly when something breaks. Flags turn releases from big-bang gambles into dials.
- **The 12-factor app methodology** (the SaaS deployment canon): one codebase per deploy, explicit dependencies, config in the environment, backing services as attached resources, build/release/run separated, stateless processes, port binding, concurrency via processes, disposability (fast startup/graceful shutdown), dev/prod parity, logs as event streams, admin tasks as one-off processes. Violate these and every deploy and scale-up hurts more than it should.

### Techniques & methods

- **Tenant resolution + enforcement, in one place:** resolve the tenant from subdomain, header, or JWT claim in middleware; enforce with an ORM plugin/scope or Postgres Row-Level Security — never by remembering to add `where tenant_id` in each query. One enforcement point, zero exceptions.
- **Stripe webhook handler pattern:** verify signature (raw body required — parse JSON *after* verifying) → check event ID against a processed-events table → route by event type → update subscription state idempotently → return 200 fast (queue slow work). Stripe CLI (`stripe listen`) for local testing.
- **Dunning without drama:** on payment failure, keep service running through smart retries, email the customer with a self-serve update link, and only restrict access after the retry window — involuntary churn from clumsy dunning is lost revenue.
- **Flag evaluation with context:** `if (flags.newCheckout(user.tenantId, user.plan))` — flags keyed on tenant, plan, or percentage. Keep flag definitions in one config; never hardcode rollout logic in business code.
- **12-factor config:** everything that varies between deploys (API keys, DB URLs, feature defaults) comes from environment variables. Same container image runs in dev, staging, prod — only the env changes.
- **Outbox pattern for side effects:** write the business change *and* the "send webhook/email" intent in one DB transaction; a background worker delivers the intent. No more "charged but no email sent" inconsistencies.

### Tips & tricks

- Store the provider's `customer_id` and `subscription_id` on your tenant record — you'll need them for support, migrations, and debugging constantly.
- Test the *unhappy* billing paths first: card declined, trial expired, mid-cycle downgrade, webhook delivered twice, webhook delivered out of order.
- Give transactional email its own subdomain (`mail.yourapp.com`) and dedicated sending reputation from day one.
- Name feature flags like `checkout_v2_rollout` with an owner and expiry date — flag graveyards (hundreds of dead flags) are real tech debt.
- Keep a `processed_webhook_events` table with a unique constraint on event ID — the database becomes your idempotency backstop.

### Common mistakes (the bad)

- **The missing tenant filter:** one endpoint, one report query, one admin export without `tenant_id` scoping — and Customer A sees Customer B's data. This is the classic SaaS-killer bug: silent, severe, and discovered by a customer, not by you.
- **Trusting webhook payloads without signature verification:** anyone can forge a "payment succeeded" POST. Unsigned webhooks are remote code execution on your billing.
- **Non-idempotent webhook handlers:** retried `invoice.paid` events that grant the subscription twice, send two welcome emails, or double-count usage. Providers *will* retry.
- **Deploy = release:** shipping a risky change to 100% of tenants with no flag, no gradual rollout, no kill switch. When it breaks, it breaks for everyone simultaneously.
- **Secrets in code or committed `.env` files:** one leaked repo, one compromised laptop, and your Stripe keys are public. Env vars + a secrets manager, always.
- **Trial design that teaches nothing:** no card + no usage tracking + no conversion funnel = you learn nothing about why trials don't convert.
- **Treating email as fire-and-forget:** no delivery tracking, no bounce handling, marketing and transactional sharing one domain — then wondering why password resets land in spam.

### Best practices (the good)

- Defense in depth for tenancy: middleware scoping *plus* database-level enforcement (RLS). Two layers, because one will eventually have a hole.
- Idempotency keys on every mutating endpoint and webhook handler — assume every request arrives twice.
- Verify-then-act on all webhooks: signature first, dedupe second, business logic third, 200 fast.
- Flag every risky release; keep flags short-lived and owned.
- Follow 12-factor strictly enough that any developer can go from clone to running app without tribal knowledge.
- Track the billing funnel like a product metric: trial started → activated → converted → retained. Billing bugs are revenue bugs.

### 🤖 Build rules

1. MUST scope every database query by tenant — enforce it in middleware/ORM/RLS, NEVER by remembering per-query.
2. MUST verify webhook signatures with the provider's secret on the raw request body — NEVER trust an unsigned payload.
3. MUST make every webhook handler idempotent (processed-event log + unique constraints) — assume duplicate and out-of-order delivery.
4. NEVER commit secrets, API keys, or `.env` files — config comes from the environment only (12-factor III).
5. MUST put every risky release behind a feature flag with a kill switch — NEVER big-bang a breaking change to all tenants.
6. MUST use separate domains/configs for transactional vs. marketing email.
7. SHOULD implement the outbox pattern for billing side effects (charge + notify in one transaction).
8. MUST store provider customer/subscription IDs on the tenant record from day one.

---

## 2.5 Web performance & SEO fundamentals

### Core concepts

- **Caching is a hierarchy:** browser cache → CDN edge → server cache (Redis) → database query cache. Each layer you skip is latency and money paid on every request. Harvard's CS50 Web dedicates its final lecture to exactly this: caching, load balancing, scaling databases.
- **Cache-Control is the language:** `public, max-age=31536000, immutable` for hashed static assets (cache a year, never revalidate); `no-cache` (revalidate every time) for HTML shells; `stale-while-revalidate` for "serve instantly, refresh in background." Wrong headers mean either stale content or zero caching — both are bugs.
- **CDN: your server is far away from most users.** A CDN caches static assets (and increasingly dynamic content) at edge locations worldwide, terminates TLS closer to the user, and absorbs traffic spikes. For a global SaaS, no CDN means every user pays intercontinental latency on every asset.
- **Image optimization — the biggest lever on most pages:** modern formats (AVIF → WebP → JPEG), responsive sizing (`srcset`/`sizes` — never ship a 2400px hero to a 360px phone), lazy loading below the fold, explicit dimensions to prevent layout shift. Images are routinely 50–70% of page weight.
- **Lazy loading, applied broadly:** `loading="lazy"` on images/iframes, route-based code splitting in JS bundles, and deferring anything below the fold. Load what the user sees *now*; everything else on demand.
- **SEO basics that actually matter:** crawlability (sitemap.xml, robots.txt, no JS-only critical content), one `<title>` + meta description per page, ordered semantic headings, Open Graph tags, canonical URLs against duplicates, HTTPS everywhere, Core Web Vitals as a ranking signal.

### Techniques & methods

- **Cache busting with hashed filenames:** `app.a3f9c1.js` — content hash in the name means you can cache forever and *never* serve stale code; deploys just reference new filenames.
- **`stale-while-revalidate` pattern:** serve the cached response instantly, refresh it in the background. Users get speed; content stays fresh. Ideal for semi-dynamic pages.
- **Responsive images done right:** `<img srcset="small.jpg 480w, large.jpg 1200w" sizes="(max-width: 600px) 480px, 1200w" src="large.jpg" alt="…">` — the browser picks the right file. Pair with `width`/`height` attributes to reserve space.
- **Resource hints:** `preconnect` to critical third-party origins (fonts, APIs), `preload` for the hero image/font, `prefetch`/`prerender` for likely-next navigation. Hints are cheap; misused hints waste bandwidth — measure.
- **Critical rendering path discipline:** inline critical CSS, defer non-critical JS (`defer`/`async`), keep third-party scripts minimal and async — every render-blocking resource delays first paint.
- **Structured data (JSON-LD):** machine-readable page meaning (Product, Article, FAQ) that powers rich search results. Small effort, visible SERP payoff.
- **SSR/ISR for SEO-critical pages:** search crawlers have gotten better at JS, but server-rendered HTML is still the most reliable way to be indexed correctly and fast.

### Tips & tricks

- `fetchpriority="high"` on the hero/LCP image tells the browser what matters most — one attribute, measurable LCP gain.
- Convert images to AVIF with a WebP/JPEG fallback; then compress SVGs (they're text — they minify).
- Measure *field* data (Chrome UX Report / real-user monitoring), not just lab Lighthouse scores — lab numbers lie about real networks and devices.
- `decoding="async"` on images lets the browser decode off the main thread.
- Audit third-party scripts quarterly: tag managers, chat widgets, and analytics snippets accrete silently and each one taxes every page load.

### Common mistakes (the bad)

- **No cache headers at all:** every asset returns 200 on every visit. You're paying full bandwidth and full latency for content that never changes.
- **Giant unoptimized hero images:** a 4MB PNG above the fold single-handedly destroys LCP. The most common performance bug on the web.
- **Lazy-loading without dimensions:** images pop in and shove content down — you traded bandwidth for CLS, which is worse.
- **JS-only critical content:** key text and links exist only after client-side rendering. Crawlers may miss it; users on slow devices stare at spinners.
- **Render-blocking third-party scripts in `<head>`:** one slow ad/analytics server delays your entire page. Async or it doesn't ship.
- **Optimizing before measuring:** compressing images when the actual bottleneck is a 2MB JS bundle. Profile first — the biggest bar wins.
- **Duplicate content without canonicals:** `?utm_source` variants, www vs non-www, trailing slashes — search engines split your ranking across duplicates.

### Best practices (the good)

- Cache aggressively, invalidate precisely: immutable hashed assets, short TTLs on HTML, versioned APIs.
- Images: right format, right size, lazy below the fold, dimensions always reserved.
- Semantic HTML + disciplined meta tags (title, description, OG, canonical) on every public page — SEO is mostly hygiene, not tricks.
- Budgets over vibes: set performance budgets (e.g., < 200KB JS, LCP < 2.5s) and fail the build when they're breached.
- Measure → fix → measure: field data first, lab data for iteration, and re-check after every major change.

### 🤖 Build rules

1. MUST set long-lived immutable `Cache-Control` on hashed static assets and short/revalidated caching on HTML.
2. MUST lazy-load all below-the-fold images and iframes (`loading="lazy"`).
3. MUST reserve width/height (or aspect-ratio) on every image to prevent layout shift.
4. MUST serve modern image formats (AVIF/WebP with fallback) and responsive `srcset` sizes — NEVER ship a multi-MB hero image.
5. MUST include a unique `<title>`, meta description, OG tags, and canonical URL on every public page.
6. MUST keep critical content server-rendered (or pre-rendered) — NEVER rely solely on client-side JS for SEO-critical text.
7. MUST load third-party scripts with `async`/`defer` — NEVER render-blocking in `<head>`.
8. SHOULD set and enforce performance budgets (JS size, LCP/INP/CLS) in CI before shipping.


---

# Part 3: Mobile — Android, iOS & Cross-Platform

*Research grounding: Stanford's CS193P (Developing Applications for iOS — SwiftUI, MVVM, Model/UI separation, data flow, persistence, concurrency), Harvard's CS50 Mobile App Development with React Native (components, navigation, state, API fetching, local storage, native device features), MIT's Mobile Application Experiences (research → design → usability → implementation → field evaluation), Apple's Human Interface Guidelines (Clarity, Deference, Depth, Consistency), and Google's official Guide to App Architecture (UI layer → ViewModel → Repository → data sources).*

---

## 3.1 Android, Deep

### Core concepts

- **Kotlin is the language.** Null safety is built into the type system (`String?` vs `String`) — the billion-dollar mistake is a compile-time problem now, not a crash report. Coroutines replace callbacks for async work. Data classes, sealed classes, and extension functions are the everyday vocabulary.
- **Jetpack Compose is the UI toolkit.** Declarative: you describe what the UI should look like for a given state, and Compose recomposes when state changes. There is no `findViewById`, no XML layouts for new code. State hoisting — pushing state up and events down — is the core discipline.
- **Official app architecture (Google's Guide to App Architecture):** UI layer (composables + ViewModel holding UI state) → domain layer (optional, use cases) → data layer (repositories abstracting data sources: network, Room database, DataStore). Each layer has one job and depends only downward.
- **Lifecycle awareness.** Activities and Fragments have lifecycles (created → started → resumed → paused → stopped → destroyed). The OS can kill your process at any time when it's in the background. Everything you build must assume death and resurrection.
- **Gradle build system.** Build types (`debug`/`release`) and product flavors (free/paid, dev/staging/prod) let one codebase produce many app variants. The build is code — treat it like source.

### Techniques & methods

- **MVVM with UiState:** the ViewModel exposes one immutable `UiState` data class via `StateFlow`. The composable renders it. User actions become events sent up. One state object = one render = no half-updated screens.
- **Repository pattern:** a `UserRepository` exposes `Flow<User>` and `suspend fun refresh()`. The ViewModel never knows whether data came from Room, Retrofit, or both. Repositories decide cache-vs-network policy in one place.
- **Room database:** entities are `@Entity` data classes, DAOs are interfaces with `@Query` methods verified at compile time. Write migrations for every schema change — Room will crash the app on upgrade if the schema changed without one (unless you opt into destructive fallback, which wipes user data).
- **WorkManager for background work:** deferrable, guaranteed work (sync, uploads, log shipping). Declare constraints (network type, charging, battery-not-low), chain work with `WorkContinuation`, use `PeriodicWorkRequest` with a minimum 15-minute interval. The OS batches and optimizes it — that's the point.
- **Navigation Compose:** type-safe routes with serializable destinations, a single back stack, deep-link support per destination. One activity hosting the whole nav graph is the modern standard.
- **Hilt for dependency injection:** `@Singleton` for app-wide (repositories, Retrofit), `@ViewModelScoped`/`@ActivityRetainedScoped` where lifetimes demand it. Constructor injection keeps classes testable without the framework.
- **Coroutines, structured:** `viewModelScope` for UI work, `Dispatchers.IO` for disk/network. A coroutine that outlives its scope is a leak — structured concurrency makes leaks structurally impossible when you follow it.
- **Paging 3:** for lists larger than memory. Loads pages from Room/network as the user scrolls, handles refresh, retry, and placeholders.

### Tips & tricks

- Collect flows with `collectAsStateWithLifecycle()`, not `collectAsState()` — the latter keeps collecting (and burning battery) when the UI isn't visible.
- `remember` survives recomposition; `rememberSaveable` survives process death too. Use `rememberSaveable` for anything the user typed.
- Slow cold start? Generate a Baseline Profile — it routinely cuts startup 20–30% by pre-compiling hot paths.
- Make `UiState` use immutable collections (`ImmutableList`) — Compose then skips recomposition for unchanged items.
- Use the Layout Inspector to debug Compose hierarchies; `println` debugging of recomposition is guesswork.
- R8 full-mode + resource shrinking in release builds. With reflection/serialization (Moshi/Gson), write explicit `-keep` rules — over-shrinking causes silent release-only crashes.

### Common mistakes (the bad)

- **Network or database calls on the main thread.** The UI freezes, the OS shows an ANR (Application Not Responding) dialog, users uninstall. StrictMode in debug builds catches this early — turn it on.
- **Leaking Activity context** into ViewModels, singletons, or static fields. The whole activity (and its view tree) can never be garbage collected. Pass `Application` context or, better, don't pass context at all.
- **Ignoring process death.** You test with the app in the foreground; the OS kills it in the background; the user returns to a crash or a blank screen. Test with "Don't keep activities" enabled in developer options.
- **Heavy work inside composables.** Recomposition can run far more often than you expect. A database query or JSON parse inside a composable body will run on every recomposition — hoist it into the ViewModel.
- **Room schema change without migration.** App update → `IllegalStateException: A migration is required` → crash on launch for every existing user. The single most embarrassing release bug in Android.
- **WorkManager without constraints.** Scheduling aggressive periodic work with no network/charging constraints drains batteries, and the OS (Doze mode) will throttle or kill it anyway — design with the OS, not against it.

### Best practices (the good)

- **Single-activity architecture** with Navigation Compose. Fragments as screens is the old world; one activity + composable destinations is simpler to reason about and test.
- **Unidirectional data flow, always:** state flows down, events flow up. If a composable mutates shared state directly, you've built a bug factory.
- **Offline-first by default:** Room is the source of truth; the repository syncs with the network in the background. The app works in elevators, tunnels, and rural networks.
- **Request permissions at the point of need**, with a sentence explaining why. A camera permission requested at first launch with no context gets denied permanently.
- **Test ViewModels as pure logic** with the Turbine library and test dispatchers — no Android framework needed. If your ViewModel is hard to test, your architecture is wrong.

### 🤖 Build rules

1. MUST use Kotlin + Jetpack Compose for all new UI. NEVER start new screens in XML Views.
2. MUST implement MVVM: ViewModel exposes immutable `UiState` via `StateFlow`; composables NEVER call repositories, Retrofit, or Room directly.
3. MUST run all disk and network I/O on `Dispatchers.IO` (or an injected IO dispatcher). NEVER block the main thread.
4. MUST persist structured data with Room, with a tested migration for every schema change. NEVER use raw `SQLiteOpenHelper` or `SharedPreferences` for relational data.
5. MUST use WorkManager for deferrable background work. NEVER use `AlarmManager`, raw threads, or foreground services for work that can wait.
6. MUST survive process death: `rememberSaveable` for UI state, `SavedStateHandle` in ViewModels, Room for data.
7. SHOULD use Hilt for dependency injection. NEVER pass an Activity `Context` into a ViewModel or singleton.
8. NEVER launch a coroutine in `GlobalScope`. Every coroutine MUST be tied to a lifecycle-aware scope (`viewModelScope`, `lifecycleScope`).

---

## 3.2 iOS, Deep

### Core concepts

- **Swift fundamentals.** Optionals (`String?`) force you to handle absence explicitly. Value types (`struct`, `enum`) are copied; reference types (`class`, `actor`) are shared. CS193P's rule of thumb: default to structs, reach for classes only when you need identity — shared, mutable, long-lived things.
- **SwiftUI is declarative.** Views are lightweight structs describing UI, not objects holding it. The framework diffs and updates the real UI. State drives everything: `@State` (private view state), `@Binding` (shared with a child), `@Observable` (shared model objects), `@Environment` (dependency injection).
- **MVVM, the CS193P way.** The Model is UI-independent logic and data — it must not import SwiftUI. The ViewModel (an `@Observable` class) adapts the Model for a specific View. The View is a pure function of the ViewModel's published state. This separation is the single most important architectural idea in the course.
- **App lifecycle.** iOS apps move through `scenePhase`: `.active` → `.inactive` → `.background`. The OS can terminate a backgrounded app without warning. Unsaved state must be persisted on backgrounding, not "later."
- **Apple's Human Interface Guidelines (HIG).** Four pillars: **Clarity** (legible, precise, instantly understandable), **Deference** (the UI serves the content, never competes with it), **Depth** (layers and motion convey hierarchy), and **Consistency** (use platform conventions so the app feels instantly familiar). Reviewers and users both punish apps that ignore these.

### Techniques & methods

- **Data flow done right:** `@State` for state a view owns; `@Binding` to let children mutate the parent's state; `@Observable` + `@Environment` for app-wide model objects. One source of truth per datum — everything else is derived. CS193P demonstrates tracing data from Model through one View into another precisely because getting this wrong is the #1 source of SwiftUI bugs.
- **SwiftData for persistence.** `@Model` classes, `@Query` in views, automatic CloudKit sync if enabled. Reach for Core Data only when you need custom merge policies or complex object graphs — SwiftData covers the common cases with far less code.
- **NavigationStack with value-based navigation.** Push `Hashable` values, not view instances. Deep links and state restoration become data problems, not view-controller archaeology.
- **Swift concurrency:** `async`/`await` instead of completion handlers, `actor` for shared mutable state, `@MainActor` for anything touching UI. The compiler now catches data races — let it.
- **`.task` modifier** for async work tied to a view's lifetime: it launches when the view appears and cancels automatically when it disappears. This replaces a whole class of manual cancellation bugs.
- **TestFlight:** internal testing (up to 100 team members, no review) for daily builds; external testing (up to 10,000 users, light Apple review) for beta. Every release should bake in external TestFlight first.
- **App Store review rules that actually reject apps:** crashes on launch, placeholder or demo content, misleading metadata/screenshots, broken links (privacy policy, support URL), and — the big one — digital goods sold outside In-App Purchase. Read the guidelines before you architect payments, not after.

### Tips & tricks

- **Preview-driven development:** write `#Preview` for every view and build UI without launching the simulator. It's the fastest feedback loop in iOS development.
- **Prefer `guard let` early-returns** over nested `if let` pyramids. Flat code is readable code.
- **Use Instruments (Leaks + Allocations),** not vibes, for memory issues. SwiftUI's declarative model hides retain cycles well — a closure capturing `self` strongly in a long-lived object is still the classic leak.
- **Semantic colors and Dynamic Type styles** (`.primary`, `.headline`, `.body`) instead of hardcoded values — you get dark mode and accessibility text sizing nearly free.
- **SF Symbols** for icons: thousands of consistent, weight-matching symbols that automatically adapt to Dynamic Type and rendering modes. Custom icons should be the exception.

### Common mistakes (the bad)

- **Massive View.** A 900-line `body` with networking, formatting, and business logic inline. SwiftUI makes this easy to write and miserable to maintain — it's MVC's "massive view controller" reborn.
- **`@StateObject` vs `@ObservedObject` confusion.** Creating an owned object with `@ObservedObject` lets SwiftUI destroy and recreate it — state vanishes on redraw. Own it with `@State` (modern `@Observable`); only observe what someone else owns.
- **Force-unwrapping (`!`) in production paths.** Every `!` is a crash you've scheduled for a future date. It exists for prototyping and for invariants you can prove — treat it as a code smell in review.
- **Blocking the main actor.** Parsing a large JSON or resizing images inside a `@MainActor` function freezes the UI exactly like the main thread always has. Move it to a background task, then hop back.
- **Ignoring Dynamic Type and VoiceOver.** Fixed font sizes break for users with accessibility needs, earn 1-star reviews, and can trigger rejections. Supporting them is mostly free if you use system styles from the start — and brutally expensive to retrofit.
- **Hardcoded colors.** Your lovingly crafted light-mode palette becomes unreadable garbage in dark mode. Use asset catalog colors with light/dark variants or semantic system colors.

### Best practices (the good)

- **The Model knows nothing about the UI** (CS193P's prime directive). If your model imports SwiftUI, the architecture has failed. This single rule makes models testable, portable, and stable while UI churns.
- **Derive, don't duplicate.** If a value can be computed from existing state, compute it. Duplicated state drifts out of sync — that's where "the UI shows the wrong thing" bugs are born.
- **Design for the lifecycle:** save on `.background`, restore on launch, handle interrupted tasks (a phone call mid-upload) gracefully.
- **Accessibility from day one:** labels on interactive elements, sufficient contrast, Dynamic Type. It's a feature for millions, not a compliance checkbox.
- **Read the App Store Review Guidelines as a design document** before building commerce, subscriptions, or account flows. Architecture decisions made against the guidelines get rejected expensively late.

### 🤖 Build rules

1. MUST keep the Model UI-independent: plain Swift, zero SwiftUI imports. NEVER let views own business logic or networking.
2. MUST default to value types (`struct`/`enum`); use `class`/`actor` ONLY when shared identity or mutable shared state is genuinely required.
3. NEVER force-unwrap (`!`) in production code paths. Use `guard let` / `if let` / `map` / `??` with sensible defaults.
4. MUST isolate UI-touching code with `@MainActor`; MUST move heavy work (parsing, image processing, crypto) off the main actor with `async`/`await`.
5. MUST use semantic colors and Dynamic Type text styles. NEVER hardcode hex colors or fixed point sizes for UI text.
6. SHOULD use SwiftData for persistence; reach for Core Data ONLY when custom merge policies or complex graphs are required.
7. MUST persist unsaved user state on `scenePhase == .background`. NEVER assume the app will be gracefully terminated.
8. NEVER ship a release that hasn't been tested on a physical device AND baked in external TestFlight.

---
## 3.3 Cross-Platform, Honest

### Core concepts

- **Flutter (Google, Dart language):** compiles ahead-of-time to native ARM code and draws every pixel itself with its own rendering engine (Skia, now Impeller). It does *not* use the platform's native buttons and lists — it paints lookalikes. Result: pixel-identical UI on both platforms, one rendering pipeline to learn.
- **React Native (Meta, JavaScript/TypeScript):** renders *real* native components — an RN `<TextInput>` is a genuine `UITextField` on iOS and `EditText` on Android. JavaScript drives them through the bridge (legacy) or the New Architecture: Fabric renderer + TurboModules + the Hermes engine. Harvard's CS50 Mobile App Development with React Native teaches exactly this stack: JSX components, navigation, state/Context, API fetching, AsyncStorage, and native device features (camera, location, notifications).
- **The fundamental tradeoff:** Flutter owns the pixels (consistency, custom UI freedom) but not the platform widgets (it must re-implement every new OS control). React Native owns the platform widgets (native feel, day-one OS features) but pays a language-boundary tax on every native call.
- **Expo vs bare (React Native):** Expo's managed workflow gives you builds, OTA updates, and device testing without touching Xcode/Android Studio — until you need a native module Expo doesn't include, at which point you "eject" to the bare workflow and inherit the full native complexity you were avoiding.

### Techniques & methods

- **Flutter state management:** `Provider` for simple apps, `Riverpod` or `Bloc` as complexity grows. The rule is the same as native: lift state up, keep widgets pure functions of state. `flutter_bloc`'s event→state machine maps cleanly onto the MVVM thinking from 3.1/3.2.
- **Platform channels (Flutter) / TurboModules (RN):** the escape hatch to native code for anything the framework doesn't cover (Bluetooth, AR, background audio). Keep the interface narrow — a handful of well-typed methods, not a second app written in Kotlin/Swift.
- **Shared business logic:** validation rules, API clients, and data models can be shared 100%. Push everything platform-agnostic into a core package; keep only rendering and OS integration per-platform.
- **OTA updates:** Expo Updates and Shorebird (Flutter) push JS/Dart-bundle fixes without store review. Powerful — and a policy minefield if abused to dodge review (see 3.5).

### Tips & tricks

- **Prototype cross-platform, decide native later.** An MVP in Flutter or Expo validates the idea in weeks. Rewriting a validated product natively is a good problem to have.
- **On iOS, use Cupertino widgets (Flutter) or let RN render native controls** — iOS users detect non-native UI instantly and read it as "cheap." Match platform conventions per platform, even in shared code.
- **Keep a native escape budget:** if your feature list already includes two or more platform-channel/TurboModule integrations, price the project as a native project with a cross-platform UI — because that's what it is.
- **Hermes (RN) and AOT (Flutter)** both dramatically improve startup vs. old JIT/bridge setups. If you're reading pre-2022 benchmarks, they're obsolete.

### Common mistakes (the bad)

- **Choosing cross-platform for a deeply native app, then fighting the framework for a year.** Bluetooth LE peripherals, AR sessions, real-time audio processing, background location tracking — each one is a native project wearing a cross-platform costume. The framework doesn't eliminate native complexity; it relocates it to your thinnest, least-tested layer.
- **"Write once, test once."** You still test on real iOS *and* Android hardware. Layout, permissions, background behavior, and push all diverge. Teams that test on one platform ship bugs on the other.
- **Ignoring platform conventions.** Shipping Material Design widgets to iOS users (or vice versa) feels foreign. Users can't articulate why they distrust the app — they just do.
- **Dependency roulette (especially RN):** an unmaintained native module can block your Xcode/Android Studio upgrade for months. Pin versions, audit native dependencies like production code, prefer maintained libraries with TurboModule support.
- **Bundle bloat:** a "hello world" Flutter app ships megabytes of engine. For emerging markets on low-end devices and expensive data, that download size is a conversion killer.

### Best practices (the good)

- **Go native when:** the app needs sustained 60fps custom rendering (games, video editors), AR/VR, BLE hardware, real-time audio, or platform-first UX is the product's edge. Also when it's a long-lived flagship where you can afford two teams.
- **Go cross-platform when:** it's an MVP, a content-driven app (feeds, articles, catalogs), forms + lists + API calls (most SaaS, most internal tools), the team is small, or time-to-market beats pixel-perfection.
- **Hybrid strategy (used by serious teams):** cross-platform for the 80% of standard screens, native modules/screens for the 20% that's performance-critical or deeply integrated. Decide the boundary deliberately, not accidentally.
- **Hidden costs, stated plainly — Flutter:** larger app size; smaller Dart hiring pool; new OS controls arrive late (must be re-implemented); rendering-engine bugs are yours to wait out. **React Native:** the native-module layer needs real native engineers anyway; JS↔native performance cliffs on chatty interfaces; Expo eject is a one-way door in practice; dependency churn demands constant maintenance.

### 🤖 Build rules

1. MUST choose native when the app needs sustained custom rendering, AR, BLE, or background audio. NEVER fight the framework for a year to avoid learning Kotlin/Swift.
2. MUST respect platform UI conventions per platform (Cupertino on iOS, Material on Android). NEVER ship Android-styled UI to iOS users or vice versa.
3. MUST keep native bridge code (platform channels/TurboModules) minimal, typed, and versioned. NEVER put business logic in the bridge layer.
4. SHOULD prototype MVPs cross-platform for speed; MUST re-evaluate the native-vs-cross-platform decision with real data before scaling to a flagship product.
5. NEVER assume one test pass covers both platforms. MUST test on physical iOS AND Android devices, including low-end Android.
6. MUST pin and audit native dependencies; NEVER let an unmaintained bridge module block toolchain upgrades silently.

---

## 3.4 Mobile Hard Problems

### Core concepts

- **Offline-first:** the local database is the source of truth; the network is a sync channel, not a dependency. Writes complete locally and instantly; sync happens in the background. This is the opposite of "call the API and show a spinner" — and it's the difference between an app that works in the real world and one that works in the demo.
- **Sync & conflict resolution:** when two devices edit the same data offline, someone must decide what wins. Three strategies cover nearly everything: **Last-Write-Wins** (newest timestamp wins — simple, but silently discards legitimate concurrent edits), **field-level merge** (merge per-field so a phone editing "notes" and a laptop editing "dosage" both survive), and **CRDTs** (mathematically mergeable data structures — counters, sets, collaborative text — that converge without coordination, like Google Docs).
- **Push notifications:** APNs (iOS) and FCM (Android) deliver through OS-owned channels. Device tokens rotate and expire — your server must handle token lifecycle or pushes silently stop. iOS requires explicit user permission; Android 13+ does too.
- **Permissions UX:** both platforms use runtime permissions. Users decide in about two seconds, based entirely on context. A permission requested with no context is a permission denied — often permanently.
- **Battery & memory constraints:** Doze mode and App Standby throttle background work; the OS kills backgrounded apps under memory pressure without asking. Background execution is a privilege the OS grants, not a right your app has.
- **Deep linking:** custom URL schemes (any app can claim them — hijackable), Universal Links (iOS) / App Links (Android) (verified via a hosted association file — secure), and deferred deep links (survive install via the store, for referral flows).
- **Mobile security basics:** the device is hostile territory — rooted/jailbroken phones, repackaged APKs, proxy tools reading your traffic. Defense in depth: secure storage, transport security, certificate pinning for high-sensitivity apps.

### Techniques & methods

- **The write path, done right:** every user action writes to the local store first with an operation log (actor ID, logical/Lamport timestamp, payload). A sync engine pushes the log (delta sync — only what changed since last sync) and pulls server changes. Retries are idempotent because operations, not final states, are what's transmitted.
- **Merge policy per field, decided at design time:** counters → CRDT counters; sets → add-wins/remove-wins; collaborative text → CRDT/OT; plain fields → newest-wins or server-authoritative. Encode it in the schema, not in scattered `if` statements.
- **Timestamps:** never trust device clocks for ordering — use server-issued timestamps or hybrid logical clocks. Store the losing version (shadow copy) for audit and recovery; "last write wins" without an audit trail is data loss you can't even explain.
- **Push done properly:** silent pushes to refresh data in the background; visible pushes only for things the user asked to be told about. Notification Service Extensions (iOS) for rich media. Honor opt-out instantly and respect quiet hours — each unwanted push trains the user to disable your channel forever.
- **Permission priming:** show your own screen explaining the value ("We need location to show nearby stores") *before* the system dialog. If denied, deep-link the user to Settings with instructions — the system won't ask again.
- **Certificate pinning:** embed the expected server certificate/public key so a MITM proxy with a trusted-but-rogue CA can't read your traffic. Essential for finance/health; must ship with a backup pin and a rotation plan or a routine cert renewal becomes a self-inflicted outage.
- **Secure storage:** iOS Keychain / Android Keystore + EncryptedSharedPreferences for tokens and secrets. The Keystore holds keys in hardware when available — extraction requires breaking the device, not just reading a file.

### Tips & tricks

- **Test offline on real devices with throttled networks** (Network Link Conditioner on iOS, network throttling on Android) — airplane-mode toggling in the simulator misses the flaky-middle reality of 2G, captive portals, and half-open connections.
- **Exponential backoff with jitter** for sync retries. Ten thousand devices retrying every 30 seconds after an outage is a self-inflicted DDoS — jitter spreads the load.
- **Batch and compress** sync payloads. Radio wakeups are the dominant battery cost of networking — one 50KB request hourly beats fifty 1KB requests.
- **Log a sync journal** (what synced, when, conflicts resolved how). When a user reports "my data disappeared," this journal is the difference between a fix and a shrug.

### Common mistakes (the bad)

- **Offline as an afterthought.** Bolted on after launch, it produces months of data-loss bugs, duplicate records, and sync loops. Offline-first is an architecture decision made on day one or a rewrite on day three hundred.
- **Silent LWW on user-generated content.** Two legitimate edits, one timestamp each — the loser's work vanishes without a trace. Users experience this as "the app ate my data" and they are right.
- **Requesting all permissions at first launch.** The user has no context, denies everything, and your onboarding is dead. Each denial you could have avoided is a feature that never works.
- **Plaintext secrets.** Tokens in `SharedPreferences`, API keys in `UserDefaults`, secrets in a plist — readable by anyone with the device or the APK. This is found in real breach post-mortems, repeatedly.
- **Pinning without a rotation plan.** Certificate renews, pin mismatches, app can't talk to its own server, emergency release while users are locked out. Pinning is a loaded gun — the safety is the backup pin.
- **Deep links with no web fallback.** The link opens a browser 404 when the app isn't installed. Every deep link should degrade to a useful web page with an install prompt.

### Best practices (the good)

- **Design the merge policy before the schema.** "What happens when two people edit this offline?" is a product question with a technical answer — get the answer before you ship, not from a support ticket.
- **Encrypt local storage for sensitive data, minimize synced PII.** The less sensitive data on the device and in transit, the smaller the blast radius. Data minimization isn't just compliance — it's engineering prudence.
- **Transactional pushes over promotional pushes.** "Your ride arrived" is welcome; "We miss you! 20% off!" trains users to mute you. Every push should pass the "did the user ask for this?" test.
- **Handle the hostile device gracefully:** detect root/jailbreak and degrade (block sensitive actions, don't just crash); obfuscate release builds; never trust client-side validation alone — the server re-validates everything.
- **Deep-link routing table:** one registry mapping URL patterns → destinations, with auth checks and fallbacks. Scattered `if url.contains(...)` handlers rot within months.

### 🤖 Build rules

1. MUST design offline-first: the local database is the source of truth; every write completes locally before the network is consulted. NEVER build "spinner-then-API" as the primary path.
2. MUST define a conflict-resolution policy per field at design time and encode it in the schema. NEVER apply silent last-write-wins to user-generated content without documenting the data-loss risk.
3. NEVER store secrets, tokens, or PII in plaintext (`SharedPreferences`, `UserDefaults`, plists, strings.xml). MUST use Keychain (iOS) / Keystore + EncryptedSharedPreferences (Android).
4. MUST request permissions in context with a priming explanation of value. NEVER bulk-request permissions at first launch.
5. MUST ship certificate pinning WITH a backup pin and rotation plan for finance/health/sensitive apps. MUST NOT pin without one.
6. MUST give every deep link a web fallback. NEVER let a link die with a 404 when the app isn't installed.
7. SHOULD validate sync and conflict logic on real devices with throttled, flaky networks. NEVER trust simulator-only testing for sync code.
8. MUST re-validate everything server-side. NEVER trust client-side checks as a security boundary.

---

## 3.5 Shipping Mobile Apps

### Core concepts

- **Signing = identity.** Android: you sign with an upload key; Google's Play App Signing then re-signs for distribution. iOS: certificates + provisioning profiles tie the binary to your team (automatic signing in Xcode handles this for most teams). Lose control of signing and you cannot ship updates — it is the keys to the kingdom.
- **Versioning:** Android uses `versionCode` (integer, must always increase) + `versionName` (human-readable); iOS uses `CFBundleVersion` (build number) + `CFBundleShortVersionString` (marketing version). Semantic versioning (MAJOR.MINOR.PATCH) communicates breaking vs. additive vs. fix changes.
- **Staged rollouts:** Google Play lets you release to a percentage (1% → 5% → 20% → 50% → 100%), halting on problems. iOS phased release rolls out over 7 days with automatic pause on excessive crashes. Both exist because *every* release has bugs — the question is how many users meet them.
- **Crash reporting:** Firebase Crashlytics / Sentry capture stack traces, ANR rates, and breadcrumbs from the field. Your testing finds the bugs you thought of; crash reporting finds the ones your users thought of.
- **Analytics:** event taxonomy (what happened), funnels (where users drop off), retention cohorts (who comes back). On iOS, App Tracking Transparency (ATT) means cross-app tracking needs explicit permission — design analytics to work without the IDFA.
- **Store listings that convert:** icon, title, screenshots, preview video, description, ratings. Users decide in seconds from the screenshots alone.

### Techniques & methods

- **CI/CD for mobile:** GitHub Actions / Bitrise / Codemagic building on every merge; Fastlane automating screenshots, signing, and uploads (`fastlane supply` to Play, `fastlane deliver` to App Store). Manual release builds from a developer's laptop are how "works on my machine" becomes "broken for everyone."
- **Release tracks:** Play internal → closed → open testing → production; TestFlight internal → external → App Store. Every production release should graduate through each track.
- **Feature flags + kill switches:** risky features ship *disabled*, enabled remotely for cohorts, with a one-click kill switch. A bad feature behind a flag is a config change; without one it's an emergency release and a 1–2 day review wait.
- **Pre-launch testing:** Play's pre-launch report runs your app on real devices in the lab (catches crashes on devices you don't own); TestFlight external testers catch real-world issues. Both are free — skipping them is just negligence with extra steps.
- **The release checklist:** version bumped, changelog written, signing verified, release notes localized, privacy policy URL live, support URL live, screenshots current, phased rollout configured, crash alerts armed, flag defaults safe.

### Tips & tricks

- **The first three screenshots carry the pitch.** Users rarely scroll past them. Show the core value in screenshot one, not your logo splash screen.
- **A <30s preview video** demonstrating the main flow outperforms paragraphs of description. Record on a real device, not the simulator.
- **Localize the listing** (title, description, screenshots) for your top 3–5 markets — one of the cheapest ASO wins available.
- **Reply to 1-star reviews publicly and fix the issue.** A meaningful percentage of users update their rating after a real response. Your review responses are marketing copy read by every prospective user.
- **Keep a 1024×1024 master icon** and export down. Upscaled icons look blurry on high-density screens and get rejected in review.

### Common mistakes (the bad)

- **Losing the Android upload keystore.** Historically this meant the app could *never* be updated again — a new listing, zero users carried over. (Play App Signing mitigates this for enrolled apps, but the upload key still matters. Guard it like production credentials.)
- **`versionCode` not incremented** → upload rejected, confused release manager, wasted day.
- **Shipping debug builds or verbose logging with PII** to production. Logs end up in crash reports and logcat on user devices — a privacy incident waiting for a security researcher.
- **Ignoring pre-launch/TestFlight reports.** The lab found a crash on a Samsung device you don't own. You shipped anyway. Now it's your top crash.
- **Keyword-stuffing the app title** ("Photo Editor Pro Collage Maker 2024 Free") → rejection and user distrust.
- **Fake or incentivized reviews.** Both stores detect this; the penalty ranges from review removal to account termination. Not worth it, ever.

### Best practices (the good)

- **Automate everything about releases.** If a human can forget a step, a human will forget it at 11pm before a launch. CI builds, signs, uploads, and tags — humans approve.
- **Set a crash-free bar and enforce it:** e.g., 99.5% crash-free users/sessions; halt the rollout automatically below it. A number you don't enforce is a wish.
- **Privacy-first analytics:** collect the minimum that answers your questions, document retention, honor deletion requests. ATT on iOS isn't just a prompt — it's a signal that the platform direction is less tracking, so build measurement that survives it.
- **Staged rollout for every production release, no exceptions.** Even a "trivial" string change has broken apps. The rollout *is* the safety net.
- **Changelog discipline:** every release gets user-facing notes. "Bug fixes and improvements" for the 40th time tells users you don't respect their update.

### 🤖 Build rules

1. MUST automate build, sign, and upload in CI with secrets stored in a vault (GitHub Secrets, etc.). NEVER commit keystores, `.p12` files, provisioning profiles, or API keys to git.
2. MUST increment `versionCode` (Android) / build number (iOS) on every release. NEVER reuse a version number.
3. MUST use staged rollout (Play) or phased release (iOS) for every production release. NEVER ship to 100% of users on day one.
4. MUST integrate crash reporting (Crashlytics/Sentry) before the first public release, and MUST halt a rollout when crash-free rate drops below the defined bar.
5. MUST strip debug logging and any PII from production builds. NEVER ship a `Log.d` that prints user data.
6. SHOULD gate every risky feature behind a remote flag with a kill switch, defaulting to OFF.
7. NEVER buy, fake, or incentivize reviews. NEVER keyword-stuff the app title.
8. MUST verify the release checklist (signing, live privacy/support URLs, current screenshots, safe flag defaults) before promoting any build to production.

---

*End of Part 3. Next: Part 4 — Backend & APIs.*


---

# Part 4: Software Architecture & Engineering

> How professionals design software so it works on day one and still works on day one thousand.
>
> *Research grounding — verified courses only: MIT 6.031/6.1020 Software Construction ("safe from bugs, easy to understand, ready for change"; spec-first; systematic testing). Stanford CS 190, Prof. Ousterhout (*A Philosophy of Software Design*: complexity is the enemy; deep modules). CMU 17-214 (testability, patterns as tradeoffs, API design, refactoring) and 17-313 (requirements, balancing qualities/cost/risk).*

---

## 4.1 How software gets built

### Core concepts
- **SDLC** — requirements → design → build → test → deploy → maintain. Process exists to manage coordination cost and risk, not to produce documents.
- **Waterfall** — phases run in strict sequence. Works only when requirements are truly fixed (rare). Fails whenever learning is required (almost always).
- **Iterative / incremental** — build in small slices, get feedback, adjust. The default for anything with uncertainty.
- **Agile (manifesto values)** — individuals over processes, working software over comprehensive docs, customer collaboration, responding to change. A mindset, not a meeting schedule.
- **Scrum** — fixed sprints (1–2 weeks); roles (Product Owner, Scrum Master, dev team); ceremonies (planning, daily standup, review, retrospective); artifacts (backlog, sprint backlog, increment).
- **Kanban** — continuous flow with WIP limits and a pull system. Best for support/ops-heavy work and tiny teams.
- **Requirements types** — functional (what it does), non-functional (how well: speed, security, scale), constraints (tech, legal, budget).
- **Spec / SRS** — the written contract of what gets built. MIT 6.031's core discipline: write the spec before the body — preconditions, postconditions, and what's deliberately left unsaid.

### Techniques & methods
- **User stories** — "As a [who], I want [what], so that [why]" plus acceptance criteria. The "so that" clause matters most; it stops you building the wrong thing well.
- **INVEST** — stories should be Independent, Negotiable, Valuable, Estimable, Small, Testable.
- **Acceptance criteria first** — define "done" in testable sentences before coding. These become your tests.
- **Vertical slicing** — slice by user-visible value, not by layer. Ship "login works end-to-end" before "complete database schema."
- **Spikes** — timeboxed research ("2 hours: can library X do Y?").
- **Estimation techniques** — story points (relative sizing), planning poker (team wisdom, kills anchoring bias), T-shirt sizes (XS–XL), three-point/PERT ((O + 4M + P) / 6), analogy ("like that thing we built").
- **Velocity** — average points completed per sprint. For forecasting only; never for performance reviews.
- **Definition of Done** — coded + reviewed + tested + documented + deployed. If it isn't on the list, it doesn't happen.

### Tips & tricks
- Estimate in ranges, never single numbers. "3–5 days" is honest; "4 days" is fiction.
- Keep work items at ≤ 1 day each. Bigger than that — split it.
- Demo working software every sprint, even rough. Demos surface misunderstandings months early.
- Cap work-in-progress at 1–2 items per person.
- Re-estimate when you learn something. An estimate is a forecast, not a promise.
- Write the README before the code for any library or service. If you can't explain it, you can't build it.

### Common mistakes (the bad)
- **Waterfall in disguise** — calling it "agile" while doing big upfront design and one giant release.
- **No written spec** — "we'll figure it out as we go" reliably produces three rewrites and a missed deadline.
- **False precision** — "this will take 37 hours." Nobody knows. Use ranges or relative sizes.
- **Skipping retrospectives** — repeating the same dysfunction every sprint, forever.
- **Absent Product Owner** — developers guessing at requirements means building the wrong product efficiently.
- **Gold-plating** — building features nobody asked for while core features rot.
- **Coding before understanding** — the most expensive mistake; code is the costliest place to discover you misunderstood.

### Best practices (the good)
- Smallest releasable increment first. Real users beat imagined users.
- Spec-first for anything over a day of work (the MIT 6.031 discipline).
- Acceptance criteria are the contract between requester and builder.
- Protect the sprint: no mid-sprint scope injection without an explicit tradeoff conversation.
- Every retrospective ends with 1–2 tracked action items, or it was theater.

### 🤖 Build rules
1. MUST write a short spec (what, why, acceptance criteria) before building anything non-trivial.
2. MUST define "done" in testable sentences before writing code.
3. NEVER start coding when requirements are ambiguous — ask, don't guess.
4. SHOULD break work into chunks of ≤ 1 day each.
5. MUST demo working increments; never go dark for weeks.
6. SHOULD estimate in ranges or relative sizes; NEVER commit to false-precision hour counts.
7. MUST run a retro after each phase and track the action items.

---

## 4.2 SOLID principles + the essential design patterns

### Core concepts
- **SRP (Single Responsibility)** — a class/module does one thing and has one reason to change. Smell: anything named `...Manager` doing five jobs.
- **OCP (Open/Closed)** — open for extension, closed for modification. Add behavior with new code (plugins, strategies), not by editing tested code.
- **LSP (Liskov Substitution)** — subclasses must work wherever parents work, without surprises. Smell: overriding a method just to throw "not supported."
- **ISP (Interface Segregation)** — small focused interfaces beat fat ones. Clients shouldn't depend on methods they never call.
- **DIP (Dependency Inversion)** — depend on abstractions, not concretions. High-level policy shouldn't know about databases or HTTP clients.
- **Composition over inheritance** — inherit for "is-a," compose for "has-a / can-do." Deep hierarchies are where flexibility goes to die.
- A **pattern** is a named, proven solution shape — vocabulary for design discussion. CMU 17-214 teaches patterns as tradeoffs, not recipes.

### Techniques & methods
Each pattern: what it is → use when → do NOT use when.

1. **Singleton** — one shared instance (config, connection pool). USE for genuinely single resources. DON'T use as a global variable in disguise; it hides dependencies and poisons tests.
2. **Factory Method** — subclasses decide which class to instantiate. USE when creation logic varies by type. DON'T when `new` with a parameter would do.
3. **Abstract Factory** — families of related objects (UI toolkit per OS). USE when products must stay consistent with each other. DON'T for a single product line — overkill.
4. **Builder** — step-by-step construction of complex objects (query builders, request builders). USE with many optional parameters. DON'T for simple objects — a constructor is fine.
5. **Adapter** — converts one interface to another (wrapping a legacy API). USE when integrating incompatible code you can't change. DON'T to paper over a bad abstraction you own — fix the abstraction.
6. **Facade** — one simple interface over a messy subsystem. USE to onboard developers and simplify complex libraries. DON'T as a dumping ground that hides power people need.
7. **Decorator** — adds behavior by wrapping (middleware, logging wrappers). USE for combinable optional behaviors. DON'T when it creates six layers of wrapping nobody can trace.
8. **Proxy** — a stand-in controlling access (lazy loading, caching, access control). USE for expensive or remote objects. DON'T for logic that belongs in the real object.
9. **Observer (pub/sub)** — notifies dependents of state changes (events, UI updates). USE for one-to-many updates between decoupled components. DON'T when ordering matters or "who reacted to what" becomes undebuggable — prefer explicit calls.
10. **Strategy** — interchangeable algorithms behind one interface (pricing rules, payment providers). USE when behavior varies at runtime. DON'T for two branches of an if-statement.
11. **Command** — encapsulates a request as an object (undo, job queues, audit logs). USE when you must queue, log, or undo operations. DON'T when a plain function call suffices.
12. **Template Method** — skeleton algorithm with subclasses filling in steps. USE for fixed workflows with variable steps. DON'T when composition (Strategy) gives the same result with less coupling.
13. **State** — object changes behavior with internal state (order: pending → paid → shipped). USE for state machines with state-specific rules. DON'T for two states — use a flag.
14. **Repository** — collection-like interface over data access (`users.findActive()`). USE to isolate business logic from storage details; makes testing trivial. DON'T as a 1:1 wrapper that adds zero abstraction.
15. **Dependency Injection** — pass dependencies in; don't create them inside. USE everywhere — it's how you get testability and DIP. DON'T inject stable value objects; use judgment.
16. **MVC / MVP / MVVM** — separate presentation from logic from data. USE for any UI of real size. DON'T cargo-cult all three layers for a two-screen prototype.

### Tips & tricks
- Name the pattern in design discussions ("this should be a Strategy, not a switch"). Shared vocabulary = faster decisions.
- Prefer the simplest pattern that solves it; refactor to a fancier one when real pain appears.
- Discover interfaces from actual needs, don't invent them upfront (Ouster: never generalize prematurely).
- If a pattern makes code harder to read, you chose wrong — simplicity wins.

### Common mistakes (the bad)
- **Pattern bingo** — applying patterns because they sound smart. A 200-line class with six patterns is worse than plain code.
- **Singleton-as-global** — shared mutable state behind `getInstance()`; untestable, order-dependent bugs.
- **Premature abstraction** — building the "flexible framework" before the second use case exists.
- **Inheritance towers** — five-level hierarchies where touching the base breaks everything (LSP violations hiding everywhere).
- **God objects** — the `Utils` / `Manager` / `Helper` class that knows everything about everyone.

### Best practices (the good)
- MIT 6.031's bar, in order: safe from bugs, easy to understand, ready for change.
- Design for the change you can foresee; keep simple what you can't.
- Make illegal states unrepresentable — with types, not comments.
- Depend on interfaces you own, not on third-party concretions.

### 🤖 Build rules
1. MUST apply SOLID as judgment, not dogma — be able to name which principle a decision serves.
2. MUST prefer composition over inheritance; NEVER build hierarchies deeper than 2–3 levels without written justification.
3. NEVER use Singleton for mutable shared state — pass dependencies explicitly (DI).
4. SHOULD use Strategy over switch-statements when behavior varies; SHOULD use Repository to isolate data access.
5. MUST NOT introduce a pattern until the simpler code shows real pain (rule of three).
6. SHOULD name patterns in design discussions and in comments where non-obvious.
7. NEVER let a class exceed one clear responsibility — split it.

---

## 4.3 Architecture styles

### Core concepts
- **Monolith** — one deployable unit, one codebase. Simplest to build, test, deploy, and debug.
- **Modular monolith** — one deployment, but strict internal module boundaries (separate packages, no cross-module database access). The sweet spot for most teams.
- **Microservices** — independently deployable services with their own datastores, communicating over the network. An organizational pattern as much as a technical one.
- **Event-driven** — components communicate via events/messages (queues, pub/sub). Loose coupling, eventual consistency.
- **Serverless (FaaS)** — functions on provider infrastructure, pay per invocation. Zero server management, new cost and scaling dynamics.
- **Layered / clean / hexagonal** — code-organization styles, not deployment styles. Keep business logic independent of frameworks and databases. Complements any deployment style above.

### Techniques & methods
**The honest tradeoff matrix:**

| Dimension | Monolith | Modular monolith | Microservices | Event-driven | Serverless |
|---|---|---|---|---|---|
| Team size fit | 1–8 | 5–20 | 20+ (owning team per service) | 10+ | 1–10 |
| Ops complexity | Low | Low–medium | High (tracing, deploys, mesh) | High (brokers, ordering, replays) | Low (provider handles it) |
| Cost at small scale | Lowest | Low | High (per-service overhead) | Medium | Very low → then spiky |
| Scaling | Scale everything together | Scale together; optimize hot modules | Scale each service independently | Great for bursty / async workloads | Automatic — watch per-request cost |
| Deploy independence | None (single deploy) | None, but clean internals | Full (per-service deploys) | Partial (schema-evolution pain) | Full per function |
| Debugging | Easy (one stack trace) | Easy | Hard (distributed tracing needed) | Hard (async, out-of-order) | Medium (cold starts, scattered logs) |
| Data consistency | Easy (one DB, ACID) | Easy | Hard (sagas, eventual consistency) | Eventual by design | Depends on backing store |
| Choose when | MVP, small team, uncertain domain | Default for serious products | Org-scaling pain is real; domains are clear | Async workflows, integrations, audit trails | Spiky / periodic workloads, prototypes |

- **Start with a modular monolith; extract services only when a module needs independent scaling, deployment, or ownership.**
- **Event-driven done right** — version your events, make every consumer idempotent, plan for replays and dead-letter queues from day one.
- **Serverless done right** — keep functions small and stateless, account for cold starts, model cost per million invocations before committing.

### Tips & tricks
- Draw module boundaries in the monolith the way you'd draw service boundaries later — extraction then becomes mechanical.
- If you can't sketch the architecture on one whiteboard, it's too complex for your team size.
- Async/event-driven for "it can happen later" work (emails, webhooks, reports); synchronous for "the user is waiting" work.
- In microservices, one database per service is the rule — shared databases recreate the monolith with network latency added.

### Common mistakes (the bad)
- **Premature microservices** — three developers running twelve services. All of the ops pain, none of the organizational benefit.
- **Distributed monolith** — "microservices" that deploy together and call each other synchronously. Worst of both worlds.
- **Event spaghetti** — events triggering events with no documentation; nobody can say what happens when X occurs.
- **Serverless cost shock** — the $5 prototype that becomes a $2,000/month bill because nobody modeled per-invocation cost.
- **Data-last architecture** — choosing service boundaries first, then discovering the data can't be split that way.

### Best practices (the good)
- Architecture follows team and domain — Conway's law is descriptive, so design the org and the system together.
- Optimize for cheap evolution, not for theoretical perfection.
- Record decisions as ADRs (Architecture Decision Records): context, options, decision, consequences. Future maintainers need the reasoning, not just the outcome.
- Revisit architecture yearly. What fit five people won't fit fifty.

### 🤖 Build rules
1. MUST default to a modular monolith; MUST justify microservices with concrete scaling or ownership needs.
2. NEVER create a network boundary without a matching team/ownership boundary.
3. SHOULD make every cross-service and event interaction idempotent and retry-safe.
4. MUST document load-bearing architecture decisions as ADRs.
5. SHOULD keep the whole architecture explainable on one whiteboard.
6. NEVER choose serverless or event-driven without modeling cost and failure modes first.

---

## 4.4 API design mastery

### Core concepts
- **REST (Richardson maturity)** — L0 (RPC over HTTP) → L1 (resources) → L2 (verbs + status codes) → L3 (hypermedia). Aim for solid L2; L3/HATEOAS is rarely worth it in practice.
- **Resources, not actions** — `POST /orders`, never `POST /createOrder`. Nouns in URLs, verbs in HTTP methods.
- **Statelessness** — every request carries its own auth and context; the server remembers no conversations.
- **Idempotency** — repeating a request is safe. GET/PUT/DELETE are idempotent by design; make POST safe with idempotency keys.
- **Versioning** — the API is a contract with strangers. Breaking it breaks their businesses.

### Techniques & methods
- **Naming** — plural nouns, kebab-case: `/api/v1/order-items`. No verbs in paths (rare RPC-style exceptions like `/orders/123/cancel` are fine).
- **Status codes done right** — 200 ok · 201 created · 204 no content · 400 client error · 401 unauthenticated · 403 forbidden · 404 not found · 409 conflict · 422 validation failed · 429 rate limited · 500 server error (never leak internals).
- **Versioning** — URL path (`/v1/`) is simplest and most common. Never break v1; ship v2 alongside it.
- **Pagination** — cursor-based (`?cursor=…&limit=50`) for large or changing datasets; offset (`?page=2`) only for small stable lists. Always return `next_cursor` and totals.
- **Filtering / sorting / search** — `?status=paid&sort=-created_at&q=…`. Whitelist the allowed fields; never expose raw query passthrough.
- **Idempotency keys** — client sends an `Idempotency-Key` header on POST; server stores the result keyed by it; retries return the original result. Essential for payments, orders, and webhooks.
- **Rate limiting** — return `429` with `Retry-After`, plus `X-RateLimit-Limit / -Remaining / -Reset` headers. Limit by API key, not just IP.
- **Error format** (RFC 7807 problem details) — consistent JSON: `type`, `title`, `status`, `detail`, plus `errors[]` with field-level messages. Machine-readable and human-readable.
- **Webhooks** — sign payloads (HMAC), include event IDs and timestamps, retry with exponential backoff, document ordering guarantees (or their absence), provide a replay endpoint.
- **Auth** — API keys for server-to-server (rotatable, scoped); OAuth2/OIDC for user-delegated access; short-lived JWTs plus refresh tokens. Never roll your own crypto.
- **Contracts** — publish OpenAPI specs; generate clients and run contract tests from the spec so docs can't drift from reality.

### Tips & tricks
- Design from the consumer's perspective; write example client code first.
- Return the created/updated resource in the response — saves the client a round trip.
- Use `ETag` / `If-None-Match` for cacheable reads; it cuts load massively.
- Make error messages actionable: "email is already registered" beats "validation error."
- Propagate a request ID through every layer and include it in errors so users can quote it.

### Common mistakes (the bad)
- **200 OK with error bodies** — breaks every HTTP client, cache, and monitoring tool. Use real status codes.
- **Breaking changes without versioning** — renaming a field on a live API that paying customers depend on.
- **N+1 via API** — endpoints that force fifty requests to render one screen. Provide `?expand=` or batch endpoints.
- **No rate limiting** — one misbehaving client degrades service for everyone.
- **Leaking internals** — stack traces, SQL errors, or internal IDs in responses.
- **Inconsistent conventions** — `user_id` here, `userId` there, `usr` somewhere else.

### Best practices (the good)
- Backward-compatible evolution: only add fields and endpoints; never rename or remove without a version bump plus a deprecation window.
- Docs generated from the OpenAPI spec with request/response examples — never hand-written and stale.
- A sandbox/test mode for integrators.
- A public API changelog with advance notice of every deprecation.

### 🤖 Build rules
1. MUST use proper HTTP verbs and status codes — NEVER return 200 for errors.
2. MUST version APIs from day one (`/v1/`); MUST NOT break existing versions.
3. MUST paginate every list endpoint; SHOULD prefer cursor pagination.
4. MUST make resource-creating POST endpoints idempotent via idempotency keys (payments, orders, webhooks).
5. MUST rate-limit and return 429 with retry guidance.
6. MUST return consistent machine-readable errors (type / title / detail / field errors).
7. MUST sign webhook payloads and implement retry with exponential backoff.
8. NEVER expose internal errors, stack traces, or unfiltered query power to clients.

---

## 4.5 Testing

### Core concepts
- **Testing pyramid** — many fast unit tests (base) → fewer integration tests (middle) → very few end-to-end tests (top). The inverted pyramid (ice-cream cone) is slow, flaky, and expensive.
- **Unit tests** — one component in isolation, milliseconds each. Test behavior, not implementation.
- **Integration tests** — components wired together (API + database, service + queue). Catches contract mismatches between parts.
- **E2E tests** — full user journeys in a realistic environment. Slow and brittle; reserve for critical paths (signup, checkout).
- **Test doubles** (CMU 17-214 vocabulary) — fakes (working in-memory implementations), stubs (canned answers), mocks (verify interactions). Prefer fakes; use mocks sparingly.
- **Coverage** — measures which code ran, not what was verified.
- **TDD (red-green-refactor)** — write a failing test, make it pass, clean up. A design tool as much as a testing tool.
- **Flaky tests** — tests that pass or fail randomly. They train everyone to ignore failures, which is worse than having no tests.

### Techniques & methods
- **Input partitioning + boundary analysis** (MIT 6.031) — test each partition of the input space and its edges: 0, 1, max, empty, null, malformed.
- **Arrange-Act-Assert** — structure every test identically for readability.
- **Given-When-Then** — for behavior-level tests.
- **Property-based testing** — assert properties over generated inputs ("sorted output is ordered"); finds edge cases humans never think of.
- **Contract tests** — verify provider and consumer agree on the API, so integration surprises die before deployment.
- **Testing in production, safely** — feature flags, canary deploys, shadow traffic; staging never equals production.
- **Mutation testing** (advanced) — deliberately break the code; if tests still pass, the tests are weak.

### Tips & tricks
- When fixing a bug, write the failing test first — it proves the fix and prevents regression. This is where TDD always pays off.
- Keep unit tests under ~100ms each; the whole unit suite should run in seconds or nobody will run it.
- Name tests as specifications: `rejects_expired_tokens`, not `test1`.
- Use factories and fixtures, not copy-pasted setup blocks.
- Quarantine flaky tests into a separate suite immediately — never let them block the build.

### Common mistakes (the bad)
- **Testing implementation details** — asserting on private method calls means every refactor breaks tests, so people stop refactoring.
- **Slow, noisy suites** — a 40-minute run everyone avoids and eventually deletes.
- **Tolerated flakiness** — "just re-run it" culture means real failures get ignored too.
- **Happy-path-only testing** — the bug is always in the error handling you didn't test.
- **E2E for everything** — testing business logic through a browser: slow, brittle, unmaintainable.
- **Mocking everything** — tests that verify your mocks instead of your code.

### Best practices (the good)
- MIT 6.031's bar: test-first thinking, systematic case generation, regression suites that actually run on every change.
- Test behavior and contracts, never internals.
- Fast feedback loops: unit tests on every save, integration on every commit, e2e on every merge.
- Every bug fix ships with a regression test.
- Delete tests that cost more than they protect — a test suite is code too.

### 🤖 Build rules
1. MUST follow the pyramid: many unit tests, some integration tests, e2e only for critical paths.
2. MUST write a failing test before fixing any bug (regression proof).
3. NEVER test private implementation details — test observable behavior.
4. MUST quarantine flaky tests immediately; NEVER let them block builds.
5. SHOULD keep the unit suite fast enough to run on every change (seconds, not minutes).
6. MUST cover boundaries and error paths, not just happy paths.
7. SHOULD use TDD for complex logic and bug fixes; it's optional for exploratory UI work.

---

## 4.6 Code quality

### Core concepts
- **Code review** — the highest-ROI quality practice in the industry. Catches bugs, spreads knowledge, enforces standards.
- **Refactoring** — changing structure without changing behavior. Safe only with tests as a safety net (CMU 17-214 treats "refactoring and design improvement" as a core skill).
- **Tech debt** — shortcuts that charge interest. Deliberate debt (ship now, pay later, tracked) versus accidental debt (a mess you didn't know you were making).
- **Naming** — the cheapest documentation available. A good name eliminates the need for a comment.
- **Documentation that gets read** — READMEs, ADRs, runbooks: each written for a specific reader performing a specific task.

### Techniques & methods
- **Review checklist, in order** — correctness, edge cases, readability, tests, security, performance implications.
- **Small diffs** — reviews over ~400 lines get skimmed, not read. Split big changes.
- **Boy scout rule** — leave the code cleaner than you found it. Continuous small improvements beat big rewrites.
- **Refactoring patterns** — extract function, rename, replace conditional with polymorphism, introduce parameter object. One behavior-preserving step at a time, tests green between steps.
- **ADRs (Architecture Decision Records)** — date, context, options considered, decision, consequences. Five minutes now saves five hours of archaeology later.
- **Runbooks** — "when X alerts, do Y." Written during calm, read during fire.
- **Static analysis** — linters, formatters, type checkers running in CI. Automate style so reviews discuss design instead of semicolons.
- **Tech-debt register** — list it, size it, budget 15–20% of capacity to pay it down. Invisible debt compounds silently.

### Tips & tricks
- Ouster's rule (Stanford CS 190): comments should describe what isn't obvious from the code — the *why*, never the *what*.
- Review your own diff before requesting review; you'll catch half the issues yourself.
- Ask questions in reviews, don't dictate: "what happens if this is null?" beats "this is wrong."
- Delete code aggressively. The best code is no code; every line is a liability.
- Automate formatting completely — zero human time on style debates, ever.

### Common mistakes (the bad)
- **Rubber-stamp reviews** — "LGTM" in thirty seconds on two thousand lines. Worse than no review: it manufactures false confidence.
- **Style nitpicking** — forty comments about variable names, zero about the race condition. Automate style; review substance.
- **Big-bang rewrites** — "we'll rewrite it cleanly." Rewrites routinely take 3× longer and silently drop undocumented behaviors (the second-system effect).
- **Obvious comments** — `// increment i`. Noise that rots; comments lie over time, code doesn't.
- **Dead documentation** — the eighty-page wiki written once and outdated within a month. Docs must live next to the code and answer real questions.
- **Ignoring debt until it blocks everything** — "we'll fix it later" becomes "we can't ship anything."

### Best practices (the good)
- Review culture: kind, fast (under 24h turnaround), focused on what matters.
- Refactor continuously in small steps; reserve rewrites for genuinely dead architectures.
- Names reveal intent: `active_subscriptions`, not `data2`; functions named for what they return or do.
- Every repo has a README answering: what is this, how do I run it, how do I test it, where does it deploy.
- Measure what matters: lead time, failure rate, recovery time — never lines of code.

### 🤖 Build rules
1. MUST keep diffs small and reviewable; SHOULD review own diff before submitting.
2. MUST run linters, formatters, and type checks in CI — NEVER debate style by hand.
3. SHOULD refactor in small behavior-preserving steps with tests green between each.
4. MUST write comments for the *why*, never the *what*; MUST keep a README per repo (what / run / test / deploy).
5. MUST record load-bearing decisions as ADRs.
6. SHOULD budget capacity for tech-debt paydown; MUST track known debt explicitly.
7. NEVER do a big-bang rewrite without proving the incremental path is impossible.

---

## 4.7 Paradoxes & tradeoffs every architect must know

### Core concepts
Nearly every lasting engineering lesson is a tension between two goods. Architects don't pick sides — they pick based on context.

- **Speed vs. quality** — shipping fast wins markets; shipping broken loses them. Resolution: optimize speed of *iteration*, not speed of first release. Small batches let you be both fast and safe.
- **Build vs. buy** — building gives control; buying gives speed. Resolution: build what differentiates you; buy what doesn't (auth, payments, email are solved problems).
- **Premature optimization vs. necessary foresight** — Knuth: "premature optimization is the root of all evil." But choosing the right data model and architecture early is cheap, and changing them late is ruinous. Resolution: never micro-optimize code; always get the big structural bets right; measure before optimizing anything else.
- **DRY vs. readability** — duplication is cheaper than the wrong abstraction. Rule of three: duplicate twice, abstract on the third occurrence. Visible duplication beats an incomprehensible abstraction.
- **Abstraction vs. simplicity** — Ouster (Stanford CS 190): complexity is the enemy; prefer deep modules (simple interface, powerful implementation). Every abstraction must earn its keep by hiding genuine complexity.
- **Consistency vs. availability (CAP)** — during a network partition you cannot have both perfect consistency and perfect availability. Resolution: choose per use case — money needs consistency, like-counters can be eventually consistent. Design for the failure mode explicitly instead of discovering it.
- **Flexibility vs. YAGNI** — "you aren't gonna need it." Generalize when the second real use case arrives, not the first imagined one.
- **Coupling vs. duplication** — sometimes a little duplication between services is cheaper than the coupling of shared code and shared data.
- **Planning vs. doing** — no plan survives contact with code; no code succeeds without a plan. Resolution: plan just enough to start, then let reality revise the plan through spikes and iterations.
- **Strong opinions vs. data** — hold opinions to move fast; hold them loosely and let production data overrule them.

### Techniques & methods
- **The decision framework** — write down: (1) reversible vs. irreversible (reversible → decide fast; irreversible → decide carefully), (2) cost of being wrong, (3) cost of waiting.
- **Two-way vs. one-way doors** — micro-decisions should be fast; data models, public APIs, and vendor lock-in deserve deliberation.
- **Spikes for uncertainty** — when the armchair can't decide, timebox an experiment.
- **Pre-mortems** — "it's a year from now and this failed — why?" Surfaces the risks optimism hides.
- **Fitness functions** — automated checks guarding architectural qualities (e.g., "no module may import from the UI layer").

### Tips & tricks
- When stuck between two good options, pick the reversible one.
- Optimize for the ability to change your mind — that is what "ready for change" (MIT 6.031) actually means.
- The best tradeoff decision is often "not yet" — defer until you have information.
- Write down *why* you chose, not just *what* — future tradeoffs need the reasoning.

### Common mistakes (the bad)
- **Treating all decisions as equal** — agonizing over lint rules while sleepwalking into a database choice.
- **Optimizing the measurable, ignoring the important** — blazing-fast code nobody can change; 100% coverage of useless tests.
- **Sunk-cost architecture** — "we've already built it this way" used as a reason to keep a failing design.
- **Cargo-culting** — adopting microservices, event sourcing, or the framework of the month because successful companies use them, while ignoring the context that made them work.
- **Analysis paralysis** — researching the perfect stack for three months instead of shipping an imperfect one in three weeks.

### Best practices (the good)
- Make reasoning explicit and revisable — ADRs exist for exactly this.
- Revisit tradeoffs on a schedule; context changes, and yesterday's right call is today's tech debt.
- Prefer boring technology for the core and exciting technology at the edges.
- Let production data settle the debates that opinions cannot.

### 🤖 Build rules
1. MUST classify decisions as reversible (decide fast) vs. irreversible (decide carefully) before deliberating.
2. SHOULD prefer the reversible option when uncertain; MUST timebox spikes to resolve uncertainty.
3. NEVER optimize code without measuring first; MUST get structural bets (data model, API shape) right early.
4. SHOULD follow the rule of three before abstracting; NEVER generalize on the first imagined use case.
5. MUST choose consistency vs. availability explicitly per use case — never by accident.
6. SHOULD buy undifferentiated capabilities (auth, payments, email); MUST build only what differentiates.
7. NEVER cargo-cult architecture from big companies without their context; MUST document the *why* behind every tradeoff.


---

# Part 5: Data, DevOps & Security

*Your app is only as good as its data layer, its deployment pipeline, and its defenses. This part covers the three disciplines that separate toys from production systems. Grounded in what the best programs teach: MIT 6.824 (Distributed Systems — Raft consensus, fault tolerance, consistency models), Stanford CS 245 (Database System Principles — indexing, query processing, crash recovery, concurrency control), and CMU 15-445 (Intro to Database Systems — storage engines, transactions, query optimization).*

---

## 5.1 Databases, Deep

### Core concepts

- **The relational model is still king.** Tables, rows, keys. Most products live and die on one relational database (Postgres/MySQL). Master it before reaching for anything exotic.
- **Schema design = destiny.** Every table, column type, and constraint you choose now shapes every query you'll write for years. Design on paper first.
- **Normalization (1NF → 2NF → 3NF):** eliminate duplicate data so a fact lives in exactly one place. Unnormalized data rots: update one copy, forget the other, now you have two "truths."
- **ACID:** Atomicity (all-or-nothing), Consistency (rules hold), Isolation (concurrent transactions don't corrupt each other), Durability (committed = survives crashes). This is the contract your database keeps with you.
- **Isolation levels:** READ COMMITTED (default in Postgres — sees committed data), REPEATABLE READ, SERIALIZABLE (safest, slowest). Know that weaker levels allow phantom reads and lost updates.
- **Indexes:** B-tree indexes make lookups and range scans fast (logarithmic instead of scanning everything). They cost write speed and disk space — every index is a tradeoff.
- **The query planner:** the database doesn't run your SQL literally; it builds an execution plan (which index, which join order). `EXPLAIN` shows you the plan. Learn to read it.
- **Transactions:** wrap multi-step writes in one transaction so partial failures roll back. Money moving from A to B is never two separate commits.
- **Locks and MVCC:** databases handle concurrent writers with locks or multi-version concurrency (readers don't block writers in Postgres). Long transactions hold locks and choke everyone.
- **Connection pooling:** opening a DB connection is expensive. A pooler (PgBouncer, or your framework's pool) reuses connections. Without one, traffic spikes = "too many connections" death.

### Techniques & methods

- **Design with an ER diagram first.** Entities, relationships, cardinalities — on paper or a whiteboard — before writing a single migration. (Stanford CS 245 drills this as relational design theory; CMU 15-445 grounds it in how storage actually works.)
- **Choose column types deliberately:** `INT` vs `BIGINT`, `TIMESTAMPTZ` (always timezone-aware, store UTC), `NUMERIC` for money (never floats for currency), `TEXT` vs bounded `VARCHAR`.
- **Composite indexes, leftmost-prefix rule:** an index on `(user_id, created_at)` serves queries filtering on `user_id`, or `user_id + created_at` — but NOT queries filtering only on `created_at`.
- **Covering indexes:** if the index contains all columns the query needs, the database never touches the table. Massive speedup for hot queries.
- **Read `EXPLAIN ANALYZE`:** run it on every slow query. Look for `Seq Scan` on large tables (usually bad), high row counts vs actual, and missing index usage.
- **Migrations, expand-and-contract:** never rename/drop a column in one deploy. Step 1: add the new column, dual-write. Step 2: backfill. Step 3: switch reads. Step 4: drop the old column. Zero-downtime schema changes.
- **Batch your writes:** 1,000 single-row INSERTs = 1,000 round trips. One multi-row INSERT or `COPY` = one. Orders of magnitude faster for imports and seed jobs.
- **Paginate with keyset, not OFFSET:** `WHERE id > last_seen ORDER BY id LIMIT 50` stays fast at page 10,000. `OFFSET 500000` makes the database count half a million rows to throw them away.
- **Soft deletes (`deleted_at` timestamp)** when business data must be recoverable; hard deletes when privacy law (or sanity) demands it. Decide per table, deliberately.
- **Foreign keys with real constraints** — let the database enforce referential integrity instead of hoping your code does.

### Tips & tricks

- **IDs:** auto-increment integers are simple and fast; UUIDs are better when you need distributed generation or unguessable IDs (public URLs). Don't expose sequential IDs in URLs if enumeration is a concern.
- **`created_at` / `updated_at` on every table.** Future-you debugging "when did this break" will be grateful.
- **Name things consistently:** `user_id` everywhere, not `userId` in one table and `uid` in another. Plural table names, singular model names — pick a convention and enforce it.
- **Keep a `schema.sql` / migrations folder in version control.** The database schema is code. Review it like code.
- **Seed scripts for local dev** that create realistic data — developing against 3 rows hides every performance problem.
- **Slow-query log on from day one.** The queries that will kill you at scale are already slow at 10k rows; catch them early.
- **Partial indexes:** `CREATE INDEX ... WHERE status = 'active'` — tiny index, only for the rows you actually query.
- **Use database constraints as documentation:** `NOT NULL`, `UNIQUE`, `CHECK (price >= 0)` — the schema itself tells the next developer the rules.

### Common mistakes (the bad)

- **The N+1 query:** loading 100 orders, then one query per order to get its items = 101 queries. Fix with JOINs or eager loading. The single most common database performance bug in web apps.
- **`SELECT *` in application code:** fetches columns you don't need, breaks when columns are added, wastes bandwidth. Name your columns.
- **No index on foreign keys:** every JOIN becomes a full table scan. Index your FKs by default.
- **Storing comma-separated lists in a column** (`tags = "a,b,c"`): unqueryable, unindexable, violates 1NF. Use a join table or a proper array/JSON column.
- **Migrations that lock tables in production:** `ALTER TABLE` rewriting a 100M-row table without a plan = downtime. Use online-schema-change techniques.
- **Ignoring timezones:** storing local time without zone info guarantees a 2 AM bug during daylight-saving transitions. Store UTC, convert at display.
- **No backups, or backups never tested.** An untested backup is a hope, not a backup. (More in 5.4.)
- **One giant god-table** with 60 columns "for flexibility" instead of a real schema. Flexibility now, misery forever.
- **Trusting the ORM blindly:** ORMs generate SQL; bad ORM usage generates bad SQL. Always inspect what it emits on hot paths.

### Best practices (the good)

- **Every schema change goes through a reviewed migration.** No hand-editing production. Ever.
- **Wrap related writes in transactions.** If the second write can fail, the first must roll back.
- **Least-privilege database users:** the app user gets only the permissions it needs — no `SUPERUSER`, no DDL in production.
- **Test against production-like data volumes** before launch. 100 rows lie; 10 million rows tell the truth.
- **Monitor slow queries continuously** and treat new slow queries as bugs, not curiosities.
- **Document non-obvious schema decisions** (why denormalized here, why this index) in a comment or doc. Schemas outlive their authors' memories.

### 🤖 Build rules

- **MUST** use parameterized queries / prepared statements for every query containing user input — no exceptions, no string concatenation.
- **MUST** put every schema change in a version-controlled migration; NEVER hand-edit a production database.
- **MUST** wrap multi-step writes in a transaction.
- **MUST** run `EXPLAIN` on any query touching a large table before shipping it.
- **SHOULD** index foreign keys by default.
- **SHOULD** use keyset pagination for any list that can grow unbounded.
- **NEVER** store passwords, tokens, or secrets in plaintext columns (hashing is covered in 5.5).
- **NEVER** use `SELECT *` in application code paths.
- **NEVER** deploy a migration you haven't tested against a realistic data volume.

---

## 5.2 Beyond SQL

### Core concepts

- **NoSQL is not "no database" — it's "not only relational."** Four families: **document** (MongoDB — JSON-like docs), **key-value** (Redis — ultra-fast simple lookups), **wide-column** (Cassandra — massive write scale), **graph** (Neo4j — relationship-heavy data). Each wins at something specific and loses everywhere else.
- **The CAP theorem (from MIT 6.824's consistency lectures):** in the presence of a network partition, a distributed system must choose between Consistency and Availability. You cannot have perfect consistency, perfect availability, and partition tolerance all at once. Every distributed datastore is a point on this tradeoff.
- **PACELC (the fuller picture):** even **else** (no partition), there's a **latency vs consistency** tradeoff. Strong consistency costs round trips.
- **Eventual consistency:** replicas converge over time, but reads right after a write may see stale data. Fine for a "like" counter; fatal for a bank balance.
- **Caching:** keep hot data in fast memory (Redis/Memcached) so the database doesn't recompute it. A cache is a performance layer, not a database — it can be wiped at any time.
- **Message queues:** decouple "request received" from "work done." Producer drops a message; consumer processes it later. The backbone of background jobs, email sending, webhooks, and event-driven systems.
- **Delivery semantics:** **at-most-once** (may lose messages), **at-least-once** (may deliver duplicates — the common real-world guarantee), **exactly-once** (effectively impossible in distributed systems; what people mean is "exactly-once *effects*" via idempotency).

### Techniques & methods

- **Cache-aside (lazy loading):** app checks cache → miss → reads DB → writes cache → returns. Simple, and the cache only holds what's actually requested.
- **Write-through:** write to cache and DB together. More consistent, slower writes, cache always warm.
- **TTL (time-to-live) on everything cached.** No TTL = stale data forever. Pick TTLs by how painful staleness is: user profile (minutes), product catalog (longer), leaderboard (seconds).
- **Cache invalidation strategies:** on write, delete or update the affected cache keys. Keep a written list of "which writes invalidate which keys" — this list IS your caching design.
- **Preventing cache stampedes:** when a hot key expires, 1,000 requests all hit the DB at once. Fix with request coalescing (one request rebuilds, others wait), jittered TTLs (don't let everything expire simultaneously), or probabilistic early refresh.
- **Redis data structures as tools:** strings (counters, flags), hashes (objects), sorted sets (leaderboards, time-ordered feeds), lists (queues), HyperLogLog (unique counts), streams (event logs).
- **Idempotency keys:** the client sends a unique key with each request; the server stores processed keys and ignores duplicates. This is how you get "exactly-once effects" over at-least-once delivery — critical for payments and webhooks.
- **Queue patterns:** work queues (distribute tasks), pub/sub (broadcast events), delayed/scheduled jobs (retries, reminders), dead-letter queues (poison messages go here for inspection, never silently dropped).
- **Backpressure:** when consumers can't keep up, slow the producers or shed load — don't let the queue grow unbounded until the machine dies.
- **Choosing NoSQL honestly:** document DB when your data is naturally document-shaped and schema evolves fast; key-value when you need raw speed on simple lookups; wide-column for write-heavy time-series at scale; graph when queries are "friends of friends of friends." Default to Postgres otherwise.

### Tips & tricks

- **Redis for more than caching:** rate limiting (sliding window counters), distributed locks (with fencing/Redlock care), session storage, real-time leaderboards, pub/sub for live updates.
- **Version your cache keys** (`user:123:v2`) — deploying a format change? Bump the version instead of flushing the whole cache.
- **Warm caches after deploys** for the handful of keys that matter most, so the first users don't eat cold-cache latency.
- **Monitor queue depth and consumer lag** — a growing queue is the earliest warning that your background system is falling behind.
- **Make queue messages self-contained** (include the data needed, not just an ID) so consumers don't need extra DB round trips — but keep them small.
- **Poison-message handling:** limit retries with exponential backoff, then dead-letter. A message that crashes every consumer in a loop is a self-inflicted DDoS.

### Common mistakes (the bad)

- **Caching without an invalidation plan.** "We'll figure out staleness later" = users seeing yesterday's data, or worse, someone else's data.
- **Treating the cache as the source of truth.** Caches get evicted, flushed, and lost. If losing the cache loses data, your architecture is broken.
- **Assuming exactly-once delivery.** Your payment webhook WILL be delivered twice someday. Design for duplicates from day one.
- **No dead-letter queue.** Failed messages retried forever, blocking real work, with no visibility into what's failing.
- **Unbounded queue growth** with no alerting — you discover it when the disk fills or the bill arrives.
- **Picking a NoSQL store because it sounds modern,** then reimplementing joins, transactions, and constraints in application code — badly.
- **One Redis instance, no persistence config thought:** restart wipes sessions and rate-limit state. Know your RDB/AOF settings.

### Best practices (the good)

- **Write idempotent consumers.** Assume every message arrives at least once; make duplicates harmless.
- **Every queue gets a dead-letter queue, monitoring, and an owner.** Queues are infrastructure, not fire-and-forget.
- **Document your consistency choices:** which data is strongly consistent, which is eventually consistent, and why. (This is the 6.824 lesson: name your consistency model deliberately.)
- **Load-test the cache layer too** — Redis is fast until it isn't (big values, blocking commands, single-threaded bottlenecks).
- **Keep message schemas versioned** so producers and consumers can evolve independently.

### 🤖 Build rules

- **MUST** give every cached item a TTL — no eternal cache entries.
- **MUST** design an invalidation plan (which writes clear which keys) before adding any cache.
- **MUST** make queue consumers idempotent — assume duplicate delivery.
- **MUST** attach a dead-letter queue and alerting to every production queue.
- **SHOULD** default to a relational database unless a specific NoSQL strength is required — document the reason.
- **SHOULD** use idempotency keys on any endpoint that charges money or sends notifications.
- **NEVER** treat cache contents as durable or authoritative.
- **NEVER** let queues grow without depth/lag monitoring and a backpressure plan.

---

## 5.3 Servers & DevOps

### Core concepts

- **DevOps = you build it, you run it.** The wall between "developers" and "operations" is where outages breed. Modern teams own their code in production.
- **Linux in production:** your server is almost certainly Linux. Know processes, systemd services, file permissions, networking basics, and log locations cold. (The MU syllabus's Linux course is the seed; production is the tree.)
- **The 12-factor app:** the canonical checklist for cloud-native apps — one codebase, explicit dependencies, config in environment, stateless processes, logs as event streams, dev/prod parity, and more. Read it once, apply it forever.
- **Containers (Docker):** package your app + its dependencies into an image that runs identically anywhere. Solves "works on my machine" permanently — if you do it right.
- **Images vs containers:** the image is the blueprint (immutable); the container is the running instance (disposable). Never mutate a running container and call it a deploy.
- **CI/CD:** Continuous Integration (every commit builds + tests automatically) and Continuous Delivery/Deployment (every green build can — or does — go to production). The pipeline is the heartbeat of a professional team.
- **Cloud primitives:** compute (VMs/containers), object storage (S3-style blobs), managed databases, load balancers, CDNs, queues, DNS. Every cloud is the same Lego bricks in different colors (AWS, GCP, Azure).
- **Infrastructure as Code (IaC):** servers described in files (Terraform, Pulumi), version-controlled and reviewable — not clicked together in a console at 2 AM.
- **Environments:** dev (your laptop) → staging (prod-like, for verification) → production (real users). Staging must mirror prod closely or it's theater.
- **Reverse proxies (nginx/Caddy):** sit in front of your app to terminate TLS, serve static files, gzip, rate-limit, and route. Your app server should rarely face the internet directly.

### Techniques & methods

- **Dockerfile discipline:** multi-stage builds (compile in one stage, ship a slim runtime image), order layers from least- to most-changing for cache hits, run as a non-root user, pin exact base-image versions.
- **`.dockerignore`:** exclude `node_modules`, `.git`, secrets, and local junk — smaller images, faster builds, fewer leaked secrets.
- **docker-compose for local dev:** one command spins up app + database + Redis + queue exactly like production. New developer onboarding drops from days to minutes.
- **CI pipeline stages:** lint → unit tests → build → integration tests → security scan → push artifact. Fail fast: cheap checks first.
- **Zero-downtime deploys:** rolling updates (replace instances one by one behind the load balancer) or blue-green (full parallel environment, flip traffic). Health checks gate every step — an unhealthy instance never receives traffic.
- **Health check endpoints:** `/health` (alive?) and `/ready` (ready for traffic? DB reachable?). Load balancers and orchestrators depend on these.
- **Config via environment variables; secrets via a secrets manager** (AWS Secrets Manager, GCP Secret Manager, Vault) — never in code, never in images, never in chat logs.
- **Logs to stdout/stderr**, collected by the platform. Apps don't manage log files; the infrastructure ships them to one searchable place.
- **Database migrations run as a pipeline step** (before the new code goes live), using the expand-and-contract pattern from 5.1 so old and new code both work during the rollout.
- **Rollback plan for every deploy:** keep the previous artifact; know the one command that restores it. A deploy without a rollback plan is a gamble.

### Tips & tricks

- **Pin everything:** base images, dependency versions, Terraform provider versions. `latest` in production is a time bomb.
- **Small images = fast deploys = fast scaling.** Alpine or distroless bases; multi-stage builds. A 2 GB image nobody questioned is a deploy-speed tax forever.
- **One process per container.** Need nginx + app + cron? That's three containers (or a proper orchestrator), not one container running supervisord hacks.
- **Tag images with the git commit SHA.** "Which code is running in prod right now?" must have a one-command answer.
- **Caddy over nginx** if you want automatic HTTPS with zero config fuss for smaller setups.
- **Keep staging data realistic but scrubbed** — production data with real emails in staging is a breach waiting for an intern's laptop to be stolen.
- **Document the "oh no" commands:** how to roll back, how to scale up manually, how to drain a node. Write them when calm, read them when panicking.

### Common mistakes (the bad)

- **Snowflake servers:** hand-configured, undocumented, irreplaceable. When it dies, nobody knows how to rebuild it. (IaC exists precisely to kill this.)
- **Secrets in code, in images, in CI logs, in Slack.** Every one of these is a breach you'll discover via someone else's tweet.
- **No health checks:** the load balancer sends traffic to a dead instance for 10 minutes while users see errors.
- **Deploying Friday evening with no rollback tested.** The tradition of ruined weekends.
- **Dev/prod drift:** "it worked locally" because local runs SQLite, Node 22, and no reverse proxy, while prod runs Postgres, Node 18, and nginx. Parity matters.
- **Manual production changes** ("just this once, quick fix via SSH") that never make it back into IaC — the next automated deploy wipes them, or worse, nobody knows the real state.
- **No resource limits on containers:** one memory leak takes down the whole node instead of one container.
- **Ignoring disk space:** logs fill the disk, the database can't write, everything falls over. The most boring outage cause in existence.

### Best practices (the good)

- **Everything as code:** infrastructure, pipeline, config. If it isn't in version control, it doesn't exist.
- **Automate the boring parts:** deploys, backups, cert renewals, dependency updates. Humans are for judgment; machines are for repetition.
- **Immutable artifacts:** build once, deploy the same image everywhere. Never rebuild between staging and prod.
- **Staging mirrors production** as closely as budget allows — same OS, same versions, same architecture.
- **Monitor the pipeline itself:** a broken CI that nobody notices means untested code shipping.
- **Practice restores and rollbacks** (game days). The first time you test your rollback shouldn't be during a real outage.

### 🤖 Build rules

- **MUST** containerize with pinned base images and a non-root user; MUST include a `.dockerignore`.
- **MUST** expose `/health` and `/ready` endpoints on every service.
- **MUST** keep secrets out of code, images, and logs — environment or a secrets manager only.
- **MUST** have a tested rollback path before any production deploy.
- **SHOULD** use multi-stage Docker builds and keep images lean.
- **SHOULD** run database migrations as a pipeline step with backward-compatible (expand-and-contract) changes.
- **NEVER** make manual, undocumented changes to production infrastructure.
- **NEVER** deploy with the `latest` tag or unpinned dependencies.

---

## 5.4 Reliability Engineering

### Core concepts

- **Reliability is a feature.** Users don't care about your architecture; they care that it works. Every nine of uptime has a price — decide deliberately what you're buying.
- **Observability = logs + metrics + traces.** Logs (what happened), metrics (how much/how fast — aggregated numbers over time), traces (the journey of one request across services). You need all three; each answers questions the others can't.
- **SLI / SLO / SLA:** SLI (Service Level Indicator — what you measure, e.g. "99.5% of requests under 300ms"), SLO (the target you set), SLA (the contractual promise with consequences). SLOs turn "make it reliable" into engineering math.
- **Error budgets:** 100% − SLO = the budget you're allowed to "spend" on failures, risky deploys, and experiments. Blow the budget → freeze features, fix reliability. This is how Google's SRE teams make the speed-vs-stability tradeoff explicit instead of political.
- **Alerting:** pages (wake someone up) vs tickets (fix during work hours). The distinction is sacred.
- **Incident response:** detect → triage → mitigate → resolve → learn. Mitigation (stop the bleeding) comes before root cause (understand the disease).
- **Blameless postmortems:** after an incident, write what happened, why, and what changes — without naming and shaming. Blame makes people hide information; curiosity makes systems safer.
- **RPO / RTO:** Recovery Point Objective (how much data you can afford to lose — "backups every hour" = 1-hour RPO) and Recovery Time Objective (how fast you must be back — "30 minutes"). Every backup strategy is secretly an RPO/RTO decision.
- **Graceful degradation:** when a dependency fails, serve a simpler version rather than nothing. Recommendations down? Show bestsellers. Search degraded? Show categories.

### Techniques & methods

- **Structured logging (JSON):** every log line carries timestamp, level, service, request ID, and context fields. Grep-able today, queryable at scale tomorrow.
- **Correlation/request IDs:** generate one ID per incoming request, propagate it through every service and log line. Debugging a distributed failure without this is archaeology.
- **The four golden signals (Google SRE):** latency, traffic, errors, saturation. If your dashboard doesn't show these four for every critical service, you're flying blind.
- **RED method for services:** Rate, Errors, Duration. **USE method for resources:** Utilization, Saturation, Errors. Pick the lens that fits what you're measuring.
- **Alert on symptoms, not causes:** "checkout success rate dropped below 99%" pages someone; "CPU above 80%" is a ticket at best. Users feel symptoms.
- **Retries with exponential backoff + jitter:** retry failed calls, but wait longer each time (1s, 2s, 4s…) with random jitter so 1,000 clients don't retry in lockstep and crush the recovering service (retry storms).
- **Circuit breakers:** after N consecutive failures, stop calling the dependency for a while and fail fast instead. Prevents cascading failures — one slow service taking down everything that calls it.
- **Timeouts on everything:** every network call gets a deadline. No timeout = one hung dependency freezes your workers one by one until nothing responds.
- **Runbooks:** for every alert, a linked doc: "what this means, how to confirm, what to try first, when to escalate." Written when calm, followed when panicking.
- **Backup strategy:** 3-2-1 rule — 3 copies, 2 different media, 1 offsite. Automate it. Then regularly perform **restore drills**: actually restore to a scratch environment and verify. (Echoes 5.1's warning: untested backups are hopes.)
- **Disaster recovery tiers:** from "re-deploy from IaC + restore backup" (cheap, slower) to "hot standby in another region" (expensive, fast). Match the tier to the RTO the business actually needs.

### Tips & tricks

- **Log levels with discipline:** ERROR (needs action), WARN (suspicious, watch), INFO (normal operations), DEBUG (dev only, off in prod). Misleveled logs = alert noise or silent failures.
- **Sample high-volume traces:** keep 100% of errors, 1% of successes. Full-fidelity tracing of everything is a cost fire.
- **Dashboards for humans on call:** one screen per service — golden signals, recent deploys (annotated!), error breakdown. During an incident, the first question is always "what changed recently" — annotate deploys on every graph.
- **Synthetic monitoring:** a scripted user that logs in and buys something every 5 minutes. Catches "the site is up but checkout is broken" — which uptime checks miss entirely.
- **Kill-switches / feature flags for risky paths:** new payment flow misbehaving? Flip it off in seconds without a deploy.
- **Capacity headroom:** alert at 70% saturation, not 99%. Scaling takes time; running hot leaves no margin for traffic spikes.

### Common mistakes (the bad)

- **Alert fatigue:** 200 alerts a day, all ignored — including the one real fire. Every alert must be actionable; if nobody would do anything different, it's not an alert, it's a dashboard.
- **Paging humans for non-urgent issues.** 3 AM pages for "disk at 60%" trains the team to silence everything.
- **No runbooks:** every incident becomes improv theater, and the fix depends on who happens to be awake.
- **Blameful postmortems** ("who pushed this?") → people stop reporting near-misses → the next incident is bigger.
- **Retry without backoff:** hammering a struggling service with instant retries — the distributed-systems equivalent of shouting at someone who's drowning. (MIT 6.824's fault-tolerance lessons in miniature.)
- **No timeouts:** a single hung downstream call cascades into a full outage.
- **"We'll add monitoring after launch."** Launch is exactly when you need it most.
- **Single point of failure you forgot about:** one DNS provider, one region, one person with the credentials. Draw the dependency graph and stare at it.

### Best practices (the good)

- **Define SLOs for user-facing journeys** (signup, checkout, core API) and let error budgets govern deploy velocity.
- **Every incident produces a postmortem with action items** — and action items have owners and deadlines, or they're wishes.
- **Automate toil away:** if an alert fires weekly and the fix is always the same command, automate the command.
- **Game days / chaos drills:** deliberately break things in staging (kill a node, expire a cert) and practice the response. Calm teams are trained teams.
- **Design for failure from the start:** assume dependencies will fail, disks will fill, regions will go down. Hope is not a strategy.

### 🤖 Build rules

- **MUST** add structured logging with request/correlation IDs from the first commit — not "later."
- **MUST** set timeouts on every outbound network call.
- **MUST** implement retries with exponential backoff + jitter, never tight retry loops.
- **MUST** create runbooks for every alert the agent introduces.
- **SHOULD** define at least one SLO for the critical user journey and a dashboard showing the four golden signals.
- **SHOULD** include a kill-switch/feature flag for any risky new code path.
- **NEVER** ship a production system with zero observability ("we'll add monitoring later").
- **NEVER** page (or design paging) for anything that can wait until morning — reserve pages for user-impacting, time-critical failures.

---

## 5.5 Security for Builders

### Core concepts

- **Security is economics:** you can't be unhackable; you make attacks cost more than the reward. Prioritize by impact × likelihood.
- **The OWASP Top 10 (2021) — know it cold:**
  1. **Broken Access Control** — users accessing others' data (the #1 real-world issue: missing `WHERE user_id = ?` checks).
  2. **Cryptographic Failures** — sensitive data not encrypted, weak hashes, exposed keys.
  3. **Injection** — SQL, NoSQL, command, LDAP injection: untrusted input executed as code.
  4. **Insecure Design** — missing threat modeling; security never considered in the design phase.
  5. **Security Misconfiguration** — default creds, verbose errors, open cloud buckets, unnecessary features enabled.
  6. **Vulnerable & Outdated Components** — the library you installed in 2021 with a known CVE.
  7. **Identification & Authentication Failures** — weak passwords, broken session handling, credential stuffing.
  8. **Software & Data Integrity Failures** — unsigned updates, CI/CD pipeline compromise, deserializing untrusted data.
  9. **Security Logging & Monitoring Failures** — breached for months, nobody noticed.
  10. **SSRF (Server-Side Request Forgery)** — tricking your server into requesting internal resources (cloud metadata endpoints are the classic prize).
- **Authentication (AuthN) vs Authorization (AuthZ):** AuthN = "who are you?" (login). AuthZ = "are you allowed?" (permissions). Most breaches are AuthZ failures — logged in as Alice, reading Bob's invoices.
- **Hashing vs encryption:** hashing is one-way (passwords — you never need the original back); encryption is reversible (data you must read later). Never confuse them.
- **Defense in depth:** no single control is perfect — layer them (validation + parameterized queries + least-privilege DB user + WAF) so one failure doesn't mean total compromise.
- **The attacker only needs one way in; you must close them all.** Asymmetry is the defender's burden — which is why frameworks and checklists matter.

### Techniques & methods

- **Parameterized queries everywhere** (from 5.1, repeated because it matters most): the database treats input as data, never as code. This single practice kills nearly all SQL injection.
- **Output encoding / escaping:** when rendering user content in HTML, escape it. Better: use frameworks that escape by default, and use `textContent` over `innerHTML`.
- **Password storage:** Argon2id (best) or bcrypt (fine) with per-user salts and a sensible work factor. NEVER MD5/SHA-1/SHA-256 alone for passwords — they're built for speed, which is exactly what attackers want.
- **Sessions done right:** random, unguessable session IDs; `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookie flags; server-side session storage; absolute + idle timeouts; regenerate session ID on login.
- **JWT carefully:** short expiry, verify signature AND algorithm (never accept `alg: none`), don't store sensitive data in the payload (it's readable), prefer opaque tokens for sessions unless you need JWT's statelessness.
- **OAuth/OIDC via battle-tested libraries** — never hand-roll the protocol dance.
- **CSRF protection:** `SameSite` cookies + anti-CSRF tokens on state-changing requests.
- **Rate limiting:** per-IP and per-user limits on login, signup, password reset, and expensive endpoints. The cheapest defense against brute force and abuse.
- **Security headers:** `Content-Security-Policy` (limits where scripts can load from — the XSS killer), `Strict-Transport-Security` (HTTPS only), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **File uploads:** validate type by content (not extension), store outside the web root, serve with safe content types, scan if the threat model warrants it. Uploaded files are the classic shell-drop vector.
- **Dependency hygiene:** lockfiles committed, `npm audit` / Dependabot / Renovate running, automated PRs for security patches, minimal dependency footprint.
- **Secrets management:** env vars or a secrets manager (from 5.3); rotation procedures; never in repos, images, logs, or client-side code.
- **Threat modeling (lightweight):** for each feature ask four questions — what are we protecting, who wants it, how could they get it, what breaks if they do? Fifteen minutes that prevents entire vulnerability classes.

### Tips & tricks

- **Use a security checklist before every launch:** auth review, input validation audit, dependency scan, headers check, backup verification, secrets sweep (`git log` for accidental commits — tools like gitleaks).
- **Security.txt** (`/.well-known/security.txt`): tell researchers how to report vulnerabilities. Free bug reports from friendly hackers.
- **Principle of least privilege everywhere:** app DB user can't DROP tables; CI tokens can't push to prod; admin panels behind VPN or IP allowlist.
- **Fail closed:** when in doubt, deny. An error in permission logic should block access, not grant it.
- **Log security events** (logins, password changes, permission changes, admin actions) — you can't investigate what you didn't record. But never log passwords, tokens, or full card numbers.
- **Keep an SBOM-ish inventory** of critical dependencies for your most important services — when the next Log4Shell hits, "which of our services use this?" must be answerable in minutes.
- **Bug-bounty mindset on your own app:** before launch, spend an hour trying to break access control (change IDs in URLs, replay requests, skip steps in multi-step flows).

### Common mistakes (the bad)

- **Home-rolled cryptography.** Unless you're a cryptographer, you are not the exception. Use vetted libraries.
- **Storing API keys / secrets in frontend code.** Anything shipped to the browser is public. Backend proxy or scoped public keys only.
- **Verbose errors in production:** stack traces and SQL errors shown to users hand attackers a map of your system. Log details internally; show generic messages externally.
- **Open S3 buckets / databases bound to 0.0.0.0** with no auth. The most embarrassing breach category — fully automated scanners find these in hours.
- **Default credentials** on admin panels, databases, routers. Change them before the service is reachable.
- **Typosquat / malicious packages:** `npm install` of a lookalike name, or a compromised maintainer account. Pin versions, review lockfile diffs, prefer well-maintained packages.
- **Trusting client-side validation alone.** The browser is the attacker's computer. Every check must be re-done server-side.
- **Password reset tokens that don't expire** or are guessable — account takeover as a service.
- **Deserializing untrusted data** (pickle, Java serialization, YAML without safe loaders) — remote code execution gift-wrapped.
- **"Security through obscurity":** hidden admin URLs, obfuscated JS. Slows attackers by minutes; never a control.

### Best practices (the good)

- **Adopt a secure-by-default framework and its idioms** — then don't fight its protections (don't disable CSRF, don't turn off escaping).
- **Patch fast, especially internet-facing components.** Have a defined process: scan → assess → patch → verify, measured in days not quarters.
- **Separate duties:** devs don't have standing prod admin; break-glass access is logged and temporary.
- **Regular access reviews:** who has prod access, who has admin in the app — quarterly, minimum.
- **Backups are a security control too** (ransomware recovery) — encrypted, offline/offsite copies, tested restores (5.4).
- **Write the incident plan before the incident:** who declares, who communicates, when to involve legal, how to rotate compromised secrets.

### 🤖 Build rules

- **MUST** use parameterized queries for all database access — no string-built SQL, ever.
- **MUST** hash passwords with Argon2id or bcrypt (salted, proper work factor) — NEVER MD5/SHA-family alone, NEVER plaintext.
- **MUST** enforce authorization checks on every data access (verify the requesting user owns/can access the resource) — never rely on hidden URLs or client-side checks.
- **MUST** keep secrets out of code, repos, images, logs, and client bundles.
- **MUST** validate and sanitize all input server-side, regardless of client-side validation.
- **SHOULD** set security headers (CSP, HSTS, nosniff) by default.
- **SHOULD** rate-limit authentication and other abuse-prone endpoints.
- **SHOULD** run dependency vulnerability scans in CI and patch critical CVEs immediately.
- **NEVER** roll your own crypto, session, or OAuth implementation.
- **NEVER** expose stack traces, SQL errors, or internal details to end users in production.


---

# Part 6: AI, Games & The Builder's Playbook

*How to add intelligence to your software, how games are really built, how to run a project from idea to shipped, the definitive good-vs-bad catalog, and how an AI agent should use this book. Grounded in what top programs actually teach: Stanford CS231n (Deep Learning for Computer Vision), Stanford CS224N (NLP with Deep Learning), MIT 6.036 (Introduction to Machine Learning), CMU 15-466 (Computer Game Programming), CMU 53-353 (Understanding Game Engines).*

---

## 6.1 AI for builders

### Core concepts

- **ML vs rules:** rules = you encode the logic (if/else, regex, thresholds). ML = the machine learns patterns from data. Use rules when the logic is knowable and stable; use ML when the pattern is too fuzzy to hand-code — image recognition, recommendations, language understanding.
- **Supervised learning** (the framing MIT 6.036 is built on): learn from labeled examples. Your model is only as good as your labels — garbage labels, garbage model, no exceptions.
- **Overfitting vs generalization:** a model that memorizes training data fails on new data. Train/validation/test splits exist to catch this — Stanford CS231n drills this from day one, and skipping it is the most common beginner failure.
- **Representation matters more than the algorithm:** how you encode inputs (features, embeddings) decides success. Word vectors (CS224N: Word2Vec, GloVe) turned language into geometry — suddenly "king − man + woman ≈ queen" worked because the representation was right.
- **The earns-its-place test:** does ML beat a simple baseline (rules, heuristics, a keyword search) by enough to justify data collection, training, monitoring, and new failure modes? Most proposed ML features fail this test. Run it before building.
- **LLMs are pattern completers, not oracles:** they predict likely text. Everything downstream — structured output, tool calling, RAG — is scaffolding to make that reliable. Never forget what's underneath.

### Techniques & methods

- **LLM integration patterns:**
  - *Prompting:* system prompt sets role and hard rules; user prompt gives the task; few-shot examples show the format. Temperature 0–0.3 for factual/structured work, higher only for creative work.
  - *Structured output:* force JSON/schema via constrained decoding or validate-and-retry. Never parse free-form model text with regex when the model can emit JSON directly.
  - *Tool/function calling:* expose narrow, typed functions (`search_orders`, `create_ticket`); the model decides when to call, your code executes. Keep tools small, idempotent, and permission-checked.
  - *RAG (retrieval-augmented generation):* embed documents → vector store → retrieve top-k chunks → inject into prompt → generate with citations. The right answer for knowledge that changes. Beats fine-tuning for facts.
  - *Agents:* loop of think → act (tool) → observe → repeat, with a hard max-step budget and human approval gates before irreversible actions.
- **Classical ML pipeline** (the MIT 6.036 lineage): formulate the problem precisely → collect and label data → choose representation → train a baseline → validate with cross-validation → tune hyperparameters → evaluate once on held-out test data → monitor in production.
- **Evals:** a fixed set of representative inputs with expected outputs, re-run on every prompt or model change. Without evals you are flying blind — "it looked good in the demo" is not testing.
- **Fine-tuning vs RAG vs prompting:** prompt for behavior, RAG for knowledge, fine-tune for style/format at scale. Fine-tuning does not reliably inject facts — it teaches tone, not truth.
- **Guardrails:** validate inputs, validate outputs (schema + content filters), redact PII before third-party API calls, enforce rate limits, cost caps, and timeouts, and always have a fallback (cached answer or rules-based default).

### Tips & tricks

- Start with the dumbest thing that works: keyword search before vector search, templates before LLM generation, a regex before a classifier.
- Log every prompt, completion, tool call, timestamp, and cost. Debugging LLMs without traces is guessing.
- Cache aggressively: identical prompts get identical answers; add semantic caching for near-duplicates.
- Chunk for RAG by meaning (paragraphs, sections), not fixed character counts; overlap chunks slightly; store metadata (source, date) so answers can cite.
- Version prompts like code; A/B every change against your eval set.
- Route work by difficulty: small cheap models for classification and triage, big models only where quality demands it.
- Set `max_tokens` deliberately — runaway generations burn money silently.
- Use embeddings beyond RAG: search, dedup, clustering, and anomaly detection are all the same trick.

### Common mistakes (the bad)

- Using an LLM where a regex or database query would do — slower, costlier, less reliable, harder to debug.
- Trusting model output without validation. Hallucinations are confident lies; the model does not know what it doesn't know.
- No evals. You changed the prompt, quality dropped 20%, nobody noticed for a month.
- Shipping PII or secrets to third-party APIs without redaction or a data-processing agreement.
- RAG with no chunking strategy and no relevance tuning — garbage retrieval in, garbage answers out.
- Unbounded agents: no step limits, no approval gates, and suddenly it deleted the staging database "to clean up."
- Fine-tuning to teach facts. It teaches style; the facts still hallucinate.
- Ignoring latency. A 20-second chain kills UX — users leave at ~3 seconds.
- Training on biased or unrepresentative data, then acting surprised. MIT 6.036's real-world exercises exist precisely for this: bias in word embeddings, filter bubbles and feedback loops, Simpson's paradox, adversarial examples, reward hacking.

### Best practices (the good)

- Define the decision the model output drives and the cost of being wrong *before* training anything.
- Always build the baseline first (rules/heuristic). ML must beat it clearly to earn its place.
- Tune on validation, report on test, never peek at test during development. (CS231n's discipline, non-negotiable.)
- Monitor production: input drift, sampled output quality, latency, cost per request.
- Design for graceful degradation: when the model fails, fall back to rules or a safe default — never a blank screen.
- Keep humans in the loop for irreversible, high-stakes actions: payments, deletions, legal or medical text.
- Document model limitations where users can see them. Honesty is a feature.

### 🤖 Build rules

1. MUST build a rules-based baseline before any ML/LLM feature, and beat it on evals to justify the complexity.
2. MUST validate all LLM output against a schema; NEVER trust raw model text for critical logic.
3. MUST maintain an eval set and re-run it on every prompt or model change.
4. MUST redact PII/secrets before any third-party AI API call.
5. MUST cap agent loops with max steps and require human approval for irreversible actions.
6. MUST set cost and latency budgets per AI feature and alert when exceeded.
7. SHOULD prefer RAG over fine-tuning for knowledge; SHOULD prefer prompting over fine-tuning for behavior.
8. NEVER let AI make financial, legal, medical, or deletion decisions unsupervised.
9. NEVER ship an AI feature without a fallback path when the model fails or times out.
10. MUST log prompts, outputs, tool calls, cost, and latency for every AI interaction.

---

## 6.2 Games

### Core concepts

- **The game loop:** input → update (fixed timestep for simulation) → render, every frame. Fixed timestep keeps physics deterministic; rendering interpolates between ticks. CMU 53-353 teaches the loop as the foundation everything else hangs on.
- **Frame budget:** at 60fps you have 16.6ms per frame — total, shared by physics, AI, and rendering. Every feature spends from the same wallet.
- **Entity-Component-System (ECS):** entities are IDs, components are pure data, systems are logic. Composition over inheritance; cache-friendly and scales. The alternative — deep inheritance trees — collapses under a real game.
- **Game feel beats realism:** players want responsive and fair, not physically accurate. Juice (screenshake, particles, sound) matters more than correct physics.
- **Game AI is state machines and behavior trees** (idle → patrol → chase → attack), not neural networks. Simple, debuggable, shippable.
- **Client-server authority:** the server is the source of truth; clients are dumb terminals that predict. This one principle decides your entire multiplayer architecture.

### Techniques & methods

- **Engine choice — honest tradeoffs:**
  - *Unity (C#):* fastest to ship, huge asset store, great for mobile/indie/2D. High-end 3D visuals trail Unreal.
  - *Unreal (C++/Blueprints):* best visuals out of the box, Blueprint visual scripting for non-programmers, strong for PC/console. Heavier, steeper learning curve, royalty past a revenue threshold.
  - *Godot (GDScript/C#):* free and open-source, zero royalties, lightweight, excellent 2D. Smaller ecosystem and hiring pool, fewer AAA-grade 3D features.
  - *Custom engine (C++/OpenGL — the CMU 15-466 way):* maximum learning and control; a terrible idea for shipping on a deadline.
  - Rule of thumb: pick the engine your team already knows, unless visuals (Unreal) or cost/2D (Godot) force the choice.
- **Physics basics:** fixed-timestep integration; collision detection in two phases — broadphase (spatial partitioning, quadtrees) to find candidates, narrowphase (shape-vs-shape tests) for precision; collision response via impulse, friction, restitution. Use the engine's physics; don't write your own for a shipping game.
- **Multiplayer networking:** authoritative server; *client-side prediction* (client simulates its own movement instantly so input feels responsive); *server reconciliation* (correct the client when the server disagrees); *entity interpolation* (smoothly render other players between snapshots); *lag compensation* (server rewinds to the shooter's timestamp for hit detection). Bandwidth discipline: send deltas, not full state; 10–20 snapshots/sec is typical.
- **Asset pipeline:** source assets (PSD, FBX, WAV) → automated import/convert → compressed runtime formats → bundles/packs → streaming and LOD. Automate it fully — artists should never hand-convert files. CMU 15-466 treats pipelines as first-class systems alongside runtime code, and it's right.
- **Optimization:** profile first, never guess. Batch draw calls, use LOD models, atlas textures, pool objects (zero per-frame allocation), spatial partitioning for queries.

### Tips & tricks

- Prototype the core loop in days with gray-box art. If it's not fun with boxes, art won't save it.
- Object pooling for bullets, particles, enemies — allocation spikes cause frame hitches.
- Keep simulation tick and render frame separate; interpolate rendering between ticks.
- Match netcode to genre: deterministic lockstep for RTS, prediction/reconciliation for shooters.
- Record inputs and replay them — deterministic reproduction turns "random" bugs into fixable ones.
- Build the asset pipeline before you have 500 assets, not after.

### Common mistakes (the bad)

- Writing your own engine or physics for a shipping game — years of work the engine gives you free.
- Variable-timestep physics — different behavior at different framerates, nondeterministic bugs.
- Trusting the client. Without server validation, cheaters own your game within a week.
- Deep inheritance hierarchies for game objects (`Player extends Character extends Entity…`) — use ECS/composition.
- Premature optimization without profiling — or no optimization until launch week. Both kill.
- No object pooling — GC/allocation spikes murder frame rate on real devices.
- Shipping multiplayer without lag compensation — unplayable above ~50ms ping.
- Scope explosion: MMO dreams on a solo-dev schedule.

### Best practices (the good)

- Fixed-timestep simulation, interpolated rendering. Always.
- Authoritative server; validate every input; never trust the client.
- ECS or composition-based architecture for game objects.
- Profile-driven optimization against an explicit frame budget.
- Automated asset pipeline with validation (naming, sizes, formats, budgets).
- Playtest early and often with real players — never only the team.
- Version everything: code, assets, build configs, and the engine version itself.

### 🤖 Build rules

1. MUST use fixed-timestep simulation; NEVER tie game logic to variable frame delta.
2. MUST validate all client input server-side; NEVER trust the client for game state.
3. MUST profile before optimizing; set a frame budget (e.g., 16.6ms) and enforce it.
4. MUST use object pooling for frequently spawned/destroyed entities; NEVER allocate per-frame in hot loops.
5. MUST implement prediction + reconciliation + lag compensation for real-time multiplayer.
6. MUST automate the asset pipeline; NEVER rely on manual asset conversion.
7. SHOULD choose ECS/composition over deep inheritance for game objects.
8. SHOULD prototype the core loop with placeholder art before investing in assets.
9. NEVER write a custom physics engine for a shipping game — use the engine's.
10. MUST support deterministic input replay for debugging.

---

## 6.3 The Builder's Playbook

### Core concepts

- **MVP** = the smallest thing that tests your riskiest assumption. Not "a small version of everything" — one bet, tested fast.
- **Milestones are demo-able outcomes** ("user can sign up and pay"), not tasks ("work on auth"). If you can't demo it, it's not a milestone.
- **Estimation:** humans estimate the happy path. Multiply by 2–3×, or estimate in ranges, then calibrate against your actual velocity.
- **Root-cause debugging:** symptoms lie. Find the actual cause, fix it there, verify the symptom is gone. Everything else is whack-a-mole.
- **Done means:** works, tested, reviewed, documented, deployed, monitored. "Code written" is maybe 40% of done.

### Techniques & methods

- **Scoping an MVP:** list every feature → mark must-have vs nice-to-have → cut until it hurts → define the single success metric. If you can't state the metric, you don't have an MVP yet.
- **Planning:** break work into 1–2 week milestones, each ending in something demo-able. Dependencies first; riskiest unknowns earliest.
- **Estimation that works:** break tasks into ≤1-day chunks; estimate ranges, not points of false precision; three-point estimate = (optimistic + 4×likely + pessimistic) / 6; track actuals and calibrate your personal multiplier.
- **The root-cause debugging method:**
  1. Reproduce reliably — script the repro if you can.
  2. Narrow the scope — bisect: does it still happen with X removed?
  3. Form one hypothesis; test it with the smallest possible experiment.
  4. Read the actual error and data — don't guess.
  5. Fix at the root, not the symptom.
  6. Verify the fix, add a regression test, write down the cause.
- **The pre-ship checklist:** tests pass · no secrets in code · error handling on all I/O · backups verified by restore · monitoring and alerts live · rollback plan exists · docs updated · performance acceptable · security basics covered · analytics on key flows.

### Tips & tricks

- Rubber-duck debugging: explain the bug out loud. The flaw usually surfaces mid-sentence.
- Change one thing at a time while debugging. Change two and you'll never know which mattered.
- `git bisect` for regressions: binary-search your history for the breaking commit in minutes.
- Keep a bug journal. Root causes repeat across projects — yours have a pattern.
- Timebox rabbit holes: 30 minutes stuck → ask for help or switch strategy. Pride is expensive.
- Ship behind feature flags: deploy code without releasing it; rollback becomes a toggle.

### Common mistakes (the bad)

- Building the full vision instead of the MVP — months of work before any validation.
- Estimating only the happy path; forgetting integration, testing, review, and deployment time.
- Fixing symptoms (retry loops around a broken query) instead of root causes (the missing index).
- "Works on my machine" shipping: no staging, no checklist, no verification.
- Debugging by randomly changing things until it works — you'll break it again later and never know why.
- No rollback plan. Deploying on Friday evening. These two love each other.

### Best practices (the good)

- Demo-able milestones, weekly. Momentum is a feature.
- Written plan before code: what, why, how, and what "done" means.
- A regression test for every bug fixed — the bug should never come back silently.
- Checklists for shipping. Pilots use them because memory fails under pressure; so does yours.
- Blameless postmortems: fix the system, not the person.
- Keep the main branch always deployable.

### 🤖 Build rules

1. MUST produce a written plan (scope, milestones, done-criteria) before writing code for any non-trivial task.
2. MUST reproduce a bug reliably before attempting a fix.
3. MUST fix root causes; NEVER ship a symptom patch without a tracked follow-up for the real fix.
4. MUST add a regression test for every bug fixed.
5. MUST run the pre-ship checklist before marking anything done.
6. MUST estimate in ranges and track actuals to calibrate.
7. SHOULD timebox debugging (30 min), then escalate or change strategy.
8. NEVER deploy without a rollback plan.
9. NEVER commit secrets; NEVER ship without error handling on I/O boundaries.
10. MUST keep the main branch deployable at all times.

---

## 6.4 The Good vs Bad catalog

*The definitive do/don't list. Thirty goods to adopt, thirty bads to avoid — each with the one-line why.*

### ✅ The 30 goods

1. **Version-control everything** — because `final_v2_REAL` is how work gets lost.
2. **Small, frequent commits** — because bisecting 3 lines beats bisecting 3,000.
3. **Automated tests for critical paths** — because humans forget, machines don't.
4. **Code review before merge** — because a second pair of eyes catches what familiarity hides.
5. **CI running tests on every push** — because broken main branches compound silently.
6. **Secrets in vaults/env, never in code** — because repos leak and logs get read.
7. **Input validation at every boundary** — because all input is hostile until proven otherwise.
8. **Parameterized queries / ORMs** — because string-built SQL is an injection waiting to happen.
9. **Least-privilege access** — because a compromised component should damage as little as possible.
10. **Backups tested by restoring** — because an untested backup is a hope, not a plan.
11. **Monitoring + alerts on errors, latency, cost** — because users won't tell you; they'll leave.
12. **Structured logging with correlation IDs** — because debugging without traces is archaeology.
13. **Idempotent operations** — because networks fail and webhooks double-deliver; retries must be safe.
14. **Indexes on queried columns** — because full table scans don't survive past toy data.
15. **Pagination on every list endpoint** — because "return all rows" is a DoS you wrote yourself.
16. **Rate limiting on public endpoints** — because the internet will test your capacity for free.
17. **Timeouts on every external call** — because one slow dependency shouldn't freeze your whole app.
18. **Graceful degradation / fallbacks** — because partial service beats total outage.
19. **Feature flags for risky releases** — because instant rollback beats hotfix roulette.
20. **Migrations for schema changes, never manual edits** — because prod and dev must stay in sync.
21. **Docs for setup and architecture decisions** — because future-you is a stranger.
22. **User-friendly errors; stack traces only in logs** — because users need guidance, attackers need nothing.
23. **HTTPS everywhere + secure cookies** — because plaintext is readable by everyone in between.
24. **Pinned dependencies + vulnerability scanning** — because your app is only as safe as its weakest library.
25. **Load testing before launch** — because launch day is the worst time to discover limits.
26. **Accessibility basics (labels, contrast, keyboard)** — because many users need it and everyone benefits.
27. **Mobile-first responsive design** — because most of the world meets you on a phone.
28. **Caching with an invalidation strategy** — because recomputing everything is the slowest correct answer.
29. **Queue long work; never block requests** — because users won't wait 30 seconds for a response.
30. **Delete dead code** — because code you don't run still costs reading, testing, and confusion.

### ❌ The 30 bads

1. **Hardcoded secrets** — because every repo eventually gets seen by someone it shouldn't.
2. **Rolling your own auth/crypto** — because the bugs are subtle and catastrophic; use proven libraries.
3. **SELECT \* in production** — because schema changes break things silently and you fetch data you don't need.
4. **N+1 queries** — because 1,001 round-trips turn a page load into a slideshow.
5. **No database backups** — because disks die and humans drop tables.
6. **Client-side validation only** — because attackers don't use your UI.
7. **Silently swallowed exceptions** — because hidden failures become mystery outages.
8. **Catch-all handlers that hide the cause** — because you can't fix what you can't see.
9. **Deploying Friday evening without flags/rollback** — because weekend outages are the most expensive kind.
10. **"Temporary" hacks with no tracked follow-up** — because temporary is permanent without a ticket.
11. **Copy-paste instead of abstraction** — because the bug you fix in one copy lives on in five others.
12. **Premature optimization** — because you'll perfect code that gets deleted while the real bottleneck hides.
13. **No optimization where it matters (after profiling)** — because hope is not a scaling strategy.
14. **Splitting into microservices too early** — because distributed systems multiply failure modes before you have the team to run them.
15. **Shared mutable global state** — because spooky action at a distance is undebuggable.
16. **Synchronous chains of external calls** — because latency adds up and one failure cascades.
17. **No request timeouts** — because one hung dependency takes down everything waiting on it.
18. **Weak password storage** — because breaches happen; make the loot worthless with strong hashing.
19. **Stack traces / debug endpoints in prod** — because you're handing attackers a map.
20. **Ignoring mobile performance** — because your users' phones are slower than your laptop.
21. **Heavy assets autoplaying on load** — because bounce rates track load times.
22. **No analytics on key flows** — because you can't improve what you don't measure.
23. **Vanity metrics** — because "page views up" tells you nothing about the business.
24. **Feature creep without user evidence** — because every feature charges maintenance rent forever.
25. **Rewriting from scratch instead of refactoring** — because old code contains years of bug fixes you'll re-learn painfully.
26. **Not reading the docs of libraries you depend on** — because misuse of a good tool is indistinguishable from a bad tool.
27. **Pinning to `latest` in production** — because a surprise major version picks the worst moment.
28. **Manual deploys via FTP/SSH copy** — because humans are inconsistent and there's no audit trail.
29. **No staging environment** — because production is not a testing ground.
30. **Skipping the retrospective** — because teams that don't learn repeat the same failures.

### 🤖 Build rules

1. MUST check every change against this catalog before marking work done — goods adopted, bads absent.
2. MUST treat any item in the ❌ list as a blocking issue in code review, not a nitpick.
3. NEVER introduce a new ❌ item to "move fast" — speed gained is debt with interest.
4. MUST fix ❌ items found in existing code with a tracked follow-up, prioritized by blast radius.
5. SHOULD add project-specific goods/bads to this catalog as the team learns them.
6. NEVER let "we'll fix it later" leave the conversation without a ticket, an owner, and a date.

---

## 6.5 How to use this book as an AI agent

### Reading order by project type

Read only what the task needs, in this order. Skim the rest.

- **Marketing website / landing page:** web fundamentals → UI/UX & design → performance & SEO → deployment → pre-ship checklist (6.3).
- **Web app / SaaS:** scoping & MVP (6.3) → databases & data modeling → APIs & backend → auth & security → testing → cloud & deployment → AI features (6.1) only if the product needs them.
- **Mobile app:** platform fundamentals → mobile architecture & state → local storage & sync → APIs → security → store deployment → pre-ship checklist (6.3).
- **Automation / scraper / workflow:** scripting & HTTP → data parsing → storage → scheduling & reliability → monitoring → cost controls.
- **Game:** game loop & architecture (6.2) → engine choice → physics → asset pipeline → networking (if multiplayer) → optimization → playtesting.
- **AI feature:** the earns-its-place test (6.1) → evals first → simplest integration pattern that works → guardrails → cost/latency budgets → fallbacks.

General rule: **6.3 (Playbook) and 6.4 (Good vs Bad) apply to every project type, every time.** Read those two fully before anything else.

### The planning protocol: read → plan → verify → build → test

1. **Read.** Identify the project type above; read the relevant chapters and the 🤖 Build rules inside them. Do not start from a blank slate when a book exists.
2. **Plan.** Write the plan down: scope (in/out), milestones with demo-able outcomes, technical approach, risks, and done-criteria. Present it before writing code.
3. **Verify.** Check the plan against the 6.4 catalog and the relevant Build rules. Confirm ambiguous requirements with the human *now* — it's 10× cheaper than after code exists.
4. **Build.** Small steps, reviewable diffs. Follow the Build rules of every chapter you read. Never present untested code as working.
5. **Test.** Run the project's tests plus your own verification of the acceptance criteria. Then self-review (below) before declaring done.

### When to ask the human

- Requirements are ambiguous **and** the choice has real cost (architecture, data model, paid services, public UX).
- Any irreversible action: deletions, migrations on production data, publishing, spending money, sending messages to real users.
- Security-sensitive code: auth, payments, crypto, permissions — implement, then explicitly flag for human review.
- You are about to violate a Build rule or introduce a 6.4 ❌ item "temporarily."
- You're stuck in a loop: same approach failing twice → stop, summarize, ask.
- Never ask about things you can verify yourself (docs, code, tests). Asking is for judgment calls, not lookups.

### Self-review against the Build rules

Before declaring any task done, run this checklist:

1. Did I read the relevant chapters first, or did I improvise?
2. Does the change pass every applicable 🤖 Build rule? (Quote the ones you checked.)
3. Does it introduce any 6.4 ❌ item? If yes — it's not done.
4. Did I test it, or did I only read it? ("Looks right" is not tested.)
5. Are secrets, PII, and credentials handled correctly?
6. Is there a rollback path if this breaks in production?
7. Would I bet my reputation that the diff does what the plan said? If not, say so explicitly.

Report the self-review honestly. "I could not verify X" is a valid and respected outcome — hiding it is not.

### 🤖 Build rules

1. MUST read 6.3 and 6.4 fully before starting any project, then read the chapters for the project type.
2. MUST follow the planning protocol (read → plan → verify → build → test) on every non-trivial task.
3. MUST present the plan and get confirmation before writing code on ambiguous or high-stakes work.
4. MUST ask the human before irreversible actions, security-sensitive code paths, or breaking a Build rule.
5. MUST run the self-review checklist before declaring done — and report gaps honestly.
6. SHOULD keep a decision log of architectural choices and why, so future sessions inherit the reasoning.
7. NEVER present untested code as working; NEVER hide uncertainty behind confident language.

---

## 6.6 Vibecoding: Do's and Don'ts

*Vibecoding — building software by describing what you want in natural language and letting an AI coding agent write the code (term popularized by Andrej Karpathy, 2025). Since coding agents will use this book, this chapter is their operating manual. The techniques here are agent-durable: they work regardless of which model sits underneath, because they rely on process, not model cleverness.*

### Core concepts

- **What vibecoding is:** you describe intent in natural language; the agent explores the repo, writes code, runs commands, and iterates. You are the architect and reviewer; it is the fast junior engineer.
- **Where it shines:** prototypes and MVPs, boilerplate and scaffolding, well-understood tasks (CRUD, form validation, API clients), migrations with clear patterns, writing tests for existing code, and exploring unfamiliar codebases ("explain this module").
- **Where it fails:** novel architecture with real tradeoffs, security-critical code (auth, payments, crypto) without human review, deep debugging of subtle state/timing issues, and any task where the requirements live only in your head. The agent cannot read your mind — unstated requirements become wrong code delivered confidently.
- **The fundamental asymmetry:** the agent is extremely fast and has no judgment. Speed without judgment is a liability unless *you* supply the judgment — through plans, constraints, reviews, and tests.
- **You are still the engineer.** If you can't read and maintain the code the agent wrote, you don't own your codebase — you're renting it, and the rent is due at 2am during an outage.
- **Models change; process doesn't.** The model under your agent will be upgraded, swapped, and subtly altered. Prompt tricks that exploit one model's quirks rot. Written plans, acceptance criteria, tests, and review discipline survive every model change.

### Techniques & methods

- **The core loop:** prompt (precise, with context) → review the diff → run and test it yourself → refine. Never skip a step. "Prompt → accept" is not a loop, it's a gamble.
- **Plan-before-code:** for anything beyond a trivial fix, ask for a written plan first — files to touch, approach, risks, how it will be tested. Review the plan, correct it, *then* authorize execution. A bad plan executed fast is just fast damage.
- **Acceptance criteria up front:** define "done" before the agent starts — behaviors, edge cases, tests that must pass. If you can't define done, you're not ready to delegate.
- **Small, reviewable steps:** one feature or fix per task. A 2,000-line diff nobody read is not "done," it's a liability with a commit message.
- **Constrain the blast radius:** name exact files and directories; explicitly state what's off-limits ("don't touch auth/", "don't change the schema"). Agents default to the widest interpretation of vague instructions.
- **Examples over adjectives:** show input/output examples, point at existing code that follows the pattern you want ("follow the pattern in `orders/service.ts`"). "Make it clean" means nothing; an example means everything.
- **State what NOT to do:** "don't add new dependencies," "don't refactor unrelated code," "don't change public API signatures." Forbidden lists are as important as instructions.
- **Ask for alternatives when tradeoffs exist:** "propose 2–3 approaches with tradeoffs before implementing." This converts the agent from a code typist into a thinking partner — and surfaces options you'd have missed.

### Coding with AI agents: tips, tricks, techniques & methods

*The user codes daily with AI coding agents — primarily **Antigravity** (Google's agentic IDE) and **ChatGPT Codex** (cloud agent), sometimes others. This section is the practical field manual.*

#### A. Working method (agent-agnostic)

- **Context engineering beats prompt engineering.** Maintain an `AGENTS.md` (or repo rules file) at the repo root: how to run tests, code style, architecture boundaries, forbidden patterns. Point the agent at exact files; give it a repo map ("auth lives in `src/auth/`, DB layer in `src/db/`"); never make it guess the codebase. An agent with perfect context and a mediocre prompt beats a brilliant prompt with no context.
- **Plan-before-code, always.** Get the written plan, review it like a tech lead, then authorize. For complex work, make planning and execution separate tasks — the planning task's output becomes the execution task's input.
- **One feature per task, commit before every agent run.** `git commit` (or stash) before the agent touches anything, so revert is one command. Reviewable diffs only; if the diff is too big to review, the task was too big.
- **The verification loop is mandatory:** the agent must run tests, typecheck, and lint after its changes and show you the output. Then *you* re-run the critical paths yourself. Agent-run tests prove the agent believes it works; your run proves it works.
- **Acceptance criteria up front, in writing.** Behaviors, edge cases, performance bounds, tests to add. The agent works to the criteria; you verify against them.
- **Supervise actively.** Watch it work; interrupt the moment it drifts. Never leave it unsupervised 30 minutes on ambiguous work — drift compounds, and you'll pay for 30 minutes of confident wrongness with an hour of cleanup.
- **Keep a decision log.** Every architectural choice the agent made, and why, in a `DECISIONS.md` or the PR description. Six months later (or six sessions later), "why is it built this way?" must have an answer.

#### B. Agent-specific techniques

- **Antigravity (agentic IDE):** use its planning flow — let it produce the plan artifact first and review it before execution begins. Let it use the browser to check current docs for libraries (APIs change; the model's memory doesn't). Review every generated artifact before accepting it into the codebase. Run it mission-control style: break the work into small tasks, authorize each, verify each.
- **Codex (cloud agent):** best for well-scoped, self-contained tasks. Use the PR-based workflow and review the PR diff line by line — exactly like a senior reviewing a junior's PR. Run CI before merging, no exceptions. Don't hand it sprawling multi-system refactors; scope it tight and it excels.
- **When the model underneath upgrades:** re-verify your standard prompts and rules files — behavior changes silently across model versions. Keep prompts versioned in files (not in chat history) so you can diff, test, and roll back. What worked last month may misbehave today; your eval is the ground truth, not your memory.

#### C. Prompting techniques that actually work

- Be specific with file paths, function names, and constraints. "In `src/billing/invoice.ts`, add proration following the existing pattern in `calcDiscount()`; don't touch `src/auth/`; don't add dependencies."
- Give input/output examples for any non-trivial logic — two examples pin down behavior better than two paragraphs.
- State what NOT to do explicitly (no new deps, no refactors outside scope, no schema changes, no public API changes).
- When tradeoffs exist, ask for 2–3 options with pros/cons before it writes code.
- Ask it to explain its approach *before* implementing on anything risky — wrong approaches are cheap to reject in prose, expensive to reject in code.
- Iterate on the prompt, not just the code: if the output is wrong twice, the prompt (or the plan) is wrong. Fix the instruction, don't keep re-rolling.

#### D. Anti-patterns specific to agent coding

- **Vague one-liner prompts for complex features** ("add payments") — you get confident, wrong, sprawling code.
- **Letting it refactor the whole repo.** Scope creep is the agent's native language; constrain it or it will "improve" everything it touches.
- **Silent dependency additions.** Every new dependency is a supply-chain, security, and maintenance commitment — require explicit approval.
- **"Fixing" by adding complexity layers.** Wrappers around wrappers around the bug. If the fix adds indirection instead of removing the cause, reject it.
- **Sycophancy.** The agent agreeing with your bad idea instead of pushing back. Counter it: "challenge this plan — what's wrong with it?" Reward pushback in your rules file.
- **Confidently implementing the wrong requirement.** The most expensive failure mode: perfect code for the wrong problem. This is why plans and acceptance criteria exist.

#### E. Problems & limits (know them cold)

- **Non-determinism:** the same prompt can produce different code across runs. That's why review, tests, and version control are load-bearing — not optional.
- **Context rot:** in long sessions the agent forgets early decisions and contradicts itself. Fix: start fresh sessions per task, keep `AGENTS.md` and the decision log as persistent memory, and re-state critical constraints in each new session.
- **Plausible-but-wrong code:** hallucinated APIs that look real, subtle logic bugs in edge cases, tests that assert the wrong thing. It compiles, it runs, it's wrong. Only careful review and real tests catch this.
- **Security review is still human-mandatory** for auth, payments, crypto, and permissions. The agent writes the draft; a human (or a dedicated security review pass with explicit threat-model prompting) signs off.
- **Skill atrophy is real.** If you stop reading code, you stop being able to review it — and then you can't supervise the thing writing it. Read every diff. Stay sharp on fundamentals. The agent is a multiplier of your judgment, not a replacement for it.

### Tips & tricks

- Keep a personal prompt library in files: your best task prompts, versioned, refined over time. Good prompts are assets.
- Ask the agent to find relevant code before writing new code ("find how we handle X elsewhere first") — consistency beats novelty.
- Use the agent as a reader, not just a writer: "explain this module," "find all callers of this function," "what breaks if I change this signature?"
- After a good session, ask: "summarize what changed and why, in 5 bullets for the commit message." Good summaries, free documentation.
- When the agent is stuck in a loop, stop it, shrink the task, and restate the constraint it's violating. More context, smaller scope.
- Periodically ask it to audit its own work against your rules file: "check this diff against AGENTS.md and list violations." A second pass with fresh eyes — even artificial ones — catches things.
- For unfamiliar libraries, have the agent fetch current docs (via its browser) rather than trusting its training memory. APIs change; memory doesn't.

### Common mistakes (the bad)

- Blindly accepting diffs. If you didn't read it, you didn't review it — you just merged hope.
- Huge sweeping changes nobody reviewed. The bigger the diff, the lower the review quality; keep tasks small.
- Hallucinated APIs that look plausible — the code compiles in your head but the function doesn't exist. Always verify against real docs.
- Subtle logic bugs in edge cases — the happy path works, the 2am edge case doesn't. This is where agents fail most quietly.
- Dependency bloat — three new libraries for a 20-line task. Every dependency is future maintenance.
- Pasting secrets into prompts — API keys, tokens, private data in chat become training-adjacent data and log entries. Never.
- Assuming "looks right" means works. Reading is not testing. Run it.
- Context rot across long sessions — the agent quietly forgets constraints from an hour ago and contradicts them.
- Vibecoding code you can't maintain yourself — if you couldn't have written it, you can't fix it at 2am. Learn it or don't ship it.
- Letting the agent "just handle" security-critical code without human review. See 6.4, bad #2.

### Best practices (the good)

- Review every diff, line by line, like a senior reviewing a junior. No exceptions, no matter how small the change looks.
- Run and test everything yourself. The agent's green checkmark is a claim; your run is the verification.
- Commit before every agent run. Revert must always be one command away.
- Human review is mandatory for auth, payments, crypto, and permissions code — flag it explicitly every time.
- Pin dependencies; require explicit approval for any new one.
- Never put secrets in prompts. Use env files and vaults; the agent reads config, not chat.
- Keep prompts, rules, and plans in versioned files — not in ephemeral chat history.
- Separate planning from execution on complex work; review the plan before authorizing code.
- Maintain `AGENTS.md` + a decision log as the project's persistent memory across sessions.
- Stay able to write the code yourself. Review every diff, read the tricky parts twice, and keep your fundamentals sharp — supervision requires competence.

### 🤖 Build rules

1. NEVER present untested code as working. "I wrote it" is not "it works" — show test output.
2. MUST show the diff (or a precise file-by-file summary) before applying large changes; MUST get explicit approval first.
3. MUST ask when requirements are ambiguous rather than guessing — especially on irreversible, security-sensitive, or costly work.
4. MUST produce a written plan and acceptance criteria before implementing anything non-trivial.
5. MUST run tests, typecheck, and lint after changes and report the results honestly, including failures.
6. MUST state what you did NOT verify. "I could not verify X" is mandatory honesty, not weakness.
7. NEVER add dependencies, change schemas, alter public APIs, or refactor out-of-scope code without explicit approval.
8. NEVER include secrets, tokens, or private data in prompts, code, or commit messages.
9. MUST keep changes small and reviewable — one feature/fix per task; if the diff is too big to review, split the task.
10. MUST challenge the human's plan when it conflicts with the 6.4 catalog or these rules — sycophancy is a bug, not politeness.
11. SHOULD check your own diff against the project's AGENTS.md/rules file and list violations before declaring done.
12. SHOULD propose 2–3 approaches with tradeoffs when the task involves a real design decision.


---

## 6.7 The Audit-Fix-Audit Trap: paradoxes of building with AI

*The loop you know too well: one AI writes the code, four other AIs audit it, you turn findings into fix-prompts, the coder AI "fixes" everything, you audit again — and three weeks later the app still has obvious glitches nobody caught. This chapter names what's happening, why LLMs do it, and the exact protocol to escape.*

### Core concepts

**Your loop has a shape. Here it is:**
1. Coder AI builds → 2. Panel of auditor AIs reviews → 3. Findings become fix-prompts → 4. Coder AI applies fixes → 5. Re-audit → 6. New findings → back to 3. **There is no exit condition**, so it runs until you get exhausted, not until the software is good.

**The terms you were reaching for — it's not one term, it's a cluster:**

- **Bike-shedding (Parkinson's Law of Triviality).** People (and AIs) spend disproportionate effort on trivial, easy-to-judge issues — naming, style, micro-patterns — while hard, important questions ("does this actually work?") get skipped. Every auditor AI needs to *produce findings to look useful*, and trivial findings are the cheapest to produce. So round after round fills up with nits while obvious functional bugs survive untouched.
- **Diminishing returns.** Round 1 of an audit finds real bugs. Round 2 finds smaller ones. Round 4+ is ~95% noise. Each cycle costs the same; each cycle is worth less.
- **The 90-90 rule (Tom Cargill, Bell Labs).** "The first 90% of the code accounts for 90% of the development time. The remaining 10% accounts for the *other* 90%." Your weeks-long loop is the second 90% — infinite polishing of code that was already shippable.
- **Goodhart's Law.** "When a measure becomes a target, it ceases to be a good measure." The moment "findings per audit" becomes the scoreboard, auditors optimize for *finding count*, not software quality.
- **Second-system effect (Fred Brooks, *The Mythical Man-Month*).** The "fix everything the auditors found" pass quietly becomes a second system: bloated with every suggested improvement, over-engineered, fragile.
- **The streetlight effect.** Auditors look where the light is — static code, which is easy to read — instead of where the keys are: runtime behavior, which requires actually running the app.
- **YAGNI violation / gold plating.** LLMs add abstractions "just in case." They pay zero cost for complexity; *you* maintain it forever.

**Why LLMs specifically do this (the mechanism):**
1. **No skin in the game.** An LLM pays nothing for complexity, latency, or maintenance burden. Adding three new layers costs it the same as adding zero.
2. **Helpfulness bias.** Models are trained to be thorough and agreeable. "It's fine as is" feels like a failure to them; a long findings list feels like success.
3. **They read code; they don't run it.** Static analysis finds style issues. Only execution finds *wrong behavior*. Your loop audits text, then is surprised the program misbehaves.
4. **The telephone game.** Findings → your summary → fix-prompt → coder AI's interpretation. Meaning degrades at every hop. By round 3, the "fix" addresses something nobody originally meant.

### Techniques & methods — the escape protocol

**1. Severity-gate everything.**
- **P0** — crashes, data loss, security holes, wrong money math → fix immediately.
- **P1** — broken feature, bad UX on the happy path → fix this cycle.
- **P2/P3** — style, naming, hypothetical scale, "consider…" → backlog with a **30-day expiry**. If nobody cared in 30 days, delete it. Most P3s die of irrelevance, which proves they were never real.

**2. Give the loop an exit condition *before* it starts.** "Done" = acceptance tests pass + P0/P1 list is empty. "Zero findings" is not a valid exit condition — findings are infinite.

**3. Timebox the loop.** Audit ≤ 2 hours. Fix pass ≤ 1 day. Then ship or test with users. A loop without a timebox is a hobby, not engineering.

**4. Runtime-first auditing.** Every audit round must include *running* the app and clicking through the happy path. Static-only audits are banned from making functional claims. Your "obvious glitches survived weeks of audits" happened because nobody ran the code.

**5. Architecture freeze.** No refactors, no new abstractions, no new dependencies during a fix pass — unless tied to a failing test or a measured problem (a crash log, a latency number). "Cleaner" is not a justification.

**6. Change budget.** Max N fixes per cycle (pick N: 5–10). Every fix must link to a *reproduced* bug: steps to reproduce, or it doesn't get fixed.

**7. One auditor per cycle, rotated — never a panel.** Panels multiply bike-shedding: each auditor invents findings to justify its seat. One sharp auditor beats four thorough ones.

**8. Diff the findings between rounds.** If round N+1 produces no *new* P0/P1, the loop is over. Declare victory. Ship.

**9. The 20-minute human test.** Before *any* audit round, spend 20 minutes using the app yourself like a user. Write down what breaks. This list outranks every AI finding.

### Tips & tricks

- **Make auditors cite evidence:** `file:line` + observed behavior. "This might be slow" without a measurement is deleted on sight.
- **Ban these finding categories outright:** pure style, naming opinions, "consider X" suggestions, hypothetical scale ("what if 1M users?"), and anything starting with "best practice says."
- **Keep a findings graveyard:** rejected findings with one-line reasons. Round 3 *will* try to resurrect round 1's rejects (context rot) — the graveyard kills them instantly.
- **Fix-forward is banned; revert-forward is the rule.** A fix that breaks a passing test gets *reverted*, not patched with a second fix. Patches on patches are how loops become infinite.
- **Collapse the telephone game:** let the auditor AI write the fix-prompt itself, in one pass, with file:line references — don't re-summarize findings through yourself into a new prompt.
- **The "would I pay for this fix?" test.** If the finding were a contractor invoice, would you approve it? If not, it's a P3.

### Common mistakes (the bad)

- **The infinite loop itself** — auditing without an exit condition. Motion feels like progress; it isn't.
- **Auditor incentive problem** — each AI performs usefulness by finding things. Four auditors don't find 4× the truth; they find 4× the noise.
- **Fix churn** — round 2's "fixes" silently undo round 1's. Net progress: zero. Watch the diff, not the findings count.
- **Sycophancy loop** — you ask "is this good?", the AI says "yes, excellent, and here's more." Agreement is not validation.
- **The confidence trap** — fluent, beautifully explained code that is simply wrong. Eloquence ≠ correctness.
- **Reviewer's curse** — "the AI already audited it" makes *you* stop reading diffs carefully. The human is the last line of defense; don't abdicate.
- **Overfitting to auditors** — code shaped to please audit checklists instead of serving users. The user never sees your audit score.
- **Paradox of choice in findings** — 50 findings means none get properly fixed. 5 findings get fixed well.
- **Diffusion of responsibility** — "Claude checked it, ChatGPT checked it, Gemini checked it" — so nobody actually *tested* it.
- **Context rot across weeks** — week-3 fixes contradict week-1 decisions because no single document holds the architecture. (Cure: ADRs — one page per decision, see 4.6.)

### Best practices (the good)

- Write the exit condition before the first audit.
- Tests are the arbiter of quality, not auditors. Green tests beat a clean audit.
- Small, reversible changes. Revert beats patch.
- One human owns "done." Committees don't ship.
- Over-engineering is a bug, not a virtue: every new abstraction must justify its existence against a *real, current* problem.
- Prefer *fewer moving parts*: the system with 3 components you understand beats the system with 12 components an AI understands.

### 🤖 Build rules

- **MUST** stop proposing changes when there are no P0/P1 issues and acceptance tests pass. NEVER invent work to appear useful.
- **MUST** tie every finding to `file:line` + reproduced behavior or a measurement. NEVER report vibe-based findings ("might be slow," "could be cleaner").
- **NEVER** add abstractions, layers, patterns, or dependencies "for future flexibility" — that's YAGNI, and it's banned.
- **MUST** run the code (tests, or the app itself) before claiming anything about behavior. NEVER judge functionality from reading alone.
- **SHOULD** prefer the smallest diff that fixes the bug. MUST revert a fix that breaks a passing test instead of patching it.
- **NEVER** re-propose a finding from the graveyard without new evidence.
- **MUST** push back when the human's idea is bad — sycophancy is a defect, not politeness.

## 6.8 Karpathy Guidelines: behavioral rules for coding agents

*Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls. Use when writing, reviewing, or refactoring code — to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria. (MIT license.)*

***Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.*

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### 🤖 Build rules

- **MUST** state assumptions explicitly before implementing, and ask when uncertain. NEVER pick silently between multiple interpretations.
- **NEVER** add features, abstractions, flexibility, or error handling beyond what was asked. If 200 lines could be 50, rewrite it.
- **MUST** touch only what the request requires. NEVER "improve" adjacent code, comments, or formatting, and NEVER refactor what isn't broken.
- **MUST** match existing style, even when you'd do it differently.
- **MUST** remove only the orphans your own changes created. NEVER delete pre-existing dead code unless asked.
- **MUST** define verifiable success criteria before coding, and loop until they are verified. NEVER treat "make it work" as a success criterion.

## 6.9 The Elite Thinking Engine: structured thinking for hard problems

*A structured internal reasoning framework for correctness, leverage, and execution. Use whenever the user needs rigorous, high-leverage thinking on a hard problem, decision, strategy, or plan — anytime depth exceeds a surface-level answer.*

***Key rule:** Run the full framework internally. Only surface the steps/outputs relevant to what the user needs. Don't narrate the process unless asked.*

### 1. REAL PROBLEM (Anti-BS)

Restate the problem in one brutal sentence.
- Define: Goal / Constraints / Success metric
- Kill vagueness. Precision only.

### 2. FIRST PRINCIPLES

- Break into irreducible fundamentals
- List assumptions → challenge each
- Rebuild only from verified truths

### 3. MENTAL MODELS (Latticework)

Apply + combine models from:
- Probability & statistics
- Incentives & human behavior
- Systems & feedback loops
- Economics (tradeoffs, opportunity cost)
- Game theory (competition, signaling)

Never rely on just one model.

### 4. INVERSION (Failure First)

Ask: "How does this fail?"
- Single-point failures
- Second-order effects
- Hidden risks

Design safeguards *before* optimism.

### 5. SYSTEMS & LEVERAGE

Treat it as a system, not a task.
- Identify: Inputs / Outputs / Feedback loops / Bottlenecks
- Act only on highest-leverage points

### 6. STRATEGY

Pick the best fit — or hybrid if genuinely needed:
- Fast / uncertain → **OODA**
- Unclear future → **Scenario Planning** (3–4 futures)
- Competitive → **Game Theory**
- User-centric → **Design Thinking**

Avoid overengineering. Default to the simplest that fits.

### 7. EXECUTION OUTPUT

- ONE step at a time
- Each step → micro-steps
- Clear order: Do this → then this → then this
- Include decision checkpoints
- Bias toward speed + iteration

### 8. LEARNING LOOP

- Define measurement
- Define feedback signals
- Define trigger: If X → do Y

### Output Style Rules

- Conversational, tight, Gen-Z tone
- Short responses — get to the point fast
- Prefer checklists & actions over prose
- State tradeoffs clearly
- Quantify uncertainty when present
- No pandering, no both-siding, no fluff, no hedging

### Default Operating Mode

Think like a **founder + strategist + systems architect**.
Optimize for leverage, clarity, long-term advantage.
Assume the user wants results, not lectures.

### Clarification Rule

If unclear → ask ONE sharp question max.
Otherwise → execute with best assumptions.

### Hard Constraints (Non-Negotiable)

- No retroactive reasoning
- No bias
- No fluff or hedging
- No surface-level "it depends" non-answers
- Never both-side a question that has a right answer

### 🤖 Build rules

- **MUST** run the full framework internally and surface only what's relevant. NEVER narrate the process unless asked.
- **MUST** restate the problem in one brutal sentence — goal, constraints, success metric — before solving.
- **MUST** challenge every assumption and rebuild only from verified truths.
- **MUST** ask "how does this fail?" and design safeguards before optimism.
- **MUST** act only on the highest-leverage points.
- **MUST** ask at most ONE sharp question when unclear; otherwise execute with best assumptions.
- **NEVER** both-side a question that has a right answer, and NEVER give a surface-level "it depends" non-answer.


---

# Part 7: The 250 Concepts — Engineering Deep Reference

*The complete field manual: 250 concepts every elite software engineer — human or AI agent — must command, researched from authoritative sources (OWASP, PostgreSQL docs, Google SRE, Kleppmann's Designing Data-Intensive Applications, Kubernetes/AWS docs, 12factor.net, Fowler, OWASP LLM Top 10, and aiengineeringfromscratch.com). Every concept follows the same format: **What** it is · **Why it matters** · **Techniques & methods** · **Pitfalls** · **Rules** for the agent. When building anything, find the concepts your project touches and obey their rules.*

## 7.1 Security

### #1 — SQL Injection
**What:** Attacker-controlled input is concatenated into a SQL query, changing its logic — e.g. `' OR 1=1 --` turns a login check into "return every row."
**Why it matters:** Full database compromise: dump all users, bypass auth, delete tables. Still one of the most damaging web vulnerabilities decades after discovery.
**Techniques & methods:**
- Use parameterized queries / prepared statements everywhere; the driver sends data separately from SQL text, so input can never become syntax.
- Use your ORM's parameter binding — and treat its raw-query escape hatch as loaded gun territory.
- For things parameters can't bind (table names, ORDER BY columns), map input through a strict allowlist, never string interpolation.
- Apply least privilege at the DB account level (see #15) so even a successful injection can't DROP or read unrelated schemas.
**Pitfalls:** String concatenation "just for this one report query." Escaping quotes by hand. Believing the ORM makes every query safe (raw fragments aren't). Blocking the word "SELECT" with a filter — trivially bypassed.
**Rules:** MUST use parameterized queries for all user input. NEVER build SQL with string concatenation or template literals containing variables. NEVER rely on escaping or blocklists as the primary defense.

### #2 — XSS (Cross-Site Scripting)
**What:** Attacker injects script into a page other users view; the script runs in their browsers with their session.
**Why it matters:** Session/token theft, account takeover, actions performed as the victim, defacement, drive-by malware. Stored XSS (persisted in DB) hits every visitor; reflected and DOM XSS hit anyone who clicks a crafted link.
**Techniques & methods:**
- Encode output for the context it lands in (HTML body, attribute, JS string, URL) — modern frameworks (React, Vue, Angular) auto-escape by default; keep that behavior.
- Sanitize any HTML you must render (e.g. rich text) with a vetted library like DOMPurify, on the server or client, with a tight tag/attribute allowlist.
- Deploy a strict Content Security Policy (#10) as defense-in-depth so injected scripts can't execute or exfiltrate.
- Store auth tokens in HttpOnly cookies so injected JS can't read them.
**Pitfalls:** Using `dangerouslySetInnerHTML` / `v-html` / `innerHTML` with unsanitized data. "Escaping" once and reusing the value in a different context. Trusting markdown renderers without sanitization.
**Rules:** MUST rely on framework auto-escaping; NEVER inject raw HTML from user data without sanitization. NEVER store sensitive tokens where page JS can read them if you can avoid it.

### #3 — CSRF (Cross-Site Request Forgery)
**What:** A malicious site tricks a logged-in user's browser into sending a state-changing request (transfer funds, change email) to your app, riding the user's cookies.
**Why it matters:** Attacker performs real actions as the victim without ever stealing credentials — password/email changes are classic account-takeover chains.
**Techniques & methods:**
- Use anti-CSRF tokens (synchronizer pattern): a secret, per-session random value embedded in forms/headers that a cross-site attacker cannot read or guess.
- Set cookies `SameSite=Lax` (or `Strict`) so browsers withhold them on cross-site POSTs — strong baseline, token still recommended for critical apps.
- Verify `Origin`/`Referer` headers on state-changing requests as an extra layer.
- Make state changes POST/PUT/DELETE only; GET must never mutate.
**Pitfalls:** Assuming CORS prevents CSRF (it doesn't — simple requests still fire). Assuming JWT-in-header apps are automatically immune if the token also lives in a cookie. Exempting "internal" endpoints.
**Rules:** MUST protect every cookie-authenticated state-changing endpoint with a CSRF token or verified SameSite+Origin checks. NEVER perform mutations on GET. NEVER disable CSRF protection to "fix" a failing form.

### #4 — CORS (Cross-Origin Resource Sharing)
**What:** Browser policy controlling which origins may read responses from your API via JavaScript; configured via `Access-Control-Allow-*` headers.
**Why it matters:** Misconfigured CORS lets any website read your authenticated API responses in a victim's browser — silent data theft. Overly strict CORS also breaks legitimate integrations, tempting devs to "just open it up."
**Techniques & methods:**
- Maintain an explicit allowlist of trusted origins; compare the `Origin` header against it exactly.
- If you reflect origins, NEVER combine reflection with `Access-Control-Allow-Credentials: true` for untrusted origins — that combination is effectively "any site can read authenticated responses."
- Restrict allowed methods and headers to what the client actually needs; handle preflight (`OPTIONS`) deliberately.
- Remember CORS is a browser control, not server authentication — non-browser clients ignore it entirely.
**Pitfalls:** `Access-Control-Allow-Origin: *` on an authenticated API. Regex origin checks that match `evil-example.com`. Copy-pasting permissive CORS middleware defaults into production.
**Rules:** MUST use an explicit origin allowlist. NEVER use wildcard or reflected origins together with credentials. NEVER treat CORS as an authorization mechanism.

### #5 — SSRF (Server-Side Request Forgery)
**What:** Attacker makes your server fetch a URL they control the target of — reaching internal services, cloud metadata endpoints (169.254.169.254), or localhost admin panels.
**Why it matters:** The classic cloud breach path: one "fetch this URL" feature returns cloud credentials from the instance metadata service, and the whole account falls.
**Techniques & methods:**
- Allowlist destination hosts/schemes (https only); reject everything else.
- Resolve the hostname and block private, loopback, link-local, and metadata IP ranges — and re-validate after redirects and DNS resolution to defeat DNS rebinding and open-redirect chains.
- Use a dedicated egress proxy for outbound fetching where feasible; give the fetching service no cloud credentials it doesn't need (IMDSv2 + scoped IAM role).
- Set tight timeouts and response-size limits.
**Pitfalls:** Blocklisting "localhost" as a string — bypassed via 127.0.0.1, 0x7f.0.0.1, decimal IPs, or a redirect. Validating the URL once, then letting the HTTP client follow redirects anywhere.
**Rules:** MUST validate the final resolved IP of every server-side fetch against private-range blocklists. NEVER fetch fully user-controlled URLs without an allowlist. SHOULD strip cloud credentials from any service that fetches URLs.

### #6 — IDOR (Insecure Direct Object Reference)
**What:** An endpoint exposes an object ID (`/invoices/1042`) and checks that you're logged in — but not that invoice 1042 is *yours*. Change the number, read someone else's data.
**Why it matters:** Mass data exposure one increment at a time: medical records, invoices, private files. Routinely behind real breach disclosures and bug-bounty payouts.
**Techniques & methods:**
- Authorize per object, per request: every query that fetches by ID must also scope to the current principal (`WHERE id = ? AND owner_id = ?`).
- Centralize the check in middleware/a policy layer or row-level security (#14) so a new endpoint can't forget it.
- Test with two accounts: script a pass over endpoints swapping IDs between users.
- Unguessable IDs (UUIDs) reduce enumeration but are *not* a fix — leaked UUIDs are everywhere (logs, referrers, shares).
**Pitfalls:** Checking permissions on the list page but not the detail/export/delete endpoints. Trusting an ID sent from the client because "the UI only shows their own."
**Rules:** MUST enforce object-level authorization on every access, including reads, exports, and file downloads. NEVER treat unguessable IDs as an access control.

### #7 — Path Traversal
**What:** User input containing `../` sequences escapes the intended directory — `GET /files?name=../../etc/passwd` or `....//config/.env`.
**Why it matters:** Arbitrary file read (source code, .env secrets, credentials) and, in upload/write paths, arbitrary file write leading to remote code execution.
**Techniques & methods:**
- Never build filesystem paths from raw user input; map input to an allowlisted set of files or IDs, then look up the real path server-side.
- If a filename is unavoidable: strip directory components (`basename`), then canonicalize the resolved absolute path and verify it starts with the intended base directory.
- Run the app with an OS user that can only read its own directories (least privilege, #15).
- Serve user files through a controller or object storage, not by exposing a raw directory.
**Pitfalls:** Blocking the literal string `../` — bypassed by URL encoding (%2e%2e%2f), double encoding, backslashes on Windows, and null bytes in old stacks. Checking the path *before* canonicalization.
**Rules:** MUST canonicalize and prefix-check any path derived from input. NEVER pass user input directly to file APIs. NEVER blacklist-only filter traversal sequences.

### #8 — Mass Assignment
**What:** A framework binds the whole request body to a model, so an attacker adds fields you never showed in the form — `{"name":"x","is_admin":true,"balance":9999}` — and they get persisted.
**Why it matters:** Privilege escalation and data manipulation with zero hacking skill: role flags, prices, ownership fields, and verification status are frequent bindable targets.
**Techniques & methods:**
- Define explicit input DTOs/schemas per endpoint listing exactly which fields are accepted; bind only those.
- Maintain a server-side denylist of never-bindable fields (`id`, `role`, `is_admin`, `created_at`, ownership) as a second layer.
- Set privileged fields explicitly in server code after binding, from session/trusted state.
- Use framework allowlist features (Rails strong parameters, NestJS whitelist pipes, serde deny-unknown where appropriate) and fail on unexpected fields for sensitive endpoints.
**Pitfalls:** Passing `req.body` straight into `Model.create()` / `update()`. Assuming hidden form fields stay hidden. Forgetting the *update* endpoint while hardening create.
**Rules:** MUST bind through explicit per-endpoint allowlists. NEVER pass raw request bodies to ORM create/update. NEVER let the client set roles, ownership, or billing fields.

### #9 — Clickjacking
**What:** Your page is loaded in a transparent iframe on an attacker's site, positioned so the victim's clicks land on your buttons ("click to claim prize" actually clicks "delete account").
**Why it matters:** One-click account actions, permission grants, and transfers executed by the real user — no credential theft needed. Also enables likejacking and OAuth consent abuse.
**Techniques & methods:**
- Send `X-Frame-Options: DENY` (or `SAMEORIGIN` if you frame your own pages).
- Prefer the modern control: CSP `frame-ancestors 'none'` (or an explicit allowlist) — it supersedes X-Frame-Options and supports nuanced policies; send both for older browsers.
- For highly sensitive actions, require re-authentication or a confirmation step that can't be usefully iframed.
- If you legitimately embed partners, allowlist their origins in `frame-ancestors` precisely.
**Pitfalls:** Setting the header on the main site but not on the app subdomain or legacy pages. Relying on JavaScript frame-busting (bypassable with sandbox attributes). Assuming "nobody would iframe us."
**Rules:** MUST set `frame-ancestors 'none'` (or strict allowlist) and `X-Frame-Options` on all HTML responses. NEVER leave authenticated pages framable by arbitrary origins.

### #10 — Content Security Policy (CSP)
**What:** An HTTP header (or meta tag) declaring which origins may supply scripts, styles, images, fonts, and connections for a page — the browser enforces it, neutering injected content.
**Why it matters:** The strongest widely-available mitigation for XSS impact: even if injection happens, a strict CSP can stop the script executing or phoning home. Also controls framing, form targets, and mixed content.
**Techniques & methods:**
- Build policy around nonces or hashes for scripts: `script-src 'nonce-…' 'strict-dynamic'`; avoid `'unsafe-inline'` which guts the protection.
- Roll out with `Content-Security-Policy-Report-Only` first, collect violation reports, fix breakage, then enforce.
- Set `default-src 'self'` as the base and open only what the app demonstrably uses; lock down `object-src 'none'` and `base-uri 'self'`.
- Send CSP from the server/framework layer so every page gets it consistently.
**Pitfalls:** Copy-pasting a permissive policy (`*`, `unsafe-eval`, CDN wildcard domains) that looks secure but blocks nothing. Wildcard CDN allowances — attacker uploads a malicious file to the allowed domain. Deploying enforce-mode cold and breaking the site, then "temporarily" removing it forever.
**Rules:** MUST ship an enforced CSP on all HTML. NEVER use `'unsafe-inline'`/`'unsafe-eval'` in `script-src` for new policies. SHOULD deploy report-only first, then enforce.

### #11 — Security Headers
**What:** A set of response headers that switch on browser protections and close information leaks — cheap, high-yield hardening applied to every response.
**Why it matters:** Missing headers leave free attacks open: clickjacking, MIME sniffing exploits, referrer leakage of sensitive URLs, protocol downgrade. Auditors and scanners flag them instantly.
**Techniques & methods:**
- Set: `Strict-Transport-Security` (#36), `Content-Security-Policy` (#10), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (or `no-referrer` for sensitive apps), `Permissions-Policy` disabling unused features (camera, mic, geolocation), `X-Frame-Options` as CSP fallback, `Cache-Control: no-store` on authenticated/sensitive responses.
- Apply them centrally (reverse proxy, framework middleware) so no route misses out.
- Remove fingerprinting headers (`X-Powered-By`, detailed `Server`).
- Verify with a scanner (e.g. Mozilla Observatory / securityheaders.com) in CI or release checks.
**Pitfalls:** Setting headers only on the homepage via page-level code. `Permissions-Policy` forgotten while third-party embeds abuse device APIs. Keeping default framework banners that advertise exact versions to attackers.
**Rules:** MUST apply the standard header set globally via middleware/proxy. MUST disable version-revealing headers. SHOULD re-scan after infra changes.

### #12 — Input Validation
**What:** Checking every piece of incoming data — type, length, range, format, allowed values — against what the application expects, before using it.
**Why it matters:** The root control behind injection, overflow, traversal, and mass-assignment defenses. Most breaches trace back to data the app accepted without question.
**Techniques & methods:**
- Validate on the **server**, always; client-side validation is UX, not security.
- Prefer allowlist validation ("must be one of these values / match this pattern") over blocklists of bad strings.
- Use a schema validator (zod, Joi, JSON Schema, pydantic) at the API boundary with strict types, max lengths, and rejection of unexpected fields.
- Canonicalize first (decode, normalize Unicode/case) then validate — validate what you will actually use, and validate again at dangerous sinks (SQL, shell, filesystem) via their own safe APIs.
**Pitfalls:** Validating in the browser only. Regex-only "sanitization" of SQL/HTML. Validating a decoded copy but executing the raw one. No length limits (enables DoS via giant payloads).
**Rules:** MUST validate all input server-side against an explicit schema. MUST enforce type, length, and range limits. NEVER trust client-side checks as a security boundary.

### #13 — Server-Side Authorization
**What:** Deciding, on the server, for every request, whether *this* authenticated identity may perform *this* action on *this* resource — regardless of what the UI shows.
**Why it matters:** Hiding a button is not security. Attackers call APIs directly; if the server doesn't check, hidden admin functions are wide open. Broken access control tops the OWASP Top 10 for a reason.
**Techniques & methods:**
- Authenticate identity, then authorize each handler: check role/permission *and* object ownership (#6) before executing logic.
- Default deny: routes are closed unless a policy explicitly grants access.
- Centralize policy (middleware, policy classes, decorators) and write tests that assert 403s for each role/resource combination.
- Re-check authorization on every hop in microservices — don't trust an upstream "already checked" claim without a verifiable token/scope.
**Pitfalls:** Authorization only in the frontend. Checking "is logged in" and calling it authorization. Copy-pasting an endpoint and forgetting its guard. Trusting a client-supplied `role` or `userId` field.
**Rules:** MUST authorize server-side on every endpoint, per action and per object. MUST default to deny. NEVER rely on UI hiding or client-provided identity claims.

### #14 — Row-Level Security (RLS)
**What:** Database-enforced policies that filter and restrict rows per user/tenant — e.g. Postgres RLS ensures a query can only ever see rows where `tenant_id = current_tenant`, no matter what the app code asks.
**Why it matters:** It makes entire classes of IDOR/tenant-leak bugs structurally impossible. One missed `WHERE` clause in app code stops being a breach when the database itself refuses the rows.
**Techniques & methods:**
- Enable RLS on multi-tenant and user-owned tables; write policies for SELECT/INSERT/UPDATE/DELETE using a session variable (e.g. `current_setting('app.tenant_id')`) set per request/transaction.
- Connect with a non-owner, non-superuser role — owners and `BYPASSRLS` roles ignore policies.
- Pair with app-level checks (defense in depth, #13) and test by attempting cross-tenant queries as a low-privilege role.
- For Supabase-style stacks, treat "RLS enabled with no policy" (deny-all) as the safe starting state for every new table.
**Pitfalls:** Enabling RLS but connecting as table owner so policies silently don't apply. Policies on SELECT only — writes still leak. Forgetting the service/background-job path that legitimately needs a separate, audited bypass.
**Rules:** MUST enable RLS (or equivalent scoping) on tenant-owned tables. MUST access them via a policy-bound role. NEVER treat RLS as a substitute for app authorization — layer both.

### #15 — Least Privilege
**What:** Every user, service, token, and process gets the minimum permissions needed for its job — nothing more, for no longer than needed.
**Why it matters:** It caps blast radius. A compromised component with least privilege is an incident; the same component with admin rights is a company-ending breach.
**Techniques & methods:**
- Give the app separate DB credentials per service with rights only on its own tables (read-only where writes aren't needed).
- Scope API keys and cloud IAM roles to specific actions/resources; prefer short-lived credentials (OIDC, instance roles) over static keys.
- Remove standing admin access: elevate just-in-time, log it, expire it.
- Audit permissions periodically and delete unused roles, keys, and grants.
**Pitfalls:** One shared "app" superuser for everything because it's convenient. Developers holding production admin as a default. Granting `*` in IAM "temporarily" and forgetting. Service accounts that outlive the service.
**Rules:** MUST scope every credential to the minimum actions and resources. SHOULD prefer short-lived over static credentials. MUST review and prune privileges on a schedule.

### #16 — RBAC (Role-Based Access Control)
**What:** Permissions are bundled into roles (admin, editor, viewer, billing), roles are assigned to users, and the app checks permissions — not job titles — at enforcement points.
**Why it matters:** Ad-hoc per-user permission checks rot fast: inconsistent enforcement, privilege creep, and no way to answer "who can do X?" RBAC makes access reviewable and auditable.
**Techniques & methods:**
- Define permissions as fine-grained capabilities (`invoice:delete`, `user:impersonate`) and compose roles from them; check capabilities in code, not role names, where it matters.
- Assign roles via groups/teams for organizations; support multiple roles per user only if truly needed.
- Enforce server-side (#13) and record role changes in an audit log.
- Periodically review role assignments; automate deprovisioning when users leave.
**Pitfalls:** One "admin" role that does everything, handed out freely. Checking roles only in the UI. Hardcoding role names across dozens of endpoints so a new role means a refactor. Letting users accumulate roles forever (privilege creep).
**Rules:** MUST model access as roles composed of explicit permissions. MUST enforce checks server-side. SHOULD audit role assignments and changes regularly.

### #17 — Secrets Management
**What:** Storing credentials, API keys, and tokens in a dedicated system (Vault, AWS/GCP secret managers, Doppler, platform env stores) with access control, audit logs, and rotation — not in code or config files.
**Why it matters:** Hardcoded and committed secrets are the #1 way cloud accounts get hijacked — bots scan public repos and exploit leaked keys within minutes.
**Techniques & methods:**
- Inject secrets at runtime via environment or a secrets manager SDK; apps fetch with their own scoped identity and never see other services' secrets.
- Separate secrets per environment (dev ≠ staging ≠ prod) and per service (least privilege, #15).
- Enable audit logging on secret access; alert on unusual reads.
- Have a documented revocation path: if a secret leaks, you rotate it (#19) — you don't "delete the commit and hope."
**Pitfalls:** Secrets in source, Docker images, CI logs, or Slack messages. One mega-`.env` shared by the whole team forever. Believing a private repo makes a committed secret safe (clones, forks, CI caches all count).
**Rules:** MUST store secrets in a secrets manager or protected environment config. NEVER commit secrets to version control. MUST be able to revoke any secret without a code deploy.

### #18 — .env in .gitignore
**What:** Keeping local environment files (`.env`, `.env.local`) out of git by listing them in `.gitignore`, so real credentials never enter repository history.
**Why it matters:** A committed `.env` is a public secret the moment the repo is shared, cloned, or leaked — and git history keeps it even after you "remove" the file. Key-scraping bots find these in minutes.
**Techniques & methods:**
- Add `.env*` to `.gitignore` in the repo template, but allow a committed `.env.example` with placeholder values only.
- Verify before pushing: `git check-ignore .env` and review `git status` for unexpected files.
- If a secret was ever committed: rotate it immediately (#19), then purge history (git filter-repo) — rotation is the real fix; history rewriting is hygiene.
- Layer secret scanning (#20) in pre-commit hooks and CI so a slip is caught automatically.
**Pitfalls:** Adding `.env` to `.gitignore` *after* it was already committed (git keeps tracking it — you must `git rm --cached`). Committing `.env.production` because "it's a different file." Assuming a private repo = safe.
**Rules:** MUST gitignore all real env files from the first commit. MUST commit only placeholder examples. IF a secret is committed, MUST rotate it — no exceptions.

### #19 — API Key Rotation
**What:** Regularly replacing API keys and credentials with fresh ones and revoking the old, on a schedule and immediately upon suspected exposure.
**Why it matters:** Keys leak quietly (logs, screenshots, ex-employees, vendor breaches). A key that never rotates is a permanent skeleton key; rotation bounds how long any leak stays useful.
**Techniques & methods:**
- Support two active keys per integration (blue/green): issue new key, deploy it, verify, then revoke the old — zero-downtime rotation.
- Automate rotation where the platform supports it (cloud IAM, secret managers with rotation hooks); set calendar/CI reminders otherwise (90 days is a common ceiling; shorter for high-privilege keys).
- Scope keys narrowly (#15) so a rotated/revoked key touches one integration, not the whole system.
- Log key usage; alert on use of a revoked or never-issued key.
**Pitfalls:** Rotation that requires downtime, so it never happens. Rotating the value but leaving the old key valid "just in case." One shared key across all environments — rotating prod breaks dev, so nobody rotates.
**Rules:** MUST be able to rotate any key with zero downtime. MUST revoke old keys after cutover. SHOULD automate or schedule rotation for all long-lived credentials.

### #20 — Secret Scanning
**What:** Automated detection of credentials in code, commits, and artifacts — tools like gitleaks, trufflehog, GitHub secret scanning, and git-secrets that flag keys before (or right after) they land.
**Why it matters:** Humans commit secrets by accident constantly. Scanning converts an invisible, catastrophic mistake into a blocked commit or an immediate alert.
**Techniques & methods:**
- Run a scanner in three places: pre-commit hook (fast feedback), CI pipeline (gate merges), and periodic full-history scans (catch what predates the hooks).
- Use tools that verify findings (trufflehog-style) to cut false positives, and tune allowlists for test fixtures — visibly, in config, not by disabling rules.
- Treat every true positive as a leak: rotate first (#19), investigate second.
- Extend scanning to Docker images, build artifacts, and issue trackers where feasible.
**Pitfalls:** Scanning only new commits while history is full of old keys. Alert fatigue from false positives leading to the scanner being muted. Assuming scanning *prevents* leaks — it detects; rotation fixes.
**Rules:** MUST run secret scanning in CI and block merges on verified findings. MUST rotate any discovered live secret immediately. SHOULD scan full history, not just diffs.

### #21 — Hashing vs Encryption
**What:** Hashing is one-way: data goes in, a fixed fingerprint comes out, and you can't reverse it. Encryption is two-way: ciphertext can be decrypted back with a key.
**Why it matters:** Using the wrong one is catastrophic in both directions: encrypted passwords can be decrypted by whoever gets the key (breach = all passwords), while "hashing" data you need to read back makes it unrecoverable.
**Techniques & methods:**
- Passwords and verification tokens: **hash** (with a password hashing function, #23). You only ever compare, never retrieve.
- Data you must read later (stored PII, third-party tokens): **encrypt** with authenticated encryption (AES-256-GCM or ChaCha20-Poly1305) and manage keys in a KMS.
- Integrity checks/signatures: HMAC or digital signatures — a third tool, neither plain hash nor encryption.
- Ask the test question: "Do I ever need the original value back?" No → hash. Yes → encrypt.
**Pitfalls:** "Encrypting" passwords with AES and calling it secure. Reversible obfuscation (base64) treated as either. Hashing with a fast general hash for passwords (see #23). Inventing your own scheme of both.
**Rules:** MUST hash passwords; NEVER store them encrypted or in plaintext. MUST use authenticated encryption for data at rest that needs decryption. NEVER roll your own crypto.

### #22 — Password Salting
**What:** Appending a unique random value (the salt) to each password before hashing, so identical passwords produce different hashes and precomputed rainbow tables are useless.
**Why it matters:** Without unique salts, one cracked hash cracks every account sharing that password, and attackers can use trillion-entry precomputed tables. With salts, every password must be attacked individually.
**Techniques & methods:**
- Generate a cryptographically random salt of at least 16 bytes per password, from a CSPRNG.
- Store the salt alongside the hash (it's not secret — its job is uniqueness, not secrecy).
- Use a modern password hashing function (Argon2id/bcrypt, #23) — they generate and embed the salt in the output string automatically; never hand-roll this.
- Optionally add a *pepper* — a server-wide secret stored separately (KMS/env) — as defense-in-depth on top of the salt.
**Pitfalls:** One global salt for all users (defeats the purpose). Short or predictable salts (username as salt). Rolling your own salt+SHA-256 construction instead of a password KDF. Thinking the salt must be kept secret — hiding it adds nothing; uniqueness is the point.
**Rules:** MUST use a unique random salt per password. SHOULD let the password hashing library generate and store it. NEVER use usernames, emails, or a global constant as the salt.

### #23 — bcrypt & Argon2
**What:** Purpose-built, deliberately slow password hashing functions. Argon2id (the current OWASP first choice) is memory-hard; bcrypt is the battle-tested older standard with an adjustable cost factor.
**Why it matters:** Attackers with a stolen hash database try billions of guesses on GPUs. Fast hashes (MD5/SHA-256) fall instantly; a tuned Argon2id/bcrypt reduces attackers to a trickle and makes mass cracking uneconomical.
**Techniques & methods:**
- Prefer **Argon2id**: OWASP minimum m=19 MiB memory, t=2 iterations, p=1 parallelism — tune upward so verification takes ~250–500 ms on your hardware.
- If bcrypt: cost factor ≥ 10 (12 is a common production choice), and remember it truncates input at 72 bytes — Argon2id avoids this quirk.
- FIPS-constrained environments: PBKDF2-HMAC-SHA-256 with ≥ 600,000 iterations.
- Re-hash on login when parameters increase, so the fleet upgrades transparently.
**Pitfalls:** MD5/SHA-1/SHA-256 "because it's one line." Cost so high logins time out (DoS on yourself). Cost left at defaults from a decade ago. Comparing hashes with `==` (see timing attacks, #32 — libraries' verify functions handle this).
**Rules:** MUST store passwords with Argon2id, bcrypt, or (FIPS only) PBKDF2 at OWASP-recommended parameters. NEVER use a fast general-purpose hash for passwords. SHOULD benchmark and raise cost as hardware improves.

### #24 — JWT Expiry
**What:** Every JSON Web Token carries an `exp` claim; short lifetimes (typically 5–15 minutes for access tokens) bound how long a stolen token remains useful.
**Why it matters:** A JWT is a bearer credential that servers verify statelessly — it generally can't be revoked before expiry. A token valid for 30 days is a 30-day window for anyone who copies it out of a log, browser, or proxy.
**Techniques & methods:**
- Access tokens: 5–15 minutes (1 hour as an outer bound for low-risk apps); pair with refresh tokens (#25) so users aren't re-logging constantly.
- Always validate `exp`, `iss` (issuer), and `aud` (audience) on every verification, with a pinned algorithm allowlist — reject `alg: none` and never let the token header choose the algorithm.
- Keep sensitive/privileged scopes out of long-lived claims; re-check account status for critical operations since a disabled user's token still verifies.
- Store access tokens in memory or HttpOnly cookies — not localStorage, where any XSS (#2) steals them.
**Pitfalls:** "Remember me forever" tokens. Verifying the signature but not the expiry. Embedding roles at issuance and trusting them for the token's whole life after a demotion. Accepting tokens across services without audience checks (cross-service relay).
**Rules:** MUST set short `exp` on access tokens and validate `exp`/`iss`/`aud` on every request. MUST pin allowed algorithms. NEVER issue non-expiring tokens.

### #25 — Refresh Tokens
**What:** A long-lived credential exchanged only at a dedicated refresh endpoint for new short-lived access tokens — so sessions persist without long-lived access tokens.
**Why it matters:** It's the mechanism that makes short JWT expiry (#24) usable. Handled badly (no rotation, stored in localStorage), the refresh token becomes the single master key attackers hunt for.
**Techniques & methods:**
- **Rotate on every use:** each refresh returns a new refresh token and invalidates the old one. If an already-used token is presented again, treat it as theft — revoke the whole token family/session.
- Store refresh tokens server-side (hashed) so they can be revoked on logout, password change, or deactivation; deliver them to web clients as `HttpOnly; Secure; SameSite` cookies scoped to the refresh path.
- Give refresh tokens an absolute lifetime (days to ~30 days) plus idle timeouts for sensitive apps.
- Bind to device signals where feasible and surface an "active sessions" page so users can revoke.
**Pitfalls:** Refresh tokens that never rotate and never expire. Keeping them in localStorage next to the access token. Logout that only clears the client — the server-side token stays valid. No reuse detection, so theft is silent.
**Rules:** MUST rotate refresh tokens on each use with reuse detection. MUST store them hashed and revocable server-side. MUST revoke all refresh tokens on password change and logout.

### #26 — OAuth 2.0
**What:** A delegation framework: a user grants a client application limited access to their resources at another service (via scoped access tokens) without sharing their password.
**Why it matters:** It's how "Sign in with Google" and third-party integrations work safely. Implemented loosely, it's also a reliable account-takeover machine — redirect manipulation and token leakage are classic OAuth breach vectors.
**Techniques & methods:**
- Use the **Authorization Code flow with PKCE** for SPAs, mobile, and server apps alike; the old Implicit flow is deprecated — never use it.
- Register exact redirect URIs; validate them by exact string match, and always send and verify the `state` parameter (CSRF protection for the flow).
- Request the minimum scopes; validate audience and issuer on received tokens.
- Use a maintained OAuth/OIDC library or a reputable identity provider (Auth0, Keycloak, Cognito…) rather than hand-rolling a provider.
**Pitfalls:** Wildcard or prefix-matched redirect URIs (open-redirect token theft). Missing `state` (login CSRF). Tokens in URL fragments/query strings that land in logs. Accepting tokens issued for a *different* client because signature checks passed (audience confusion).
**Rules:** MUST use Authorization Code + PKCE. MUST exact-match redirect URIs and verify `state`. NEVER use the Implicit flow. SHOULD consume OAuth via vetted libraries/IdPs, not home-grown code.

### #27 — OpenID Connect (OIDC)
**What:** An identity layer on top of OAuth 2.0: it adds a signed ID token and a standard `/userinfo` endpoint, turning an authorization protocol into an authentication protocol.
**Why it matters:** OAuth 2.0 alone proves *access*, not *identity* — teams that treat an access token as proof of login build exploitable auth. OIDC is the correct, standardized way to do federated sign-in.
**Techniques & methods:**
- Authenticate users from the **ID token**: verify signature against the provider's JWKS, and validate `iss`, `aud` (your client ID), `exp`, and the `nonce` you sent.
- Fetch the provider's discovery document (`/.well-known/openid-configuration`) and cache JWKS with key rotation support instead of hardcoding keys.
- Create your own server-side session after successful OIDC verification rather than passing the provider's tokens around as your session.
- Use standard claims (`sub` as the stable user key — never email, which can change or be reassigned).
**Pitfalls:** Using an access token or an unverified ID token payload as login proof. Keying accounts by email and enabling merges an attacker can trigger. Not checking `nonce` (replay). Pinning JWKS forever so key rotation breaks or gets bypassed.
**Rules:** MUST verify ID token signature and `iss`/`aud`/`exp`/`nonce` before trusting identity. MUST key accounts by `sub` + issuer. NEVER treat a raw OAuth access token as authentication.

### #28 — Session Fixation
**What:** An attacker plants a known session ID in a victim's browser (via a subdomain cookie or a link), the victim logs in with it, and the attacker — who already knows the ID — rides the now-authenticated session.
**Why it matters:** It converts "attacker can't guess a session ID" into "attacker doesn't need to": they chose it. Any app that keeps the same session ID across the login boundary is exposed.
**Techniques & methods:**
- **Regenerate the session ID at login** (and at any privilege escalation, e.g. enabling MFA or becoming admin); invalidate the old ID server-side.
- Only accept session IDs your server issued — never adopt a client-presented ID for a new session.
- Set session cookies `HttpOnly; Secure; SameSite=Lax` and scope cookie domains tightly so sibling subdomains can't plant IDs.
- Expire idle and absolute sessions; on logout, destroy the session server-side, not just the cookie.
**Pitfalls:** Rotating the ID on every request (breaks concurrent tabs, adds load) or never rotating at all. Frameworks left at defaults that accept user-supplied session IDs. Fixation via a compromised *subdomain* setting cookies for the parent domain.
**Rules:** MUST regenerate the session ID on authentication and privilege change. MUST reject client-invented session IDs. MUST destroy sessions server-side at logout.

### #29 — MFA (Multi-Factor Authentication)
**What:** Requiring two or more independent factors — something you know (password), have (authenticator app, security key), or are (biometric) — before granting access.
**Why it matters:** Passwords leak, get phished, and get reused. MFA is the single control that keeps a stolen password from becoming an account takeover; it's mandatory in most compliance regimes for admin access.
**Techniques & methods:**
- Prefer phishing-resistant factors: **WebAuthn/FIDO2 security keys and passkeys** first, TOTP authenticator apps second, SMS last (SIM-swap risk).
- Protect enrollment and recovery as strongly as login: recovery codes are single-use, shown once, stored hashed; account recovery must not silently bypass MFA.
- Require MFA for admins and sensitive actions (step-up auth for payouts, email changes), not just initial login.
- Rate-limit and log MFA attempts; alert on repeated failures (fatigue/push-bombing attacks are real — use number-matching push where applicable).
**Pitfalls:** SMS-only MFA on high-value accounts. Backup codes stored in plaintext or reusable. "Remember this device" cookies that never expire. Support-desk resets that defeat MFA entirely.
**Rules:** MUST offer MFA and MUST require it for privileged accounts. SHOULD prefer passkeys/WebAuthn or TOTP over SMS. MUST treat recovery flows as part of the MFA security boundary.

### #30 — Brute Force Protection
**What:** Defenses that make automated password guessing and credential stuffing impractical: rate limits, throttling, lockouts/backoff, and bot challenges on authentication endpoints.
**Why it matters:** Attackers run leaked credential lists against login endpoints at industrial scale. An unthrottled login form will eventually fall to stuffing — the passwords are already public; only speed protects you.
**Techniques & methods:**
- Rate-limit login attempts per account *and* per IP (either alone is bypassable — distributed IPs defeat per-IP, shared NATs punish per-account-only lockouts); use progressive delays/exponential backoff.
- Check passwords against known-breached corpora (e.g. k-anonymity services like Have I Been Pwned) at signup and login, forcing resets on hits.
- Add CAPTCHA/bot checks after a failure threshold rather than on first attempt (keeps UX clean, stops automation).
- Alert and log on stuffing patterns (many accounts, few attempts each) — distinguishable from single-account brute force.
**Pitfalls:** Hard permanent lockouts — attackers weaponize them to DoS legitimate users. Counting only per-IP in a botnet world. Forgetting the same protection on password reset, MFA, and API-key endpoints. Error messages that confirm which factor failed (#31).
**Rules:** MUST throttle auth endpoints by account and IP with progressive backoff. SHOULD screen passwords against breach corpora. MUST NOT implement lockouts that let attackers permanently disable victims.

### #31 — Account Enumeration
**What:** Responses that reveal whether an account exists — "no user with that email" vs "wrong password," or a password-reset page that confirms registered addresses.
**Why it matters:** Enumeration hands attackers a verified target list for credential stuffing, phishing, and brute force (#30). It's also a privacy leak: it confirms someone's membership in sensitive services.
**Techniques & methods:**
- Use identical, generic messages everywhere: login returns "invalid credentials"; signup says "if this email is available, we've created your account / sent a confirmation"; reset says "if an account exists, we've emailed a link."
- Make responses indistinguishable in timing too — always run the password verify against a dummy hash when the user doesn't exist (see #32), and keep response sizes/shapes uniform.
- Apply the same treatment to APIs, username-availability checks during registration, and SSO discovery endpoints.
- Rate-limit lookup-style endpoints so bulk enumeration is slow and noisy (#30).
**Pitfalls:** Helpful UX copy written without a security review. Different HTTP status codes for "user not found" vs "bad password." Password reset that emails only real accounts while returning observably different timing. Enumeration via registration ("email already taken") left unmitigated by rate limits and CAPTCHA.
**Rules:** MUST return generic, uniform auth responses regardless of account existence. MUST equalize timing between existing and non-existing accounts. NEVER confirm account existence in any unauthenticated flow.

### #32 — Timing Attacks
**What:** Measuring how long a system takes to respond leaks secrets: string comparisons that exit on the first wrong byte tell an attacker the correct prefix, byte by byte.
**Why it matters:** Early-exit comparisons have been used to forge tokens, recover MACs, and enumerate accounts. Any secret compared character-by-character over a network is a candidate.
**Techniques & methods:**
- Compare secrets, hashes, tokens, and MACs with a **constant-time comparison** (`crypto.timingSafeEqual`, `hmac.compare_digest`, `MessageDigest.isEqual`) — never `==`/`===`.
- Hash-then-compare for variable-length secrets so length itself doesn't leak.
- For login flows, always perform a full password-hash verification (against a real or dummy hash) so response time doesn't reveal whether the account exists (#31).
- Prefer vetted verify functions from your auth/crypto library — they handle this correctly by design.
**Pitfalls:** Using `==` on API keys or webhook signatures "because it's internal." Comparing digests produced with different-length inputs. Fixing application timing while ignoring framework short-circuits in token parsing. Overcorrecting: padding *all* responses with random delays instead of using constant-time primitives.
**Rules:** MUST use constant-time comparison for all secret comparisons. MUST equalize login timing for unknown accounts. NEVER hand-roll early-exit comparison loops.

### #33 — File Upload Validation
**What:** Verifying that uploaded files are what they claim to be — type, content, and safety — before storing or serving them.
**Why it matters:** Uploads are a premier RCE vector: a "photo" that's actually a web shell, SVG carrying script, or a zip that extracts over your app (zip-slip) can hand over the server.
**Techniques & methods:**
- Validate by **content, not name**: check magic bytes with a file-type sniffer, enforce an extension + MIME allowlist, and re-encode images through a library (strips embedded payloads).
- Store uploads outside the web root (or in object storage) under random server-generated names; serve with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`; never let the server execute files from the upload location.
- Enforce size limits, scan with antivirus/malware scanning for user-shared files, and validate archive contents path-by-path if you extract zips.
- Run uploads through a separate, least-privilege service/domain where possible.
**Pitfalls:** Trusting the browser's `accept` attribute or the client-sent Content-Type. Blocking `.php` but allowing `.phtml`/`.php5`/double extensions. Serving user SVGs inline from your main domain (stored XSS). Preserving original filenames into filesystem paths (#7).
**Rules:** MUST verify file type by content against an allowlist. MUST store uploads unexecutable, outside the web root, with random names. NEVER trust filename, extension, or declared MIME alone.

### #34 — Webhook Signature Verification
**What:** Providers (Stripe, GitHub, etc.) sign each webhook payload with HMAC using a shared secret; you recompute and compare the signature to prove the request genuinely came from them.
**Why it matters:** Webhooks trigger your most sensitive actions — marking orders paid, provisioning accounts, granting entitlements. An unverified webhook endpoint lets anyone POST "payment succeeded" and steal your product.
**Techniques & methods:**
- Verify the signature over the **raw request body** (before any JSON parsing/re-serialization) using the provider's documented scheme, with a constant-time comparison (#32).
- Check the signature timestamp and reject stale payloads (Stripe's default tolerance is 5 minutes) to stop replay attacks.
- Fetch the event from the provider's API by ID before acting on it, and make handlers **idempotent** — providers retry, so the same event will arrive more than once.
- Keep webhook secrets in secret management (#17), support rotation (providers allow dual secrets during rollover), and alert on verification failures.
**Pitfalls:** Parsing JSON first, then verifying against the re-serialized body (signature always fails or gets "fixed" by disabling checks). Skipping verification in "test mode" code paths that reach production. Processing before verifying. Returning 200 on failure, which stops provider retries for *legitimate* transient errors.
**Rules:** MUST verify the signature on the raw body before any processing. MUST enforce timestamp tolerance and idempotent handling. NEVER act on an unverified webhook.

### #35 — TLS Certificate Expiry
**What:** Certificates have fixed lifetimes (now at most ~398 days, shrinking industry-wide); when one lapses, browsers hard-block your site and APIs with expired-cert errors.
**Why it matters:** Expiry is a self-inflicted outage that hits everyone at once — checkout, logins, mobile apps with pinned certs — and trains users to click through warnings. It's also embarrassingly preventable.
**Techniques & methods:**
- Automate issuance and renewal with ACME (Let's Encrypt/cert-manager) — a human calendar reminder is not a strategy.
- Monitor days-to-expiry for *every* endpoint (including internal services, load balancers, and partner-facing APIs) with alerts at 30/14/7 days.
- Watch Certificate Transparency logs for your domains to catch unauthorized issuance while you're at it.
- After any renewal, verify the full chain is served correctly (a renewed leaf with a stale intermediate still breaks clients, especially Android and IoT).
**Pitfalls:** Certs on forgotten subdomains, staging boxes, and the "temporary" load balancer that became permanent. Auto-renewal that renews but doesn't reload the server. Assuming the cloud provider handles it when you're terminating TLS yourself.
**Rules:** MUST automate renewal via ACME or managed certs. MUST alert on expiry at least 30 days out for all endpoints. NEVER rely on manual renewal for production.

### #36 — HSTS (HTTP Strict Transport Security)
**What:** A response header telling browsers "only ever talk to this domain over HTTPS" for a set period — converting every future http:// visit into https:// before any request is sent.
**Why it matters:** Without it, the first visit (or any typed http:// link) can be intercepted and SSL-stripped by a network attacker, who then proxies the "secure" site while reading everything. HSTS closes the downgrade window.
**Techniques & methods:**
- Serve `Strict-Transport-Security: max-age=31536000; includeSubDomains` once HTTPS works flawlessly everywhere; ramp max-age up (5 min → 1 week → 1 year) during rollout.
- Add `preload` and submit to the browser preload list only when you're certain — it bakes HTTPS-only into browsers and is slow to reverse.
- Redirect http→https at the edge *and* send HSTS on the HTTPS responses (browsers ignore HSTS received over plain HTTP, by design).
- Ensure all subdomains genuinely support HTTPS before using `includeSubDomains`.
**Pitfalls:** Sending HSTS while some subdomain is HTTP-only (you just bricked it). Max-age of a year set on day one of a shaky migration. Expecting HSTS to fix mixed content — it upgrades the transport; your page's http:// subresources still break (use CSP `upgrade-insecure-requests` alongside).
**Rules:** MUST send HSTS with max-age ≥ 1 year on production HTTPS. MUST confirm all subdomains are HTTPS-ready before `includeSubDomains`. NEVER send HSTS as a substitute for fixing HTTP links.

### #37 — Encryption at Rest
**What:** Encrypting stored data — disks/volumes, databases, object storage, backups — so stolen media or snapshots yield ciphertext, not data.
**Why it matters:** Lost drives, leaked snapshots, and decommissioned hardware are real breach vectors, and most compliance regimes (PCI, HIPAA, GDPR guidance) expect storage encryption. It also safely enables snapshot sharing and offsite backup.
**Techniques & methods:**
- Enable the platform defaults: cloud volume encryption (EBS/Azure Disk/S3 SSE), database TDE/storage encryption — it's near-zero performance cost on modern infrastructure.
- Manage keys in a KMS/HSM with separate keys per environment, automatic rotation, and strict IAM on key use; distinguish this from app-level encryption.
- For the most sensitive fields (tokens, PII), add application-level envelope encryption so even DB access doesn't expose plaintext.
- Encrypt backups too, and test restores — an encrypted backup with a lost key is just garbage.
**Pitfalls:** Believing encryption at rest stops application-layer attacks (SQLi returns plaintext — the app decrypts legitimately). Keys stored next to the data they protect. Encrypting prod but not its backups, replicas, or exports. Losing the KMS key = losing the data, permanently.
**Rules:** MUST enable storage encryption on all data stores and backups. MUST manage keys in a KMS, separate from the data. NEVER present encryption at rest as a defense against app-layer compromise.

### #38 — Dependency Vulnerabilities
**What:** Your app is mostly other people's code: frameworks, libraries, and their transitive dependencies — any of which may ship with known, publicly catalogued vulnerabilities (CVEs).
**Why it matters:** Equifax was breached through one unpatched Struts dependency. Attackers scan for known-vulnerable versions automatically; your obscure app is not hidden, just unpatched.
**Techniques & methods:**
- Generate an SBOM and scan continuously (Dependabot, Renovate, Snyk, `npm audit`/`pip-audit`/`osv-scanner`) in CI and on a schedule.
- Automate update PRs for patch/minor versions; triage by *reachability and exposure*, not raw CVE count — a critical CVE in dead code ranks below a medium in your auth path.
- Pin versions with lockfiles and commit them; keep dependencies few and maintained — every dependency is permanent attack surface.
- Set an SLA: critical, reachable, internet-facing = days, not "next quarter."
**Pitfalls:** Running audit once at project start. Blind auto-merging major upgrades (breakage) or never merging (exposure) — automate the safe middle. Ignoring transitive dependencies (most CVEs live there). Dev-only vulnerabilities triggering panic while a reachable runtime CVE waits.
**Rules:** MUST scan dependencies continuously with lockfiles committed. MUST patch reachable critical/high vulnerabilities promptly. SHOULD minimize dependency count and prefer maintained projects.

### #39 — Supply Chain Attacks
**What:** Attacking the software *pipeline* instead of the app: compromised packages, typosquatted names, hijacked maintainer accounts, poisoned build tools, and malicious updates pushed through trusted channels.
**Why it matters:** One poisoned popular package (event-stream, ua-parser-js, xz utils) reaches thousands of downstream apps with their full privileges. Your code review never sees it — it arrives through `npm install`.
**Techniques & methods:**
- Pin exact versions + lockfiles; verify integrity hashes; delay adopting brand-new releases of critical packages where your tooling supports it.
- Reduce surface: audit before adding a dependency (maintainer health, download patterns, does it need install scripts?); disable install scripts by default where possible.
- Use private registries/proxies and organization policies (allowed registries, signature verification like Sigstore/npm provenance).
- Protect the pipeline itself: MFA on maintainer and registry accounts, signed commits/releases, isolated CI with secrets scoped per job (#15, #17).
**Pitfalls:** Installing packages named from an AI suggestion or a search result without checking the real name (typosquatting/slopsquatting). Floating versions (`*`, `latest`). Build machines holding production secrets. Trusting a package because it's popular — popularity is the attacker's targeting criterion.
**Rules:** MUST pin and integrity-check all dependencies. MUST verify package identity before adding. SHOULD prefer signed/provenance-attested releases and MFA-protected publishing.

### #40 — Threat Modeling
**What:** A structured exercise — before and during design — asking: what are we building, what can go wrong, what will we do about it, and did we do a good job?
**Why it matters:** It's the difference between security by design and security by penetration-test surprise. Most controls in this chapter (authZ, RLS, rate limits) only exist if someone imagined the attack first.
**Techniques & methods:**
- Draw the system: data-flow diagram with trust boundaries (internet ↔ API ↔ DB ↔ third parties); mark where attacker-controlled data crosses.
- Enumerate threats per element with **STRIDE** (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege); abuse-case brainstorming ("how would I steal data from this?") works too.
- Score by real risk (likelihood × impact), decide per threat: mitigate, accept (documented), transfer, or redesign — and record decisions in the design doc.
- Revisit on major features, new integrations, and after incidents; keep models lightweight (a page and a diagram beat a binder nobody opens).
**Pitfalls:** Threat modeling once, at the end, as compliance theater. Modeling only the happy architecture and ignoring admins, insiders, and compromised dependencies (#39). No owner and no follow-through — findings that never become tickets. Analysis paralysis on exotic threats while SQL injection (#1) sits open.
**Rules:** MUST threat-model new systems and major features before building. MUST record each threat's disposition. SHOULD update the model when architecture or trust boundaries change.

## 7.2 Databases & Data

### #41 — Indexes
**What:** A separate sorted data structure (usually a B-tree) that maps column values to row locations, so lookups skip scanning the whole table.
**Why it matters:** The difference between a 5 ms query and a 5-second one on a million-row table. Missing indexes on foreign keys and filter columns are the #1 cause of "the app got slow as we grew."
**Techniques & methods:**
- Index columns used in `WHERE`, `JOIN ... ON`, and `ORDER BY` — in that priority order.
- Composite indexes follow the **leftmost prefix rule**: index `(a, b, c)` serves queries on `a`, `a+b`, `a+b+c`, never `b` alone. Put equality columns first, the range/sort column last.
- Use partial indexes (`WHERE status = 'active'`) and covering indexes (`INCLUDE`) to shrink index size and enable index-only scans.
**Pitfalls:** Indexing everything — every index taxes INSERT/UPDATE/DELETE and bloats storage. Duplicate and unused indexes are pure cost.
**Rules:** MUST verify a new index is used via EXPLAIN before shipping. SHOULD periodically drop indexes with zero scans. NEVER index a low-cardinality boolean alone.

### #42 — EXPLAIN ANALYZE
**What:** `EXPLAIN ANALYZE` runs the query for real and reports the actual plan, row counts, and timing per step.
**Why it matters:** The planner's *estimates* (plain `EXPLAIN`) can be wildly wrong; only actual execution shows whether you got a Seq Scan on 10M rows or an Index Scan on 3.
**Techniques & methods:**
- Read plans bottom-up: look for big gaps between estimated rows and actual rows — that signals stale statistics.
- Key nodes to recognize: `Seq Scan` (full read), `Index Scan`, `Index Only Scan`, `Nested Loop` (fine for few rows), `Hash Join`, `Sort` with external merge (spilling to disk).
- Run `ANALYZE` after bulk loads so the planner has fresh stats; use `EXPLAIN (ANALYZE, BUFFERS)` to see cache vs disk reads.
**Pitfalls:** It *executes* the statement — running it on an UPDATE/DELETE in production mutates data (wrap in a transaction and roll back). Plans differ between dev (tiny data) and prod.
**Rules:** MUST run EXPLAIN ANALYZE on any query touching a large table before release. NEVER tune by guessing.

### #43 — N+1 Queries
**What:** One query to fetch a list, then one extra query per item to fetch related data — 1 + N queries where 1–2 would do.
**Why it matters:** A page listing 100 orders fires 101 queries. Each is fast; together they add seconds of latency and crush the database under load.
**Techniques & methods:**
- Eager-load associations (`include` / `joinedload` / `preload`) or write an explicit JOIN.
- Batch with `WHERE id IN (...)` and map results in memory.
- Use a DataLoader-style batcher for GraphQL resolvers.
- Turn on query logging in development and count queries per request in tests.
**Pitfalls:** It hides inside loops and serializers — the code "looks clean" while the query count explodes. It often only appears in production-sized data.
**Rules:** MUST set a per-request query budget in tests for list endpoints. NEVER fetch associations lazily inside a loop over a collection.

### #44 — Full Table Scans
**What:** The database reads every row of a table to answer a query (a "Seq Scan" in Postgres) because no usable index exists or the query can't use one.
**Why it matters:** Cost grows linearly with table size. Today's 50 ms scan is next year's 30-second timeout and locked-up connection pool.
**Techniques & methods:**
- Add an index matching the filter columns — then confirm with EXPLAIN that the plan flipped.
- Watch for index-killers: functions on columns (`lower(email) = ...` — needs an expression index), leading-wildcard `LIKE '%x%'`, and type mismatches that force casts.
- Accept scans when they are correct: small tables, or queries genuinely returning most of the table (analytics) — the planner choosing a scan there is smart, not broken.
**Pitfalls:** Forcing index use everywhere; a scan of a 200-row table is faster than an index lookup.
**Rules:** MUST investigate any Seq Scan on a large table in a user-facing query. SHOULD alert on slow-query logs rather than discovering scans during an outage.

### #45 — Connection Pooling
**What:** A pool reuses a small set of open database connections across many app requests instead of opening a new connection per request.
**Why it matters:** Each Postgres connection is a process costing ~5–10 MB RAM; thousands of app threads opening connections directly will exhaust memory and CPU. Connection setup also adds latency to every request.
**Techniques & methods:**
- Size the pool by the database's capacity, not the app's thread count — a common starting formula is `(2 × CPU cores) + disk spindles`; most apps need far fewer connections than they guess.
- Use an external pooler (PgBouncer) when many app instances connect. **Transaction mode** gives the best reuse; session mode preserves session state.
- Set connection timeouts and idle timeouts so dead connections don't leak.
**Pitfalls:** Pool per app instance × many instances = the same overload, one level up. Transaction-mode pooling breaks session-level features (prepared statements in older setups, `SET`, advisory locks).
**Rules:** MUST pool connections in any multi-user service. NEVER open a raw connection per request or per query in a loop.

### #46 — Database Migrations
**What:** Versioned, scripted schema changes (create table, add column, add index) applied in order by a tool (Alembic, Flyway, Rails/Prisma/Kysely migrations) and recorded in a schema-history table.
**Why it matters:** Without them, environments drift, deploys depend on someone's memory, and "works on my machine" becomes "the staging schema is different."
**Techniques & methods:**
- One logical change per migration; commit migration files with the code that needs them.
- Use the **expand-and-contract** pattern for zero-downtime changes: add new column → deploy code writing both → backfill → switch reads → drop old column in a later release.
- Create indexes on large tables `CONCURRENTLY` (Postgres) so writes aren't blocked.
**Pitfalls:** Editing an already-applied migration instead of writing a new one; mixing schema changes with huge data backfills in one transaction.
**Rules:** MUST make every schema change a migration file — NEVER hand-apply DDL to production. MUST test migrations against a production-sized snapshot before release.

### #47 — Down Migrations
**What:** The reverse script of a migration: the `down` that undoes the `up` (drop the added column, restore the renamed table).
**Why it matters:** When a deploy goes bad at 2 a.m., a tested down migration is the difference between a 2-minute rollback and an incident.
**Techniques & methods:**
- Write the down at the same time as the up, while the change is fresh in mind.
- Test the round trip in CI: up → down → up must leave the schema identical.
- Accept that some downs are lossy (a dropped column's data is gone) — document it and snapshot/backup before destructive ups.
**Pitfalls:** Auto-generated downs that silently don't invert data migrations; assuming rollback is possible after new code has written data in the new format — after that point, "roll forward" is the only safe move.
**Rules:** MUST ship a down (or an explicit "irreversible — restore from backup" note) with every migration. SHOULD prefer roll-forward fixes once new-format data exists.

### #48 — Transactions
**What:** A group of statements executed as one atomic unit: all succeed and commit, or any failure rolls everything back.
**Why it matters:** Without transactions, a crash mid-operation leaves half-written state — money debited but never credited, an order with no line items.
**Techniques & methods:**
- Wrap every multi-statement business invariant in one transaction: debit + credit, order + items, state change + outbox row.
- Keep transactions short — do network calls, file I/O, and slow computations *outside*; hold locks for milliseconds, not seconds.
- Use savepoints for partial rollback inside a larger unit of work.
**Pitfalls:** Long-running transactions block VACUUM, hold locks, and cause pile-ups. Forgetting that sequences (auto-increment values) do *not* roll back — gaps are normal.
**Rules:** MUST use a transaction whenever two writes must succeed or fail together. NEVER call external APIs inside an open transaction.

### #49 — ACID
**What:** The four guarantees of a proper transaction: **A**tomicity (all or nothing), **C**onsistency (constraints and invariants always hold), **I**solation (concurrent transactions don't corrupt each other), **D**urability (committed data survives crashes).
**Why it matters:** ACID is why you can trust a relational database with money and inventory. Systems that quietly drop these guarantees trade correctness for speed — sometimes knowingly, often not.
**Techniques & methods:**
- Atomicity and durability come from the write-ahead log (WAL): commit means the log is flushed to disk.
- Consistency is partly *your* job: the DB enforces declared constraints (foreign keys, checks, uniques) — undeclared invariants are unenforced.
- Isolation is tunable (see #50); stronger isolation costs throughput.
**Pitfalls:** Assuming a NoSQL or distributed store is "basically ACID" — many offer single-document or single-partition atomicity only. Assuming ACID covers business rules you never encoded.
**Rules:** MUST choose the database whose guarantees match the data's cost of being wrong. NEVER rely on application code alone to enforce an invariant the DB could enforce.

### #50 — Isolation Levels
**What:** Settings controlling what one transaction may see of another's uncommitted or concurrent work: Read Uncommitted, Read Committed, Repeatable Read, Serializable.
**Why it matters:** Too weak, and concurrent requests corrupt data (lost updates, double-spends). Too strong everywhere, and throughput collapses under lock contention and serialization failures.
**Techniques & methods:**
- Know the anomalies: **dirty read** (seeing uncommitted data), **non-repeatable read** (same row changes between reads), **phantom read** (new rows appear in a range query), **write skew** (two transactions each preserve a rule alone but break it together).
- Postgres specifics (per official docs): default is **Read Committed**; Read Uncommitted behaves as Read Committed; **Repeatable Read** is snapshot isolation and actually prevents phantoms — but not write skew; **Serializable** uses SSI and may abort transactions, so code must retry.
- Raise the level per-transaction only where the invariant needs it (balances, inventory).
**Pitfalls:** Assuming the same level name means the same behavior across databases — it doesn't.
**Rules:** MUST handle serialization-failure retries if you use Serializable. SHOULD stay on Read Committed and use explicit locks/constraints for the few paths that need more.

### #51 — Deadlocks
**What:** Two or more transactions each hold a lock the other needs, so all wait forever; the database detects the cycle and aborts one victim.
**Why it matters:** Deadlocks surface as random production errors and hung requests; under load they multiply because more concurrency means more lock-order collisions.
**Techniques & methods:**
- Prevent by ordering: always lock rows in a consistent global order (e.g., ascending primary key) in every code path.
- Keep transactions short and lock late; batch updates sorted by id.
- Detect and recover: catch the deadlock error (Postgres SQLSTATE 40P01) and retry the whole transaction with small backoff — retries are a normal part of the design.
**Pitfalls:** Retrying only the failed statement instead of the whole transaction; holding a lock while waiting on user input or an API call.
**Rules:** MUST implement bounded retry for deadlock/serialization errors on transactional writes. NEVER update the same tables in different orders in different endpoints.

### #52 — Optimistic Locking
**What:** No lock is held while editing; instead each row carries a `version` (or `updated_at`) that is checked on write — `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`. If the check matches 0 rows, someone else saved first.
**Why it matters:** It prevents the silent lost update: two users edit the same record, the second save overwrites the first with no error anywhere.
**Techniques & methods:**
- Return a conflict (HTTP 409) when the version check fails, and let the user merge or reload.
- Works best when conflicts are rare (most CRUD, admin panels, settings).
- Many ORMs support it natively (`@Version` in JPA, `lock_version` in Rails).
**Pitfalls:** Checking the version in application code with a read-then-write instead of in the UPDATE's WHERE clause — that reintroduces the race.
**Rules:** SHOULD use optimistic locking on any record users edit concurrently. MUST make the version check part of the atomic write, not a separate read.

### #53 — Pessimistic Locking
**What:** Explicitly locking rows before working on them — `SELECT ... FOR UPDATE` — so other transactions block (or skip) until you commit.
**Why it matters:** For high-contention resources (the last seat, the account balance), optimistic retries waste work; a queue is more predictable than a retry storm.
**Techniques & methods:**
- `FOR UPDATE` for exclusive write locks; `FOR SHARE` when others may read-lock too.
- `FOR UPDATE SKIP LOCKED` is the standard pattern for job queues: many workers each grab uncontended rows.
- `NOWAIT` fails fast instead of queueing when a lock isn't worth waiting for.
**Pitfalls:** Locking and then doing slow work (API calls, user think-time) serializes your whole system on that row. Lock ordering mistakes here cause deadlocks (#51).
**Rules:** MUST keep the locked critical section to database work only. SHOULD prefer SKIP LOCKED over polling flags for work queues.

### #54 — Normalization
**What:** Organizing tables so each fact is stored once: 1NF (atomic values, no repeating groups), 2NF (no partial dependency on part of a key), 3NF (no transitive dependencies — non-key columns depend only on the key).
**Why it matters:** Duplicated facts drift apart: the customer's email updated in one table but not another becomes a data-corruption bug that no code fix can fully heal.
**Techniques & methods:**
- Model entities and relationships first; let foreign keys express the relationships.
- Normalize to 3NF by default — it's the sweet spot for OLTP systems.
- Let the DB enforce it with constraints (#56, #57), not just convention.
**Pitfalls:** Over-normalizing into a dozen joins for every screen (see #55 for the deliberate unwind); storing comma-separated lists or JSON blobs for data you need to query and constrain.
**Rules:** MUST default to 3NF for transactional data. NEVER store the same fact in two places without a sync mechanism and a reason.

### #55 — Denormalization
**What:** Deliberately duplicating or pre-computing data — a stored `order_total`, a cached `comment_count`, a flattened reporting table — to make reads fast.
**Why it matters:** Some reads are impossible at scale in pure 3NF: a dashboard aggregating 50M rows per page load will take the site down. A maintained copy answers in milliseconds.
**Techniques & methods:**
- Denormalize a *copy*, never the source of truth; the normalized tables remain canonical.
- Maintain copies via triggers, application writes in the same transaction, CDC (#73), or scheduled rollups into materialized views (#69).
- Measure first: denormalize the specific query that EXPLAIN proves is too slow.
**Pitfalls:** Duplicating without an update strategy — stale counters and drift are guaranteed. Denormalizing "just in case" pays the complexity cost with no proven benefit.
**Rules:** MUST document, for every denormalized field, what updates it and how drift is detected/repaired. NEVER denormalize before you have a measured read problem.

### #56 — Foreign Keys
**What:** A constraint declaring that a column's value must exist as a key in another table — `orders.customer_id` must reference a real `customers.id`.
**Why it matters:** It makes orphaned data impossible at the only layer that sees every write: the database. Application-level checks race; constraints don't.
**Techniques & methods:**
- Declare FKs on every relationship column, and index the referencing column (Postgres does not auto-index the child side — unindexed FKs cause slow joins and slow parent deletes).
- Choose delete/update behavior explicitly (see #58).
- Keep them enabled in all environments, including test, so behavior matches production.
**Pitfalls:** Dropping FKs "for performance" trades tiny write overhead for silent corruption. Bulk-load and sharding setups sometimes relax them — that must be a conscious, compensated decision.
**Rules:** MUST use foreign keys in a single-database OLTP system by default. NEVER remove one for speed without a benchmark proving it matters.

### #57 — Unique Constraints
**What:** A constraint (backed by a unique index) guaranteeing no two rows share a value or combination of values — one row per email, one enrollment per (student, course).
**Why it matters:** It's the only race-proof way to prevent duplicates. The app-level pattern "SELECT to check, then INSERT" lets two concurrent requests both pass the check and both insert.
**Techniques & methods:**
- Put uniques on natural business keys, not just surrogate ids.
- Use composite uniques for pair-wise rules, and partial uniques for scoped rules (`WHERE deleted_at IS NULL`, "one *active* subscription per user").
- Catch the unique-violation error and translate it into a clean user-facing message or idempotent success.
**Pitfalls:** Case sensitivity surprises — `A@x.com` vs `a@x.com` need a `citext` type or a normalized/lowered column with the unique on that.
**Rules:** MUST enforce every "there can only be one" business rule with a unique constraint. NEVER rely on check-then-insert in application code.

### #58 — Cascading Deletes
**What:** FK delete actions: `ON DELETE CASCADE` (delete children with the parent), `RESTRICT`/`NO ACTION` (block), `SET NULL`, `SET DEFAULT`.
**Why it matters:** Cascade is a loaded gun: deleting one parent can silently erase millions of dependent rows — including ones nobody remembered were dependent.
**Techniques & methods:**
- Default to `RESTRICT` for anything with business or audit value; force the application to delete deliberately.
- Reserve `CASCADE` for pure implementation details that are meaningless without the parent (order line items, join-table rows).
- Before any large parent delete, count what the cascade will touch.
**Pitfalls:** Cascades don't fire application callbacks/hooks in most ORMs, so side effects (file cleanup, events) are skipped. Deep cascade chains make deletes slow and lock-heavy.
**Rules:** MUST choose the delete action deliberately per FK — never accept the default by accident. NEVER cascade into tables containing financial, audit, or user-generated content of record.

### #59 — Soft Deletes
**What:** Instead of DELETE, set a `deleted_at` timestamp (or `is_deleted` flag); queries filter out soft-deleted rows, which remain in the table.
**Why it matters:** It buys undo, audit trails, and recovery from fat-finger deletes — at the price of complexity in every single query, forever.
**Techniques & methods:**
- Scope it in the data layer (ORM global scope / default filter) so no query can forget the filter.
- Make unique constraints partial (`WHERE deleted_at IS NULL`) or soft-deleted rows will block reusing emails/usernames.
- Schedule a hard-delete job for data past its retention window (also a GDPR/privacy requirement).
**Pitfalls:** Foreign keys and joins that ignore the flag leak deleted data back into results. Tables grow forever; every index carries dead weight.
**Rules:** SHOULD soft-delete only where undo/audit is a real requirement, not by default. MUST pair soft deletes with a retention/hard-delete policy.

### #60 — UUIDs vs Auto-Increment
**What:** Surrogate keys as sequential integers (`BIGSERIAL`/identity) versus random or time-ordered UUIDs generated anywhere, including clients.
**Why it matters:** The choice affects index performance, security (guessable IDs), and whether you can generate IDs offline or merge data across shards.
**Techniques & methods:**
- Auto-increment: compact, sequential (B-tree friendly), but leaks record counts and enables ID enumeration/IDOR probing if exposed in URLs.
- Random UUID v4 as a primary key fragments the B-tree — random inserts split pages constantly. Prefer **UUIDv7** (time-ordered, RFC 9562; native `uuidv7()` in Postgres 18) for locality with global uniqueness.
- A strong default: internal bigint PK, plus a public UUID column for anything shown in URLs/APIs.
**Pitfalls:** Exposing sequential ids lets competitors scrape your growth rate and attackers walk your object space.
**Rules:** MUST NOT expose guessable sequential IDs for private resources. SHOULD use UUIDv7 (not v4) when you need distributed ID generation.

### #61 — Cursor-Based Pagination
**What:** Paginating by a bookmark instead of an offset: each page returns a cursor (the last row's sort key, e.g., `(created_at, id)`), and the next page asks for rows *after* that key (`WHERE (created_at, id) < (?, ?)`).
**Why it matters:** `OFFSET 100000` makes the database read and discard 100,000 rows — page 500 is 50× slower than page 1, and inserts during scrolling cause duplicates and skipped rows.
**Techniques & methods:**
- Sort by a unique, stable key — use a tiebreaker (`created_at` alone isn't unique; append `id`).
- Encode the cursor opaquely (base64 JSON) so clients treat it as a token, not a contract.
- This is exactly how mature APIs (and keyset/seek pagination generally) scale feeds and lists.
**Pitfalls:** Cursor pagination can't jump to "page 37" and complicates total counts — admin UIs that need that may keep OFFSET on small tables.
**Rules:** MUST use cursor pagination for large or fast-growing user-facing lists. NEVER use OFFSET-based pagination on unbounded tables.

### #62 — Full-Text Search
**What:** Search over text using inverted indexes, tokenization, stemming, and relevance ranking — Postgres `tsvector`/`tsquery` with a GIN index, or a dedicated engine (Elasticsearch/OpenSearch, Typesense, Meilisearch).
**Why it matters:** `LIKE '%term%'` can't use a normal index and matches substrings, not words — no ranking, no stemming ("run" should match "running"), and full scans on every keystroke.
**Techniques & methods:**
- Start with Postgres FTS: store a generated `tsvector` column, GIN-index it, rank with `ts_rank`. It covers most apps to surprising scale.
- Move to a dedicated engine when you need typo tolerance, faceting, synonyms, or heavy search traffic — and sync via CDC (#73), treating the engine as a rebuildable index, never the source of truth.
- Weight fields: title matches should outrank body matches.
**Pitfalls:** Letting the search index become a second source of truth; forgetting language/stemming configuration so results feel "dumb."
**Rules:** MUST NOT use leading-wildcard LIKE for user search on large tables. SHOULD keep search indexes rebuildable from the database at any time.

### #63 — Read Replicas
**What:** Copies of the primary database, kept in sync by streaming replication, that serve read queries so the primary only handles writes.
**Why it matters:** Reads usually outnumber writes 10:1 or more. Replicas let you scale reads horizontally and isolate heavy analytics/reporting so it can't slow down checkout.
**Techniques & methods:**
- Route reads to replicas at the data-access layer or via a proxy; keep writes and read-your-own-write paths on the primary.
- Use replicas for reports, dashboards, and search indexing — workloads tolerant of slight staleness.
- Replicas double as failover candidates and backup sources.
**Pitfalls:** Routing *all* reads to replicas breaks flows that read immediately after writing (see #64). Replicas under a write-heavy primary can fall behind exactly when traffic peaks.
**Rules:** MUST send any read that must reflect the user's own just-made write to the primary. SHOULD monitor replication lag wherever replicas serve traffic.

### #64 — Replication Lag
**What:** The delay between a write committing on the primary and being visible on a replica — milliseconds normally, seconds or minutes under load.
**Why it matters:** Lag creates bugs that look haunted: the user updates their profile, reloads, and sees the old value; support can't reproduce it because by then the replica has caught up.
**Techniques & methods:**
- Measure lag continuously (replay lag in Postgres) and alert on it like an error rate.
- Defend UX: after a write, read from the primary for that user/session (sticky reads), or pass the write's LSN/position and wait for the replica to reach it.
- Shed replica traffic or pause non-essential replication consumers during lag spikes.
**Pitfalls:** Treating lag as constant — it spikes during deploys, batch jobs, and traffic peaks, precisely when correctness matters most.
**Rules:** MUST design every replica-read feature to tolerate or explicitly avoid stale reads. NEVER assume "replication is basically instant."

### #65 — Sharding
**What:** Splitting one logical dataset across multiple independent databases ("shards") by a shard key — e.g., users hashed by `user_id` — so each shard holds a subset of rows.
**Why it matters:** It's the endgame of write scaling: when one machine can't hold the data or absorb the writes, sharding is how the biggest systems keep going. It is also the most expensive architectural move you can make.
**Techniques & methods:**
- Choose the shard key from your dominant query pattern (usually tenant or user id) so most queries hit exactly one shard.
- Route with consistent hashing or a lookup service; keep cross-shard queries and joins out of the design — they become application-side scatter-gather.
- Exhaust cheaper options first: indexing, replicas, partitioning (#66), vertical scaling, archiving.
**Pitfalls:** A bad shard key creates hot partitions (#67) and makes the most common query a cross-shard join. Resharding a live system is a major project.
**Rules:** MUST NOT shard until a single (possibly partitioned) primary is demonstrably the bottleneck. NEVER pick a shard key without analyzing the top queries it must serve.

### #66 — Partitioning
**What:** Splitting one logical table into physical pieces — by range (months), list (region), or hash — while queries still address a single table name. Postgres declarative partitioning is the common form.
**Why it matters:** It keeps huge tables manageable: queries prune to one partition, old data is dropped by detaching a partition instead of a billion-row DELETE, and indexes stay small and cache-friendly.
**Techniques & methods:**
- Range-partition time-series and event/log tables by month; retention becomes `DROP TABLE` on the old partition — instant and lock-free.
- The partition key must appear in queries for pruning to work; the planner skips irrelevant partitions only when the key is constrained.
- Remember constraints: in Postgres, unique constraints must include the partition key.
**Pitfalls:** Partitioning by a key your queries don't filter on — you pay the complexity and get no pruning. Too many partitions (tens of thousands) hurt planning time.
**Rules:** SHOULD partition tables heading past ~100M rows or with time-based retention. MUST align the partition key with both query filters and the retention policy.

### #67 — Hot Partitions
**What:** One shard or partition receiving a wildly disproportionate share of traffic — because of a celebrity tenant, sequential keys hitting the newest range partition, or skewed hash inputs.
**Why it matters:** The system has capacity everywhere except the one place that matters: that node saturates, its latency spikes, and your "horizontally scaled" database falls over like a single server.
**Techniques & methods:**
- Detect: monitor per-partition/per-shard load, not just cluster averages — averages hide hotspots.
- Fix by splitting the hot partition, adding a random/salted suffix to the key for the hot tenant, giving whale tenants their own shard, and caching celebrity keys aggressively.
- Prefer hash distribution over naive range keys for write-heavy ingestion (monotonic keys all land on the tail partition).
**Pitfalls:** Designing for average load. Traffic is never average — it's Zipfian: a few keys always dominate.
**Rules:** MUST monitor load at partition granularity. SHOULD have a written play for isolating a hot tenant before you need it.

### #68 — Postgres VACUUM
**What:** Postgres's cleanup process: because MVCC keeps old row versions ("dead tuples") after UPDATE/DELETE, VACUUM marks that space reusable and maintains the visibility map; autovacuum runs it automatically in the background.
**Why it matters:** If vacuum can't keep up, tables and indexes bloat (10× size, everything slows), and in the worst case transaction-ID wraparound forces an emergency shutdown to prevent data corruption.
**Techniques & methods:**
- Leave autovacuum on; tune it *more aggressive* (lower scale factors) on large, update-heavy tables instead of the global default.
- Watch dead-tuple counts and last-autovacuum times via `pg_stat_user_tables`.
- Avoid long-running transactions and idle-in-transaction sessions — they pin the horizon and block cleanup of everything behind them.
**Pitfalls:** `VACUUM FULL` rewrites the table under an exclusive lock — it's a maintenance-window tool, not a fix. Disabling autovacuum "because it uses resources" creates the outage it was preventing.
**Rules:** NEVER disable autovacuum. MUST alert on table bloat and on transactions left open for minutes. SHOULD treat wraparound headroom (`age(datfrozenxid)`) as a monitored vital sign.

### #69 — Materialized Views
**What:** A query result stored as a physical table (`CREATE MATERIALIZED VIEW`) and refreshed on demand, rather than computed on every read.
**Why it matters:** Expensive aggregations — revenue by day, leaderboards, report rollups — can take seconds over raw data but milliseconds from a precomputed result.
**Techniques & methods:**
- Refresh on a schedule matched to the freshness the business actually needs (every 5 min, hourly), or trigger refreshes from CDC/pipeline events.
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` avoids read locks but requires a unique index on the view and costs more; plain refresh is atomic-swap but blocks reads briefly.
- In Postgres, materialized views don't auto-update — the refresh strategy is your design decision.
**Pitfalls:** Consumers assuming the data is real-time. Refresh jobs silently failing means dashboards show confidently stale numbers.
**Rules:** MUST label materialized data with its as-of timestamp and monitor refresh job success. SHOULD prefer a rollup table maintained incrementally when refresh cost itself becomes the bottleneck.

### #70 — Backups
**What:** Copies of the database kept separately from production: logical dumps (`pg_dump`), physical/base backups, and managed snapshots — the last line of defense against deletion, corruption, and ransomware.
**Why it matters:** Every other failure in this section is recoverable with good backups and potentially permanent without them. Hardware fails, humans run the wrong DELETE, attackers encrypt what they can reach.
**Techniques & methods:**
- Follow **3-2-1**: at least 3 copies, on 2 different media/services, 1 offsite (and outside the production account's blast radius).
- Combine periodic base backups with continuous WAL archiving for PITR (#72); snapshot-only strategies cap you at the last snapshot.
- Encrypt backups, and restrict delete permissions — backups in the same account an attacker compromises are not backups.
**Pitfalls:** Backups that have silently failed for months (unmonitored jobs, full disks, expired credentials). Backup success emails nobody reads.
**Rules:** MUST automate backups and alert on their *failure*, not just run them. MUST store at least one copy beyond the reach of production credentials.

### #71 — Testing Your Restores
**What:** Regularly performing an actual restore from backup into a scratch environment and verifying the data — proving recoverability instead of assuming it.
**Why it matters:** An untested backup is a hypothesis. Teams routinely discover during a real incident that dumps were corrupt, incomplete, missing extensions/wrappers, or too slow to restore within any acceptable window.
**Techniques & methods:**
- Automate it: scheduled job restores the latest backup, runs sanity checks (row counts on key tables, a few business invariants, app boot + smoke query), and reports the restore duration.
- Measure and record **actual restore time** — that's your real recovery time, and it feeds RTO planning (#72, and §7.4's RTO/RPO).
- Rotate who performs manual restores, so the knowledge isn't one person's.
**Pitfalls:** Testing "the backup file exists and has nonzero size." That's not a restore test.
**Rules:** MUST run an automated restore drill on a schedule (monthly minimum). NEVER claim a backup strategy works without a timestamped, successful restore to point to.

### #72 — Point-in-Time Recovery (PITR)
**What:** Restoring a base backup and replaying archived write-ahead log (WAL) up to a chosen moment — recovering to 30 seconds *before* the bad deploy or the accidental `DELETE`.
**Why it matters:** Snapshots alone force a bad choice: restore last night's state and lose a day of orders. PITR turns most data disasters into losing minutes, not days.
**Techniques & methods:**
- In Postgres: take base backups (`pg_basebackup` / managed equivalents) and continuously archive WAL segments to object storage; recovery targets a timestamp, transaction id, or named restore point.
- Create a named restore point before risky operations (big migrations, bulk deletes) so recovery has an exact target.
- Practice the full procedure (#71) — PITR under incident pressure is no time to learn your tooling.
**Pitfalls:** Gaps in WAL archiving silently break the recovery chain; a missing segment means you can only recover to before the gap.
**Rules:** MUST continuously archive WAL and monitor for archive gaps. SHOULD set restore points before destructive production operations.

### #73 — Change Data Capture (CDC)
**What:** Streaming row-level changes (inserts, updates, deletes) out of the database's transaction log — Postgres logical decoding, MySQL binlog — as an event stream, typically via Debezium into Kafka.
**Why it matters:** It's the reliable way to keep other systems in sync with the database: search indexes, caches, analytics, and other services — without dual writes or polling.
**Techniques & methods:**
- Prefer log-based CDC over polling queries: no missed deletes, no load from repeated scans, changes arrive in commit order with low latency.
- Consumers must be idempotent and expect at-least-once delivery; include schema versioning discipline (additive changes) so consumers don't break on deploys.
- Monitor consumer lag and replication-slot disk usage — a stalled consumer can fill the primary's disk with retained WAL.
**Pitfalls:** Treating CDC as free: it couples consumers to your schema, and hard deletes erase history unless you capture before-images or use soft deletes (#59).
**Rules:** MUST use log-based CDC (not timestamp polling) for production sync pipelines. SHOULD treat the event schema as a public API with compatibility rules.

### #74 — Outbox Pattern
**What:** Instead of writing to the database and publishing to a message broker as two separate operations, insert the event into an `outbox` table **in the same transaction** as the business change; a separate relay (CDC like Debezium, or a polling publisher) then delivers it to the broker.
**Why it matters:** It kills the dual-write problem: without it, a crash between "DB commit" and "broker publish" loses the event (or publishes an event for a change that rolled back) — the classic source of "the order exists but the email/shipment never happened."
**Techniques & methods:**
- Outbox row shape: id, aggregate type/id, event type, JSON payload, created_at — all written atomically with the state change.
- Relay via CDC for low latency and commit-order delivery; polling relays are simpler but add latency and duplicate risk.
- Delivery is **at-least-once**: consumers MUST dedupe (store processed event ids) to achieve effectively-once processing.
**Pitfalls:** Publishing directly to the broker "just for this one case"; marking outbox rows published *before* actual delivery; unbounded outbox growth without a cleanup job.
**Rules:** MUST route every state-change event through the outbox — NEVER dual-write to DB + broker. MUST make consumers idempotent.

### #75 — ORM Lazy Loading
**What:** The ORM pattern where related objects are fetched on first access rather than with the initial query — convenient property access that secretly issues SQL.
**Why it matters:** Lazy loading is the mechanism behind most N+1 disasters (#43) and a nastier one: queries firing during rendering/serialization, after the transaction has closed, causing errors or holding connections hostage.
**Techniques & methods:**
- Know your ORM's defaults and set fetch plans explicitly per use case: eager (`JOIN`/separate select) for data you know you'll render, lazy only for genuinely occasional access.
- Detect in development: enable SQL logging, assert query counts in tests, use tools that flag lazy loads outside a session.
- For APIs, load exactly the shape the response needs (DTO/projection queries) instead of full object graphs.
**Pitfalls:** Lazy-loading inside loops and inside JSON serializers — invisible in code review, brutal in production. The opposite sin exists too: eager-loading the entire graph "to be safe."
**Rules:** MUST make data loading explicit and visible in the service layer. NEVER access lazy associations in loops, serializers, or after the session/transaction boundary.

## 7.3 Distributed Systems

### #76 — CAP Theorem
**What:** When a network partition splits your nodes, a distributed system must choose: stay consistent (reject writes it can't synchronize) or stay available (accept writes that may diverge).
**Why it matters:** Partitions are faults, not choices — they *will* happen. Picking wrong means either a checkout outage during a network blip, or silently divergent data you must reconcile later.
**Techniques & methods:**
- Frame it as Kleppmann does: "Consistent or Available *when Partitioned*" — partition tolerance is not optional, so never label a database "CA."
- CAP's "consistency" means linearizability (one up-to-date copy), not ACID consistency — don't conflate them.
- Choose per operation, not per system: payments lean consistent; like-counters lean available.
**Pitfalls:** Believing "2 of 3" marketing; assuming a vendor's CP/AP label describes behavior for *your* workload; forgetting the choice also applies during normal operation as a latency trade-off (see PACELC).
**Rules:** MUST decide the partition behavior for every data store in the design doc. NEVER claim a system "beats CAP." SHOULD default user-facing reads to available, money/state writes to consistent.

### #77 — Eventual Consistency
**What:** If writes stop, all replicas eventually converge to the same value — but reads in between may return stale data.
**Why it matters:** Users see their own post missing, a price flip-flopping, or inventory resurrecting. Unmanaged, it produces "your app is broken" tickets that are actually the consistency model working as designed.
**Techniques & methods:**
- Use conflict-resolution that fits the data: last-write-wins only for overwrite-safe fields; CRDTs or version vectors where merges must be lossless.
- Offer *session guarantees* where cheap: read-your-writes (route a user to the leader or pin to a replica watermark for a few seconds after their write).
- Make staleness visible in UX where it matters ("syncing…", timestamps) instead of pretending data is instant.
**Pitfalls:** Assuming "eventual" means "within a second" — under load or partition it can be minutes; LWW silently discarding concurrent writes based on skewed clocks.
**Rules:** MUST document which reads may be stale and for how long. NEVER use eventual consistency for balances, permissions, or inventory counts without an explicit reconciliation path. SHOULD prefer read-your-writes for the acting user.

### #78 — Strong Consistency
**What:** Every read returns the result of the most recent completed write, as if there were a single copy of the data (linearizability is the strongest common form).
**Why it matters:** It makes distributed systems behave like one machine — no stale balances, no double-spend races — but you pay in latency and availability on every operation.
**Techniques & methods:**
- Get it from single-leader replication with leader reads, or from consensus-backed stores (etcd, ZooKeeper, Spanner-style systems).
- Scope it narrowly: apply strong reads only to the fields that need them (auth checks, balance checks), not to whole pages.
- Use compare-and-swap / conditional writes on a version or ETag for single-key strong semantics without a global lock.
**Pitfalls:** Paying linearizable latency on every read including analytics; assuming "strongly consistent" marketing claims cover multi-key transactions when they only cover single rows.
**Rules:** MUST use strong consistency for authorization decisions and financial mutations. SHOULD measure the latency cost before enabling it broadly. NEVER hand-roll strong consistency with application-level checks across replicas.

### #79 — Raft Consensus
**What:** A consensus algorithm where an elected leader receives all writes, replicates them as a log to followers, and commits an entry once a majority has stored it.
**Why it matters:** Consensus is how etcd, Consul, and many databases agree on configuration, leadership, and critical state despite crashes. Its failure mode — no majority, no progress — is the price of never diverging.
**Techniques & methods:**
- Don't implement Raft yourself; embed etcd/Consul or use a managed control plane. You consume consensus; you don't write it.
- Keep clusters small and odd (3 or 5 nodes); each added node slows commits and adds failure surface.
- Treat "committed" as the only truth: an entry acknowledged by the leader but not majority-replicated can still be lost.
**Pitfalls:** Even-sized clusters (4 nodes tolerates the same 1 failure as 3, but needs 3 for quorum); placing all members in one availability zone, defeating the purpose.
**Rules:** NEVER implement your own consensus algorithm in product code. MUST run consensus clusters with ≥3 members across failure domains. SHOULD use the consensus store only for small, critical metadata — never bulk data.

### #80 — Leader Election
**What:** The process by which cluster members agree on a single node to coordinate writes or scheduled work for a term/epoch.
**Why it matters:** Two active leaders (see Split Brain) corrupt data; zero leaders stall the system. Election quality determines whether failover is a 5-second blip or an incident.
**Techniques & methods:**
- Delegate election to a proven system (Raft/Paxos store, Kubernetes, your database's built-in failover) instead of app-level heartbeat voting.
- Attach a monotonically increasing term/epoch to leadership and *fence* with it: downstream systems reject messages from older terms (fencing tokens).
- Make followers detect leader death via timeouts longer than GC pauses and network jitter, or you'll flap leadership constantly.
**Pitfalls:** Election based on "first to grab a lock" with no fencing — the paused old leader wakes up and keeps writing; timeouts so tight a long GC pause triggers endless re-elections.
**Rules:** MUST fence every leader with an epoch/term checked by anything that accepts its writes. NEVER build leader election on top of a plain TTL key alone without fencing. SHOULD alert on election frequency — flapping is a symptom, not noise.

### #81 — Split Brain
**What:** A partition divides a cluster into groups that each believe they are in charge, electing separate leaders and accepting divergent writes.
**Why it matters:** It's the worst distributed failure: both sides look healthy, users keep writing, and when the partition heals you own two conflicting histories that may be impossible to merge (classic case: two primaries both decrementing the same inventory).
**Techniques & methods:**
- Prevent by quorum: only the side holding a majority of members may elect a leader and accept writes; the minority side must refuse writes or shut down.
- Add fencing tokens so even if a zombie leader survives, storage rejects its stale-epoch writes.
- If divergence is possible by design (multi-leader), invest in real conflict resolution (CRDTs, application-level merge) *before* you need it.
**Pitfalls:** "Active-active" across regions with no conflict strategy; health checks that declare the other side dead based on one failed ping, triggering a second primary.
**Rules:** MUST guarantee at most one write-accepting side via majority quorum. NEVER run dual primaries without a designed merge strategy. SHOULD rehearse partition scenarios in staging — split brain is found in game days, not in code review.

### #82 — Quorums
**What:** Requiring an overlapping majority: with N replicas, a write must reach W nodes and a read must consult R nodes, where W + R > N guarantees the read sees the latest write.
**Why it matters:** Quorums are the dial between consistency, latency, and fault tolerance in Dynamo-style stores (Cassandra, DynamoDB, Riak). Mis-set, you get stale reads you believed were fresh — or outages at the first node failure.
**Techniques & methods:**
- Common setting: N=3, W=2, R=2 tolerates one node down for both reads and writes.
- Remember network delays can break the guarantee in practice (Kleppmann's warning): variable latency means strict quorums aren't automatically linearizable — treat them as "very likely fresh," and verify vendor semantics.
- Consider *sloppy quorums* + hinted handoff for availability-first stores, knowing they weaken the overlap guarantee.
**Pitfalls:** W+R>N on paper but writes timing out silently at lower durability; quorum reads hitting only fast nodes and racing an in-flight write.
**Rules:** MUST state N/W/R explicitly in config and docs, never accept defaults blindly. SHOULD pick quorums per table/use-case, not cluster-wide. NEVER promise users strong reads from a sloppy-quorum configuration.

### #83 — Clock Skew
**What:** No two machines' clocks agree exactly; drift and NTP corrections mean timestamps from different nodes are not comparable.
**Why it matters:** Ordering events, expiring tokens, or resolving conflicts by wall-clock time silently corrupts data when one node's clock is minutes ahead — it "wins" every last-write-wins comparison and resurrects deleted records.
**Techniques & methods:**
- Never order cross-node events by client- or server-supplied wall time; use sequence numbers, Lamport/vector clocks, or a single authority's timestamp.
- For LWW conflict resolution, treat timestamps as untrusted hints, and monitor node clock offset (NTP drift alerts at >250ms).
- Systems like Spanner bound the uncertainty (TrueTime, commit-wait) — the honest approach is to *wait out* the skew, not pretend it doesn't exist.
**Pitfalls:** TTLs and lease expiries judged by different clocks; JWT `exp` validation failing randomly across a fleet with skewed nodes.
**Rules:** NEVER use wall-clock timestamps as the sole ordering or conflict-resolution mechanism across machines. MUST monitor clock offset on every host. SHOULD use monotonic clocks for measuring durations and timeouts in code.

### #84 — Distributed Locks
**What:** Mutual exclusion across processes/machines, usually via a lock service (etcd, ZooKeeper, Redis, a database row) with a lease.
**Why it matters:** A broken distributed lock is worse than none: two holders both believe they're exclusive and corrupt the same resource. Kleppmann's Redlock critique showed timing assumptions (pauses, skew) break naive Redis locks.
**Techniques & methods:**
- Prefer not needing the lock: idempotent operations, unique constraints, and single-writer designs remove most lock use cases.
- If you must lock, use a consensus-backed store (etcd/ZooKeeper) or a DB lock, and always pair the lock with a **fencing token** (monotonic counter checked by the resource).
- Keep leases short, renew explicitly, and design the critical section to finish well within the lease under load.
**Pitfalls:** Assuming the lock protects you after the holder was GC-paused past its lease expiry; Redlock across independent Redis nodes without fencing; locks with no expiry that deadlock forever after a crash.
**Rules:** MUST attach fencing tokens to any lock guarding data mutations. NEVER use a distributed lock as your only correctness mechanism for payments or inventory. SHOULD set lock-hold alerts — long holds are incidents in waiting.

### #85 — Consistent Hashing
**What:** Mapping keys and nodes onto a hash ring so each key belongs to the next node clockwise; adding/removing a node remaps only ~1/N of keys instead of nearly all.
**Why it matters:** It's what makes caches, sharded databases, and load balancers (Dynamo, Cassandra, Memcached fleets) scale without a full reshuffle on every membership change — a reshuffle means mass cache misses and load spikes.
**Techniques & methods:**
- Use virtual nodes (many ring positions per physical node) to smooth load distribution and let big nodes carry more weight.
- Pick the hash on the key that matches your access pattern (tenant ID, user ID) so related data co-locates.
- Combine with replication: the next W distinct nodes clockwise hold the replicas.
**Pitfalls:** Too few virtual nodes → hot spots where one node owns a fat ring segment; hashing on a low-cardinality key so a few celebrity keys overload one node (see Hot Partitions, #67).
**Rules:** SHOULD use consistent hashing with virtual nodes for any self-managed sharded cache/store. MUST evaluate key distribution with real key samples before launch. NEVER re-shard by modulo-N hashing in a system that must scale membership dynamically.

### #86 — Bloom Filters
**What:** A compact probabilistic set: it can say "definitely not present" or "maybe present" — false positives possible, false negatives impossible.
**Why it matters:** They save expensive lookups: databases (LSM-tree SSTables) skip disk reads for absent keys, CDNs and caches avoid origin hits for never-requested URLs, and crawlers dedupe billions of URLs in RAM-sized memory.
**Techniques & methods:**
- Size deliberately: bits-per-element and hash count set the false-positive rate (~10 bits/element + ~7 hashes ≈ 1% FP). Monitor the real FP rate.
- Use where a "maybe" is cheap to verify: check the filter first, then confirm positives against the real store.
- For mutable sets use counting Bloom filters or just rebuild periodically; standard filters can't delete.
**Pitfalls:** Treating "maybe present" as truth and skipping verification; letting the filter saturate (too many inserts → FP rate explodes → it answers "maybe" to everything and becomes useless).
**Rules:** MUST verify every positive against the source of truth. SHOULD alert on fill ratio/FP rate. NEVER use a Bloom filter for security decisions (e.g., "is this token revoked — maybe?").

### #87 — Two-Phase Commit
**What:** An atomic-commit protocol: a coordinator asks all participants to *prepare* (promise they can commit), then broadcasts *commit* once all agree — all commit or all abort.
**Why it matters:** 2PC gives real atomicity across databases/services, but it's blocking: if the coordinator dies after prepare, participants hold locks in-doubt until it returns. That fragility is why most modern systems avoid it across service boundaries.
**Techniques & methods:**
- Use 2PC/XA only inside one trust/operational boundary (e.g., within a database platform that supports it well), with timeouts and a monitored coordinator.
- Across services, prefer the alternatives: outbox pattern for atomic write+publish (#74), sagas with compensating actions for multi-step business transactions.
- If you run XA, rehearse coordinator-crash recovery — the in-doubt transactions need an operator runbook.
**Pitfalls:** Participants holding row locks for the whole prepare window, tanking throughput; assuming "the framework handles it" while heuristic (forced) decisions quietly break atomicity.
**Rules:** NEVER span 2PC across independently deployed microservices. MUST have a recovery procedure for in-doubt transactions if XA is used at all. SHOULD default to outbox + saga patterns for cross-service atomicity.

### #88 — CQRS
**What:** Command Query Responsibility Segregation: separate the write model (commands that change state, enforcing rules) from the read model (queries served by denormalized, purpose-built views).
**Why it matters:** It lets reads and writes scale and evolve independently — complex write invariants stay clean while read views are optimized per screen. But it adds a synchronization pipeline and eventual consistency between the two sides.
**Techniques & methods:**
- Apply CQRS to a *bounded context* with genuinely different read/write shapes, not to the whole system by default.
- Project events or change streams into read models asynchronously; make projections rebuildable from scratch.
- Design the UX for projection lag: confirm the command, then show the read model with a "processing" state, or read-your-writes for the actor.
**Pitfalls:** Adopting CQRS for simple CRUD, paying distributed-systems costs for a blog; read models drifting from the write model with no rebuild/repair tooling; users confused by their own changes "disappearing."
**Rules:** MUST justify CQRS per bounded context with a concrete read/write asymmetry. NEVER introduce CQRS without rebuildable projections and lag monitoring. SHOULD keep a single-model (plain CRUD) design until the pain is demonstrated, not imagined.

### #89 — Event Sourcing
**What:** Store state as an immutable, ordered log of domain events ("OrderPlaced", "PaymentRefunded"); current state is derived by replaying events, optionally from snapshots.
**Why it matters:** You get a perfect audit trail, time-travel debugging, and the ability to build new projections later — at the cost of event-schema evolution pain and a team that must think in events, forever.
**Techniques & methods:**
- Version events from day one; use upcasters to translate old event versions on replay instead of mutating stored events (the log is append-only truth).
- Snapshot aggregates periodically so replays stay fast; snapshot versioning needs the same care as event versioning.
- Pair with CQRS for read models, and with the outbox pattern so events are published atomically with their source transaction.
**Pitfalls:** Replaying millions of events on startup with no snapshots; changing an event's meaning in place ("we now also fire it for X"), corrupting every future replay; using event sourcing where a simple audit table would do.
**Rules:** NEVER mutate or delete stored events. MUST design event versioning before the first production event is written. SHOULD adopt event sourcing only where audit/history/replay is a real business requirement.


## 7.4 Resilience & Performance Patterns

### #90 — Race Conditions
**What:** Two operations interleave unpredictably and the result depends on timing — classically check-then-act: both threads check "balance ≥ 100," both pass, both withdraw.
**Why it matters:** Races produce the bugs that pass all tests and corrupt production data once a month: double charges, oversold inventory, lost updates.
**Techniques & methods:**
- Push invariants into the database: unique constraints, foreign keys, and atomic conditional updates (`UPDATE … SET stock = stock - 1 WHERE stock > 0`) beat application-level checks.
- Use atomic operations and compare-and-swap (version columns, ETags) instead of read-modify-write in app code.
- Serialize only the true critical section — via a row lock, advisory lock, or a single-writer queue — not the whole request.
**Pitfalls:** "It works in dev" (single-threaded, no load); locking in app code across multiple processes where the lock doesn't exist; fixing one race by adding a second, subtler one.
**Rules:** MUST enforce money/inventory invariants with DB constraints or atomic updates. NEVER implement check-then-act on shared state without atomicity. SHOULD write a concurrent test (parallel duplicate requests) for every mutating endpoint.

### #91 — Backpressure
**What:** When a consumer can't keep up, it signals the producer to slow down, instead of buffering unboundedly until memory dies.
**Why it matters:** Systems without backpressure don't degrade — they accumulate an invisible queue, latency explodes, memory fills, and the process OOMs hours after the real problem started.
**Techniques & methods:**
- Bound every queue (in memory, in Kafka consumer lag, in thread pools) and decide the overflow behavior in advance: block, drop, or shed (see #92).
- Propagate pressure upstream: return 429/503 fast, use reactive-stream demand signaling, or TCP flow control — don't silently accept work you can't do.
- Scale the bottleneck consumer horizontally; backpressure buys time, it doesn't create capacity.
**Pitfalls:** Unbounded in-memory queues "for reliability" that convert a slowdown into an OOM; retries that ignore backpressure signals and amplify the overload (see Retry Storms, #95).
**Rules:** MUST set a finite bound on every queue and buffer you create. MUST choose and document overflow behavior (block/drop/shed). NEVER swallow a 429 and immediately retry.

### #92 — Load Shedding
**What:** Deliberately rejecting excess work early — before it consumes resources — so the system serves most requests well instead of all requests terribly.
**Why it matters:** A server at 130% load without shedding serves *nobody*: queues grow, timeouts cascade, goodput collapses to near zero. Shedding the extra 30% keeps the other 70% fast.
**Techniques & methods:**
- Shed at the edge/load balancer or at handler entry, using cheap signals: current concurrency, queue depth, latency percentiles.
- Prioritize: shed background/anonymous/low-value traffic first; protect checkouts, logins, and existing customers.
- Reject fast with 503 + `Retry-After`, and make clients honor it — a slow rejection is not shedding, it's just latency.
**Pitfalls:** Shedding randomly so premium and junk traffic die equally; shedding after doing the expensive work (auth + DB query, then reject); clients retrying shed requests instantly, doubling the flood.
**Rules:** MUST shed before expensive work begins. SHOULD implement priority tiers before you need them. NEVER shed silently without metrics — you must be able to count what you dropped and why.

### #93 — Bulkheads
**What:** Partition resources (thread pools, connections, queues) per dependency or tenant, like a ship's watertight compartments, so one failure floods only its own compartment.
**Why it matters:** Without bulkheads, one slow downstream (a hung analytics API) consumes every thread in your service and takes down unrelated features — search, login, checkout — with it.
**Techniques & methods:**
- Give each external dependency its own bounded thread pool/connection pool and its own timeouts; size pools from the dependency's real capacity.
- Combine with circuit breakers: the bulkhead limits the blast radius, the breaker stops you sailing into the flooded compartment at all.
- Apply per-tenant bulkheads in multi-tenant SaaS so one noisy customer can't starve the rest.
**Pitfalls:** So many micro-pools that total capacity is fragmented and idle; a "bulkhead" that still shares one database connection pool — the shared resource is where the flood actually travels.
**Rules:** MUST isolate at least your top external dependencies into separate pools. SHOULD size pools deliberately, not by library defaults. NEVER let an optional feature (recommendations, analytics) share execution resources with the critical path.

### #94 — Jitter
**What:** Adding controlled randomness to delays and schedules — retry backoff, cache TTLs, cron times — so clients don't act in lockstep.
**Why it matters:** Without jitter, every client that failed together retries together, forever: a self-sustaining metronome of load spikes aimed at a recovering service.
**Techniques & methods:**
- Use "full jitter" (AWS Architecture Blog): sleep = random(0, min(cap, base × 2^attempt)) — it spreads retries and measurably reduces total attempts under contention.
- Jitter TTLs (±10–20%) so cached keys don't all expire in the same second (see Thundering Herd, #97).
- Desynchronize scheduled jobs: splay cron start times across instances instead of everyone firing at :00.
**Pitfalls:** Jitter with too small a range (still synchronized); jittering so aggressively that worst-case retry waits blow past user patience and SLOs.
**Rules:** MUST apply jitter to every retry backoff and every shared TTL. SHOULD splay recurring jobs. NEVER implement fixed-interval retries in client or server code.

### #95 — Retry Storms
**What:** When a dependency falters, every layer and client retries, multiplying the failing load 3–10× and preventing the dependency from ever recovering.
**Why it matters:** Retry storms turn a 2-minute blip into a 2-hour outage. The system isn't down because of the original fault; it's down because of its own retries — death by good intentions.
**Techniques & methods:**
- Budget retries: cap attempts (usually ≤3), exponential backoff with jitter (#94), and a per-client retry budget (e.g., retries ≤10% of requests per minute) that stops retrying when exhausted.
- Retry at one layer only — if the gateway retries, the service and client must not. Each layer's retries multiply the others'.
- Pair with circuit breakers so a known-dead dependency fails fast instead of absorbing retried load.
**Pitfalls:** Retrying non-idempotent POSTs (double orders); retrying on 4xx errors that will never succeed; infinite `while(!success)` loops in background workers.
**Rules:** MUST cap attempts and add backoff + jitter to all retries. NEVER retry at multiple layers of the same call path. MUST NOT retry requests that aren't idempotent unless an idempotency key is attached.

### #96 — Cascading Failures
**What:** One component's failure propagates: callers block on it, exhaust their own threads/queues, fail in turn, and overload their callers — until the whole system is down from one sick dependency.
**Why it matters:** This is how a single bad deploy or one slow table brings down an entire platform. Most "total outages" are cascades, not single failures.
**Techniques & methods:**
- Timeouts everywhere, tuned per dependency — a missing timeout is an infinite wait that guarantees thread exhaustion. Propagate deadlines so downstream calls die with the request.
- Bulkheads (#93) to contain resource exhaustion, circuit breakers to stop calling the dead, load shedding (#92) at entry to protect remaining capacity.
- Prefer asynchronous decoupling for non-critical paths: if it can be a queue message, it can't block a thread.
**Pitfalls:** Timeout at the client longer than the caller's own timeout (work continues after everyone's given up — wasted load); thread-per-request architectures with no isolation anywhere.
**Rules:** MUST set explicit timeouts on every network call — no library-default infinities. MUST propagate request deadlines end-to-end. SHOULD test failure of your top dependency in staging before production tests it for you.

### #97 — Thundering Herd
**What:** A hot cache key expires (or a service restarts) and thousands of requests simultaneously miss, stampeding the database/origin to regenerate the same value.
**Why it matters:** The herd can exceed the origin's capacity by orders of magnitude for a few seconds — long enough to take the database down, which expires more keys, which herds harder.
**Techniques & methods:**
- Request coalescing/single-flight: only one request regenerates the value; the rest wait for or reuse its result (in-process locks, `singleflight`, CDN request collapsing).
- Serve stale while revalidating: return the expired value and refresh in the background (stale-while-revalidate), so users never wait on regeneration.
- Jitter TTLs (#94) and pre-warm hot keys before expiry (#101) so expirations never synchronize.
**Pitfalls:** Fixing it with a global lock that serializes the whole cache; lock holder dying mid-regeneration and stranding everyone; assuming only cache expiry herds — deploys and failovers herd too.
**Rules:** MUST use single-flight or stale-serving for any high-traffic cached key. SHOULD jitter TTLs on shared hot keys. NEVER let N concurrent misses each trigger the expensive regeneration.

### #98 — Cache Invalidation
**What:** Deciding when cached data is stale and must be refreshed — famously one of the two hard things in computer science.
**Why it matters:** Invalidate too late and users act on dead data (prices, permissions); too eagerly and the cache stops helping, hammering your database. Both failure modes are production incidents.
**Techniques & methods:**
- Pick a strategy per data type: TTL for tolerant data, explicit/event-driven invalidation (write → delete key) for correctness-sensitive data, versioned keys (`user:42:v7`) so "invalidation" is just a new key.
- Prefer *delete-on-write* over *update-on-write*: deleting is idempotent and avoids racing writers overwriting each other with stale values.
- Accept a documented staleness window where the business allows it, and write that window down — "profiles may be 60s stale" is a design decision, not a bug.
**Pitfalls:** Updating the cache before the DB transaction commits (cache now holds data that gets rolled back); invalidating by pattern-scanning keys in production (slow, racy); forgetting the *other* caches — CDN, app, client — each with its own invalidation story.
**Rules:** MUST define the invalidation strategy and acceptable staleness per cached entity. NEVER update cache inside an uncommitted transaction. SHOULD default to delete-on-write over update-on-write.

### #99 — Cache Hit Ratio
**What:** Hits ÷ (hits + misses) — the fraction of requests your cache actually absorbs.
**Why it matters:** A cache with a 40% hit ratio still costs memory, invalidation complexity, and a failure mode — while barely protecting the database. Below a workload-dependent threshold, the cache is a liability, not an optimization.
**Techniques & methods:**
- Measure per key-pattern, not globally: the global ratio hides which entities are worth caching (one hot pattern at 99%, everything else at 5%).
- Track the miss cost too: a 95% hit ratio where the 5% misses are your slowest queries can still kill the database during a herd.
- Use hit ratio + origin load together to size the cache and set TTLs; evictions of still-hot keys show up as a sagging ratio at steady state (see #103).
**Pitfalls:** Celebrating a high ratio on a workload that didn't need caching (tiny, already-fast queries); caching everything and diluting memory so hot keys get evicted by one-off junk (cache pollution).
**Rules:** MUST instrument hit ratio per cache/pattern before claiming a cache "works." SHOULD set a minimum-viable ratio and remove caches that miss it. NEVER add a cache layer without a metric to prove it earns its complexity.

### #100 — TTLs
**What:** Time-to-live: every cached item (and DNS record, token, presigned URL) carries an expiry after which it must be refreshed.
**Why it matters:** TTL is your staleness budget in disguise. Too long: users see revoked permissions and dead prices. Too short: the cache barely absorbs load and the origin melts at peak.
**Techniques & methods:**
- Set TTL from the *business tolerance* for staleness, not from a round number habit: session permissions minutes, product descriptions hours, exchange rates seconds.
- Jitter TTLs (±10–20%) on shared keys to prevent synchronized expiry (#97).
- Layer TTLs: browser < CDN < app cache, so the freshest copy is closest to the source of truth when it matters.
**Pitfalls:** One global TTL (e.g., "everything: 1 hour") applied to data with wildly different staleness tolerances; TTLs so long they outlive the data's own lifecycle (deleted users still "existing" in cache).
**Rules:** MUST set TTL per data type from an explicit staleness tolerance. SHOULD jitter shared hot-key TTLs. NEVER cache authorization decisions with a TTL longer than your acceptable revocation delay.

### #101 — Cache Warming
**What:** Pre-populating a cache with expected-hot data before traffic arrives — after a deploy, a restart, a failover, or before a known traffic spike.
**Why it matters:** A cold cache is a temporary thundering herd: after every restart, 100% of requests miss and hit the origin at once. Deploys become self-inflicted incidents without warming.
**Techniques & methods:**
- Warm from the access logs of the previous instance: replay the top-N keys, or lazily warm by copying the old cache's hot set.
- Use stale-while-revalidate and gradual traffic ramp-up (canary the new instance at 1% → 25% → 100%) so misses stay survivable while the cache fills.
- For predictable spikes (launches, sales), pre-generate and pin the known-hot content (landing pages, top products) ahead of time.
**Pitfalls:** Warming by running the full traffic replay against origin (warming *is* the load spike); warming everything instead of the hot head, wasting the window on cold keys.
**Rules:** SHOULD warm or traffic-ramp any cache-backed service after restart/deploy. MUST NOT switch 100% of traffic to a cold instance instantly. NEVER treat "cache is cold" as an acceptable explanation for a post-deploy outage — it's a design flaw.

### #102 — Write-Through vs Write-Back
**What:** Write-through: every write updates cache and database synchronously before acknowledging. Write-back (write-behind): acknowledge after writing the cache; the database is updated asynchronously later. (Write-around: writes skip the cache entirely.)
**Why it matters:** Write-through keeps cache and DB in step but adds DB latency to every write. Write-back is fast and absorbs write bursts — but a cache crash before flush loses acknowledged data. Choosing casually loses either performance or data.
**Techniques & methods:**
- Default to write-through (or cache-aside with delete-on-write) for anything you'd be sad to lose; reserve write-back for loss-tolerant, high-volume data (metrics, view counts, ephemeral state).
- If write-back: persist a write-ahead log or queue of pending flushes, replicate the cache, and alert on flush lag — the lag *is* your data-loss window.
- Use write-around for write-once/read-rarely data so it doesn't evict hot entries.
**Pitfalls:** Write-back on a single non-replicated Redis holding orders; assuming "the cache library handles durability" without reading what it actually guarantees.
**Rules:** MUST use write-through or DB-first patterns for financial and user-critical data. NEVER run write-back on an unreplicated cache for data you cannot reconstruct. SHOULD monitor flush lag wherever write-back exists.

### #103 — Redis Eviction Policies
**What:** When Redis hits `maxmemory`, the `maxmemory-policy` decides what goes: `noeviction` (error on writes), the `allkeys-*` family (any key), or the `volatile-*` family (only keys with a TTL) — each ranked by LRU, LFU, random, or shortest-TTL.
**Why it matters:** The wrong policy silently deletes your sessions/queues (`allkeys-lru` on a mixed instance) or hard-errors writes under memory pressure (`noeviction` on a pure cache). This is a 3 a.m. outage chosen by a config default.
**Techniques & methods:**
- Pure cache → `allkeys-lfu` (protects consistently-hot keys from one-hit wonders; `allkeys-lru` is the classic default). Mixed cache + precious data → `volatile-lfu`/`volatile-lru` so only TTL'd keys are evictable. Source-of-truth data → `noeviction` + memory alerts.
- Remember `volatile-*` behaves exactly like `noeviction` when *no* keys have TTLs — a classic surprise.
- Set `maxmemory` below host RAM to leave room for replication buffers, fork/CoW during persistence, and fragmentation.
**Pitfalls:** Running default `noeviction` for a cache (writes start failing when full); storing queues/jobs in a cache-policy instance and watching them evaporate.
**Rules:** MUST choose the eviction policy explicitly per instance based on what the data *is*. NEVER mix source-of-truth data with evictable cache in one instance without a `volatile-*` policy. MUST alert on memory usage and evicted-keys rate.

### #104 — CDNs
**What:** A content delivery network caches your assets and responses on edge servers near users worldwide, serving them without touching your origin.
**Why it matters:** A CDN is usually the cheapest performance and resilience upgrade that exists: it cuts latency (physics — distance), absorbs traffic spikes and many DDoS attacks, and keeps static content up even when your origin is down.
**Techniques & methods:**
- Cache aggressively with fingerprinted assets (`app.a3f9c.js` + `immutable, max-age=1y`) — the URL changes when content does, so TTL can be huge safely.
- Use the CDN features that save origins: request collapsing (one origin fetch per miss), origin shield (one regional cache in front of origin), stale-if-error serving during origin outages.
- Keep cache keys minimal: exclude irrelevant cookies/query params from the key or every user becomes their own cache entry.
**Pitfalls:** Caching personalized/authenticated HTML at the edge (leaking one user's page to another — a breach, not a bug); purging by URL whack-a-mole instead of versioned URLs; a `Vary` header explosion fragmenting the cache.
**Rules:** MUST fingerprint static assets and cache them immutably. NEVER cache authenticated/personalized responses on shared edge caches without explicit, reviewed cache-key design. SHOULD enable stale-if-error for critical pages.

### #105 — Cache-Control Headers
**What:** The HTTP headers that tell browsers, CDNs, and proxies how to cache a response: `max-age`, `s-maxage`, `public`/`private`, `no-cache`, `no-store`, `immutable`, `stale-while-revalidate`.
**Why it matters:** One wrong header on the wrong response either leaks private data through shared caches or makes every asset uncacheable and your CDN useless. These headers *are* your caching policy — everything else is commentary.
**Techniques & methods:**
- Know the traps: `no-cache` means "store but revalidate before use," `no-store` means "never store" — they are not synonyms.
- Set `private` (or `no-store`) on anything user-specific; `public` + long `s-maxage` on fingerprinted static assets; add `immutable` for fingerprinted files so browsers don't even revalidate.
- Use `stale-while-revalidate` to let clients/CDNs serve slightly-old content while refreshing in the background (see #97).
**Pitfalls:** Framework defaults shipping `no-store` on everything (CDN hit ratio ≈ 0); `public` on responses containing session data because a middleware set it globally.
**Rules:** MUST set Cache-Control deliberately per route class (static, public API, private API). NEVER send `public` on authenticated responses. SHOULD verify production headers with curl after every deploy pipeline change.

### #106 — ETags
**What:** A validator token (hash/version) for a resource version; the client sends `If-None-Match`, and the server replies `304 Not Modified` (no body) if the ETag still matches.
**Why it matters:** ETags save bandwidth and origin work on revalidation, and — via `If-Match` — they double as an optimistic-concurrency mechanism that prevents lost updates in APIs.
**Techniques & methods:**
- Generate strong ETags from content hash for byte-exact resources; weak ETags (`W/"…"`) when semantically-equal-but-not-identical responses are fine (e.g., after compression).
- Combine with `Cache-Control`: max-age controls *freshness* (no request at all), ETag controls *revalidation cost* (a cheap request) — use both.
- For writes, accept `If-Match: <etag>` and return `412 Precondition Failed` when the resource changed since the client read it — race protection without locks (see #90).
**Pitfalls:** Frameworks generating ETags from file mtime+size that differ across servers behind a load balancer (every node revalidates differently); ETags computed on expensive serialization, costing more than they save.
**Rules:** SHOULD enable ETags on cacheable GET APIs. MUST generate them identically across all instances (content-based, not machine-based). NEVER treat ETag presence as a substitute for setting freshness headers.


## 7.5 Messaging & Async

### #107 — Dead Letter Queues
**What:** A holding queue where messages that fail processing repeatedly are parked for inspection, instead of being retried forever or silently dropped.
**Why it matters:** Without a DLQ, one bad message either blocks the queue behind it or vanishes — taking an order, a payment event, or a signup with it. The DLQ is where failures become visible and recoverable.
**Techniques & methods:**
- Route to the DLQ after a bounded number of attempts (e.g., 3–5 with backoff), and include the failure metadata: error, attempt count, original queue, timestamps.
- Alert on DLQ *arrival*, not just depth — the first poisoned message is the signal; a growing DLQ is an incident.
- Build the replay path before you need it: inspect → fix root cause → redrive, with a tool/button, not hand-crafted CLI surgery at 3 a.m.
**Pitfalls:** DLQ with no alerting (a silent graveyard of lost orders); redriving the whole DLQ into a still-broken consumer, which re-poisons instantly; DLQ messages expiring by retention policy before anyone looks.
**Rules:** MUST configure a DLQ for every production queue/subscription. MUST alert on any DLQ arrival. NEVER auto-redrive without verifying the root cause is fixed.

### #108 — Poison Messages
**What:** A message that deterministically crashes or fails its consumer every time — malformed payload, a schema the code can't handle, a record that triggers a bug.
**Why it matters:** With naive retry, a poison message loops forever, burning compute, spamming logs, and (in ordered queues) blocking every message behind it. It's a denial-of-service you sent yourself.
**Techniques & methods:**
- Detect by delivery/attempt count, not by content inspection: after N failures, quarantine to the DLQ (#107) automatically.
- Validate schema at the consumer boundary and fail fast into quarantine — a message that can *never* succeed shouldn't get N expensive retries.
- Fix forward: deploy the consumer fix (or a corrected message), then redrive the quarantined message to prove it.
**Pitfalls:** Infinite redelivery with no cap (SQS without `maxReceiveCount`, Kafka consumer crash-looping on the same offset and never committing past it); treating poison as transient and backing off for hours while the queue stalls.
**Rules:** MUST cap delivery attempts on every consumer. MUST ensure one bad message cannot block progress on subsequent messages (skip-and-quarantine or partition isolation). NEVER let a consumer crash-loop on an offset without an escape path.

### #109 — At-Least-Once Delivery
**What:** The broker guarantees delivery by retrying until acknowledged — so every message arrives one *or more* times; duplicates are a normal, expected event.
**Why it matters:** This is the default semantics of SQS, Kafka (commit-after-process), and most queues. If your consumer isn't idempotent, at-least-once quietly becomes double-charges, double-emails, and double-shipped orders.
**Techniques & methods:**
- Commit/ack *after* successful processing, never before (acking first degrades you to at-most-once: crash = lost message).
- Make consumers idempotent: dedupe on a message/event ID stored with the effect (unique constraint on `processed_events`), or write operations that are naturally repeatable (upserts, set-state rather than increment).
- Design for duplicates in testing: deliver every test message twice and assert the outcome is identical.
**Pitfalls:** "Exactly-once" assumptions layered on an at-least-once pipe; dedupe state kept in memory (lost on restart — exactly when redelivery happens); increment-style updates (`balance += x`) with no idempotency key.
**Rules:** MUST treat every queue consumer as if it will see each message at least twice. MUST dedupe with durable storage keyed by event ID. NEVER ack before the work is durably done.

### #110 — Exactly-Once Semantics
**What:** The guarantee that each message's *effect* happens exactly once — in practice, achieved as at-least-once delivery plus idempotent processing/deduplication, not by magic transport.
**Why it matters:** Teams waste months chasing transport-level exactly-once across system boundaries where it doesn't exist — the effect crosses into databases, emails, and payment APIs that know nothing of your broker's transactions.
**Techniques & methods:**
- Know the real scope of vendor claims: Kafka's exactly-once semantics cover Kafka-to-Kafka (idempotent producer + transactions spanning consume-transform-produce). The moment your consumer writes to Postgres or calls Stripe, *you* own the guarantee via idempotency keys.
- Implement the pattern: unique event ID → dedupe table/constraint → effect, in one transaction (with the outbox, #74, on the producing side).
- For external APIs, use *their* idempotency keys (e.g., Stripe's `Idempotency-Key`) so retries are safe end-to-end.
**Pitfalls:** Believing a broker checkbox makes a whole pipeline exactly-once; dedupe windows that expire before late retries arrive; "exactly-once" email — impossible, email has no transactions with your queue.
**Rules:** MUST implement exactly-once as idempotency + dedupe at the effect site. NEVER claim or rely on end-to-end exactly-once across external systems. SHOULD prefer boring at-least-once + idempotent design over exotic transactional pipelines.

### #111 — Message Ordering
**What:** Guarantees about the sequence in which a consumer sees related messages — in practice, ordering is per-partition/per-key only; global ordering across a system effectively doesn't scale.
**Why it matters:** Processing `OrderCancelled` before `OrderCreated`, or `PaymentRefunded` before `PaymentCaptured`, produces nonsense state — unless your consumer is built to survive reordering, because networks and partitions *will* reorder.
**Techniques & methods:**
- Order only what must be ordered: partition by entity key so one entity's events stay in sequence (see #113); unrelated entities flow in parallel.
- Make consumers order-tolerant: carry version numbers/sequence IDs on events, buffer or no-op on out-of-order arrivals, and design handlers to converge (apply "cancelled" as a terminal state regardless of arrival order).
- Where strict sequence is unavoidable, use a single partition/single consumer for that stream and accept the throughput ceiling.
**Pitfalls:** Assuming a queue labeled "FIFO" orders across producers with clock skew and retries; building consumers that crash on out-of-order events instead of tolerating them (instant poison message, #108).
**Rules:** MUST define ordering scope (global / per-key / none) in the design of every stream. SHOULD make consumers converge safely under reordering. NEVER depend on wall-clock timestamps to reconstruct order across producers (see Clock Skew, #83).

### #112 — Kafka Consumer Groups
**What:** A set of consumers sharing a `group.id` that split a topic's partitions among themselves: each partition is read by exactly one consumer in the group, and the group tracks its own committed offsets.
**Why it matters:** Consumer groups are how Kafka scales processing and provides pub/sub at once — different groups each get the full stream independently. Misunderstood, they cause idle consumers, rebalance stalls, and silently stalled pipelines.
**Techniques & methods:**
- Respect the ceiling: active consumers per group ≤ partition count; extra consumers sit idle. Choose partition count for future parallelism *at topic creation* — raising it later reshuffles key-to-partition mapping and breaks per-key ordering.
- Commit offsets after processing (at-least-once, #109); keep processing per message fast enough that poll intervals don't trigger unwanted rebalances.
- Prefer incremental cooperative rebalancing (default since Kafka 2.4) so members keep processing unaffected partitions during membership changes instead of a full stop-the-world rebalance.
**Pitfalls:** Long processing inside `poll` loops tripping `max.poll.interval.ms` → consumer ejected → rebalance → duplicate processing; creating a new group id for a redeploy and reprocessing (or skipping) the entire topic unintentionally.
**Rules:** MUST size partitions ≥ your maximum planned consumer parallelism. MUST handle rebalances and duplicates as normal events, not errors. NEVER run more consumers than partitions expecting more throughput.

### #113 — Partition Keys
**What:** The message key Kafka hashes to choose a partition — deciding both which partition a message lands in and therefore what ordering and parallelism it gets.
**Why it matters:** The key is an architecture decision disguised as a field. Key by entity (order ID, user ID) and that entity's events stay ordered and co-located; key badly and you get broken ordering or one melting hot partition.
**Techniques & methods:**
- Key by the entity whose ordering matters (per #111): `order_id` for order events, `account_id` for ledger events. Same key → same partition → preserved order.
- Check cardinality and distribution: the key space must be large and roughly uniform; a key like `country` or a single celebrity tenant concentrates load (see Hot Partitions, #67).
- For genuinely order-free, high-volume streams, use null keys with sticky/round-robin partitioning for even spread.
**Pitfalls:** Keying by a low-cardinality field and creating a celebrity partition that lags while others idle; changing the key scheme later and splitting one entity's events across two schemes during migration; hashing a mutable field so the same entity changes partition mid-life.
**Rules:** MUST choose the partition key from the ordering requirement, then verify distribution with real data. NEVER use timestamps or random UUIDs as keys when per-entity ordering matters. SHOULD monitor per-partition lag skew as a first-class metric.

### #114 — Background Jobs
**What:** Work executed outside the request/response cycle — emails, reports, image processing, syncs — via job queues (Sidekiq, Celery, BullMQ, SQS-backed workers) with retries and scheduling.
**Why it matters:** Anything slow or failure-prone inside a web request hurts users and times out; anything "fire-and-forget" without a queue evaporates on deploy. Background jobs are where reliability patterns (retries, DLQs, idempotency) meet real product work.
**Techniques & methods:**
- Make every job idempotent and safe to run twice (see #109) — workers die mid-job, queues redeliver, deploys restart fleets.
- Pass IDs, not objects: enqueue `order_id: 42` and re-fetch state at execution time; serialized payloads go stale in the queue.
- Bound retries with backoff + jitter and a DLQ (#107); separate queues by priority/latency class so a report backlog never delays password-reset emails. Set per-job timeouts.
**Pitfalls:** Jobs that enqueue more jobs on retry (exponential self-spawn); cron-scheduled jobs drifting or double-firing across instances without a leader lock (see #84); giant "do everything" jobs that can't resume — split into resumable steps.
**Rules:** MUST make jobs idempotent, time-bounded, and retry-capped with a DLQ. MUST enqueue references (IDs), never serialized domain objects. SHOULD isolate queues by criticality so bulk work can't starve user-facing work.

### #115 — Webhook Retries
**What:** When your webhook endpoint doesn't return a 2xx, the sender (Stripe, GitHub, Shopify…) retries the delivery on its own backoff schedule — and expects your endpoint to handle duplicates.
**Why it matters:** Webhooks carry state you can't afford to lose (payment succeeded, subscription cancelled) *and* can't afford to process twice. Mishandled retries mean missed revenue events or double-fulfilled orders; a slow endpoint triggers retry pile-ups that look like a DDoS from your own provider.
**Techniques & methods:**
- Acknowledge fast, process async: verify the signature, persist the raw event, return 200 immediately, and do the real work in a background job (#114). Endpoint work beyond a few hundred ms invites timeouts and retries.
- Verify signatures on every delivery (see #34) and dedupe on the provider's event ID with a unique constraint — retries make duplicates guaranteed, not possible.
- Know your sender's schedule (e.g., Stripe retries for up to 3 days with exponential backoff) and provide a manual replay path in your own admin for events that still failed.
**Pitfalls:** Returning 500 for a *permanent* validation failure, causing days of pointless retries; processing inline and timing out so the provider retries a charge you've already fulfilled; assuming delivery order matches event order (see #111).
**Rules:** MUST return 2xx fast and process asynchronously. MUST verify signatures and dedupe by event ID before any side effect. NEVER let a webhook handler perform slow external calls inline.

## 7.6 Networking, HTTP & APIs

### #116 — DNS
**What:** The Domain Name System is the distributed database that translates names like `api.example.com` into IP addresses, via A/AAAA (address), CNAME (alias), MX (mail), and TXT records.
**Why it matters:** Every request your users make starts with a DNS lookup. Wrong or stale records mean total downtime for a healthy app — DNS is the most common "the site is down but the server is fine" outage.
**Techniques & methods:** Delegate DNS to a managed provider (Route 53, Cloudflare) with anycast resolution. Use CNAMEs for subdomains pointing at load balancers/CDNs, never hardcode IPs. Automate record changes in code (Terraform) so they're reviewed and reproducible.
**Pitfalls:** Pointing a record at a decommissioned server; CNAME at a zone apex (illegal — use ALIAS/ANAME); forgetting the `www` record; assuming a change is live because *your* resolver updated.
**Rules:** MUST manage DNS records as code. NEVER hardcode IP addresses in client apps. SHOULD use a provider with anycast and DNSSEC support.

### #117 — DNS Propagation
**What:** The delay while resolvers worldwide expire cached DNS records according to each record's TTL, so an old answer keeps being served after you change it.
**Why it matters:** During a migration or failover, some users hit the new server and some hit the old one for minutes to hours. Teams that don't plan for this cut over, watch errors, and roll back a change that was actually working.
**Techniques & methods:** Lower the TTL (e.g. to 60–300s) at least one full old-TTL period *before* the change, then raise it after. Keep the old endpoint alive and proxying during the transition. Verify with multiple public resolvers (`dig @8.8.8.8`, `@1.1.1.1`) instead of trusting your laptop's cache.
**Pitfalls:** Changing records with a 24h TTL and expecting instant failover; decommissioning the old IP immediately; debugging "the change didn't work" when it's just cache.
**Rules:** MUST plan TTL reduction ahead of any migration. NEVER decommission the old endpoint until the old TTL has fully expired. SHOULD verify propagation from several resolvers/regions.

### #118 — HTTP Status Codes
**What:** Three-digit response codes grouped by class: 1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error (RFC 9110).
**Why it matters:** Clients, load balancers, monitoring, and retry logic all branch on the class alone. Returning `200` for an error suppresses retries and alerts; returning `500` for bad input pages the on-call team for a client's typo.
**Techniques & methods:** Use precise codes: `201` + `Location` on creation, `204` for success with no body, `301/308` permanent vs `302/307` temporary redirects, `400` validation, `401` unauthenticated vs `403` unauthorized, `404` missing resource, `409` state conflict, `422` semantic validation errors, `429` rate limited (with `Retry-After`), `503` + `Retry-After` for overload/maintenance. Pair errors with a machine-readable problem body (RFC 9457 `application/problem+json`).
**Pitfalls:** `200` for everything; `404` for an empty collection (it's `200` with `[]`); `500` for client errors; inventing non-standard codes generic clients can't degrade on.
**Rules:** MUST return codes that match what actually happened. NEVER wrap errors in `200`. MUST include a stable error body format for 4xx/5xx.

### #119 — HTTP Method Semantics
**What:** Each method carries a contract: *safe* methods (GET, HEAD, OPTIONS) don't modify state; *idempotent* methods (GET, PUT, DELETE) can be repeated with the same end state; POST is neither.
**Why it matters:** Browsers, crawlers, caches, and retry logic all rely on these contracts. A GET that mutates state will eventually be triggered by a prefetcher, a crawler, or an automatic retry — and delete or duplicate real data.
**Techniques & methods:** GET only for reads (and make it cacheable); PUT for full replacement with a client-known ID (safe to retry); PATCH for partial updates; POST for creation/actions, protected by idempotency keys where retries matter; DELETE idempotent — deleting an already-deleted resource returns success or `404`, never a new side effect.
**Pitfalls:** State-changing GET endpoints (`/delete?id=3`); using POST for everything and losing retry safety; non-idempotent PUT that increments counters.
**Rules:** NEVER mutate state in a GET. MUST make PUT and DELETE idempotent. SHOULD add idempotency keys to retryable POSTs (payments, order creation).

### #120 — Keep-Alive
**What:** HTTP persistent connections: reusing one TCP (and TLS) connection for many requests instead of paying a new handshake per request.
**Why it matters:** A fresh connection costs a TCP handshake plus TLS negotiation — often 100ms+ and extra CPU on both ends. Without keep-alive, high-traffic services melt under connection churn and ephemeral-port exhaustion.
**Techniques & methods:** It's on by default in HTTP/1.1 — the job is not breaking it: don't send `Connection: close`, set sane server keep-alive timeouts, and configure client connection pools (max connections per host, idle timeout) in your HTTP client. Behind load balancers, align idle timeouts so the LB doesn't close a connection the backend thinks is open.
**Pitfalls:** Mismatched idle timeouts between LB and backend causing sporadic `502`s and connection resets; unbounded client pools exhausting file descriptors; assuming the default pool size (often tiny) is enough.
**Rules:** MUST use pooled, keep-alive HTTP clients for service-to-service calls. NEVER create a new HTTP client per request. SHOULD align keep-alive timeouts across proxy layers.

### #121 — HTTP/2
**What:** The binary successor to HTTP/1.1: multiplexed streams over one connection, header compression (HPACK), and stream prioritization — negotiated via ALPN over TLS.
**Why it matters:** HTTP/1.1's one-request-at-a-time per connection forced hacks like domain sharding and sprite sheets, and capped browser parallelism. HTTP/2 removes most of that latency for real pages and APIs.
**Techniques & methods:** Terminate HTTP/2 at your CDN/load balancer (nearly all support it); it's the default for gRPC and most modern browsers. Drop HTTP/1.1-era optimizations (sharding, concatenation) that now hurt. Know the limit: one lost TCP packet still stalls all streams (TCP head-of-line blocking) — that's what HTTP/3/QUIC fixes.
**Pitfalls:** Assuming HTTP/2 works over plaintext in browsers (they require TLS); keeping domain sharding, which multiplies connections and defeats multiplexing; debugging with HTTP/1.1 tools and misreading behavior.
**Rules:** MUST serve browsers over HTTPS with HTTP/2 enabled at the edge. NEVER use domain sharding on an HTTP/2 site. SHOULD measure before adding HTTP/3 — adopt it for lossy/mobile-heavy traffic.

### #122 — WebSockets
**What:** A full-duplex, persistent connection upgraded from an HTTP handshake, letting both client and server push messages at any time over one socket.
**Why it matters:** Chat, live dashboards, collaboration, and trading feeds need server push with millisecond latency. Polling-based fakes waste bandwidth and still feel laggy — but a WebSocket is a long-lived stateful connection your whole stack must be built to handle.
**Techniques & methods:** Use for genuinely bidirectional, high-frequency traffic. Implement heartbeats (ping/pong) to detect dead connections, automatic reconnect with backoff and jitter, and a resume/replay mechanism for messages missed during a drop. Scale horizontally with a pub/sub backplane (Redis, NATS, Kafka) since a client's socket lives on exactly one server.
**Pitfalls:** No heartbeat → zombie connections that look alive; assuming messages arrive in order or at all across reconnects; sticky-session hacks instead of a backplane; leaking sockets because close handling was never written.
**Rules:** MUST implement heartbeat + reconnect-with-backoff in every WebSocket client. NEVER assume a socket is alive without a recent pong. SHOULD put a pub/sub backplane behind multi-instance deployments.

### #123 — Server-Sent Events
**What:** A one-way streaming protocol: the server pushes text events to the client over a plain, long-lived HTTP response (`Content-Type: text/event-stream`).
**Why it matters:** Most "real-time" features — notifications, progress updates, AI token streaming, live feeds — are server→client only. SSE gives you push without WebSocket complexity, works through standard HTTP infrastructure, and auto-reconnects natively in browsers via `EventSource`.
**Techniques & methods:** Format events as `data:` lines (with optional `event:` and `id:` fields). Send a comment heartbeat (`: keep-alive`) every ~15–30s so proxies don't kill idle streams. Use the `id:` field + `Last-Event-ID` header so reconnecting clients can resume without gaps. Disable proxy buffering (`X-Accel-Buffering: no` on nginx) or events arrive in clumps.
**Pitfalls:** Using WebSockets when SSE would do (and inheriting all the scaling pain); proxies buffering the stream; no heartbeat → silent disconnects; forgetting each open stream holds a server connection/thread.
**Rules:** SHOULD default to SSE for server→client-only streaming. MUST send heartbeats and support `Last-Event-ID` resume. NEVER leave proxy buffering enabled on a streaming endpoint.

### #124 — Long Polling
**What:** The client sends a request; the server holds it open until an event occurs or a timeout hits, responds, and the client immediately re-requests.
**Why it matters:** It's the fallback that works everywhere — restrictive proxies, old clients, environments where WebSockets and SSE are blocked. Several major platforms still use it, but done naively it pins a thread/connection per waiting client and crushes servers at scale.
**Techniques & methods:** Hold requests with async/non-blocking handlers, never a thread per waiter. Set a timeout (e.g. 30–60s) shorter than proxy/LB idle timeouts, and have clients retry immediately with jitter. Batch events that arrive together into one response. Prefer it only as a compatibility fallback behind SSE/WebSockets.
**Pitfalls:** Thread-per-request exhaustion; synchronized re-request storms after a deploy or outage (thundering herd); timeout longer than the load balancer's, causing spurious errors.
**Rules:** MUST use async I/O for held requests. MUST keep hold time below every proxy timeout in the path. SHOULD treat long polling as a fallback, not the primary transport.

### #125 — gRPC
**What:** A high-performance RPC framework (Google, CNCF) that runs over HTTP/2, using Protocol Buffers contracts and supporting unary plus client-, server-, and bidirectional-streaming calls.
**Why it matters:** For service-to-service traffic it beats JSON/REST on latency, payload size, and contract safety — streaming and strongly-typed, code-generated clients eliminate whole classes of integration bugs. For browser-facing public APIs it's usually the wrong tool.
**Techniques & methods:** Define services in `.proto`, generate stubs, version additively (see #126). Use deadlines on every call (gRPC's built-in timeout propagation), streaming for large or live data, and gRPC health checking + channel keepalive for load balancing. Browsers need gRPC-Web plus a proxy (Envoy) — plan for that or expose REST at the edge.
**Pitfalls:** No deadlines → cascading hangs; treating it as a drop-in REST replacement for public APIs; load balancing naively (gRPC's long-lived HTTP/2 connections defeat L4 balancers — use client-side or L7 balancing); unreadable payloads making debugging painful.
**Rules:** MUST set a deadline on every gRPC call. SHOULD use gRPC internally, REST/OpenAPI at the public edge. NEVER deploy gRPC behind a plain L4 load balancer without a balancing strategy.

### #126 — Protocol Buffers
**What:** A language-neutral binary serialization format: you declare messages with numbered fields in a `.proto` schema and generate code that encodes/decodes compactly.
**Why it matters:** The field numbers *are* the contract. Follow the evolution rules and old and new services interoperate during rolling deploys; break them and you get silent data corruption across versions — the worst kind of production bug.
**Techniques & methods:** Never reuse or renumber a field number — when removing a field, mark it `reserved` (both number and name). Only add new fields with new numbers; give them safe zero-value defaults. Remember the zero value is indistinguishable from "not set" for scalars (use `optional`/wrapper types when presence matters). Keep `.proto` files in version control and lint them in CI (e.g. `buf`).
**Pitfalls:** Reusing a deleted field's number for a different meaning; changing a field's type; renaming fields and breaking JSON mappings; assuming defaults mean the sender set them.
**Rules:** MUST reserve removed field numbers/names forever. NEVER change a field number or wire type. SHOULD check schema changes for breaking changes in CI.

### #127 — API Versioning
**What:** The strategy for evolving an API without breaking existing clients: URL path (`/v1/`), header/media-type, or — best — additive evolution that avoids versions at all.
**Why it matters:** Every version you ship is a version you maintain, secure, and document. But an unversioned breaking change takes down every client you don't control, on their schedule, not yours.
**Techniques & methods:** Evolve additively by default: new optional fields, new endpoints, never change a field's meaning or type. When a break is unavoidable, use URL major versioning (`/v2/`) — visible, cacheable, easy to route. Run old and new in parallel, publish a deprecation timeline, send `Deprecation`/`Sunset` headers, and watch usage metrics before shutdown.
**Pitfalls:** Breaking changes shipped silently inside a "minor" version; header versioning nobody can find or debug; keeping v1 alive forever out of fear; versioning every internal API like a public one.
**Rules:** MUST NOT ship breaking changes to an existing version. MUST announce deprecations with headers and a date, and measure usage before removal. SHOULD prefer additive changes over new versions.

### #128 — OpenAPI Specs
**What:** The standard machine-readable description of an HTTP API (OpenAPI 3.x, YAML/JSON): paths, operations, parameters, request/response schemas, and security schemes.
**Why it matters:** A spec is a contract both sides can test against. It powers generated clients, docs, mock servers, and contract tests — without it, the API's real spec is "whatever the code happens to do today," and every consumer finds out the hard way.
**Techniques & methods:** Write spec-first (or generate from code and review the diff like code). Lint it in CI (Spectral), fail builds on breaking changes (oasdiff), generate SDKs and docs (Swagger UI/Redoc) from it, and run contract tests so the implementation can't drift from the published spec. Include error responses and examples, not just happy paths.
**Pitfalls:** A spec written once and never updated; hand-maintained docs contradicting the spec; no error schemas, so clients can't handle failures programmatically.
**Rules:** MUST keep the spec in sync with the implementation — verified by contract tests in CI. MUST document error responses. SHOULD treat spec changes as reviewed API changes.

### #129 — Backward Compatibility
**What:** The property that a new version of a service, API, or schema still works correctly with clients and data built for the old version.
**Why it matters:** In any real deployment, old and new coexist: rolling deploys, mobile apps users haven't updated, queued messages written by yesterday's code. An incompatible change doesn't fail in your test — it fails at 3 a.m. against the one client still on the old version.
**Techniques & methods:** Apply Postel-style discipline concretely: add fields, never remove or retype them; make new request fields optional; consumers must ignore unknown fields (tolerant readers). For data, expand-migrate-contract: add the new column → dual-write/backfill → switch reads → drop the old column later. Test with the previous version's client in CI.
**Pitfalls:** Renaming a JSON field ("just a cleanup"); tightening validation so previously-accepted input now errors; changing an enum by removing a value old clients still send; assuming all mobile users update.
**Rules:** MUST ignore unknown fields in consumers. NEVER remove, rename, or retype a published field. MUST use expand-and-contract for schema changes. SHOULD keep a previous-version contract test in CI.

### #130 — Request Size Limits
**What:** Caps on request body, header, and URL sizes enforced at every layer — client, CDN, load balancer, reverse proxy, framework, and app.
**Why it matters:** Unbounded bodies are a denial-of-service invitation: one huge upload ties up memory, connections, and disk. Inconsistent limits are worse in a different way — requests pass the edge and die deep in the stack with confusing errors nobody can reproduce.
**Techniques & methods:** Set explicit, layered limits aligned across the stack (know your defaults: nginx `client_max_body_size` is 1MB, many frameworks differ). Reject oversized requests early with `413 Payload Too Large`, check `Content-Length` before reading the body, and stream large uploads to object storage via presigned URLs instead of through your API servers.
**Pitfalls:** The classic mismatch — app allows 50MB, proxy kills it at 1MB; buffering entire bodies in memory; no limit on JSON payloads because "uploads are handled."
**Rules:** MUST set explicit body-size limits at every layer and keep them consistent. MUST return `413` for oversized requests. NEVER buffer unbounded request bodies in memory.

### #131 — Compression
**What:** Shrinking payloads in transit — gzip or Brotli for text/JSON, negotiated via `Accept-Encoding` and signaled with `Content-Encoding`.
**Why it matters:** JSON APIs and web assets typically shrink 60–80%, which is direct latency and egress-cost savings, especially on mobile networks. Done wrong it wastes CPU on already-compressed data or opens a security hole.
**Techniques & methods:** Enable Brotli (better ratio than gzip) with gzip fallback at the CDN/reverse proxy; compress text types (JSON, HTML, JS, CSS, SVG) above a small threshold (~1KB — below that overhead wins). Precompress static assets at build time. Never recompress images/video/zip. Be aware of BREACH: compressing responses that mix secrets with attacker-controlled input can leak the secret — avoid compression on sensitive dynamic responses or mitigate.
**Pitfalls:** Double-compressing behind chained proxies; compressing tiny responses; compressing media files for zero gain and real CPU cost; CPU-bound servers compressing at max level on every request.
**Rules:** MUST enable gzip/Brotli for text responses at the edge. NEVER compress already-compressed media. SHOULD precompress static assets. MUST consider BREACH before compressing secret-bearing responses.

### #132 — Latency vs Throughput
**What:** Latency is how long one request takes; throughput is how many requests per second the system completes. They are different goals that trade off against each other, especially under load.
**Why it matters:** Teams "optimize" by batching and queueing, throughput goes up, and p99 latency quietly becomes unusable — users experience latency, not throughput. Conversely, latency near saturation explodes: past ~70–80% utilization, queues grow nonlinearly (queueing theory), so a "fast" service falls over suddenly.
**Techniques & methods:** Measure latency as percentiles (p50/p95/p99), never averages. Keep headroom — autoscale before saturation. Batch only where latency budget allows (background jobs, analytics), never on interactive paths without a cap. Reduce latency by removing round trips and serial calls; raise throughput with concurrency, caching, and queues — and state which one you're doing.
**Pitfalls:** Reporting mean latency; adding a queue to "scale" an interactive endpoint; load-testing for max RPS while ignoring p99; assuming low-load latency predicts loaded latency.
**Rules:** MUST track p95/p99 latency for user-facing paths. NEVER quote average latency as a performance result. SHOULD keep sustained utilization below saturation and alert on percentile burn.

### #133 — Egress Fees
**What:** Charges for data leaving a cloud provider's network (per-GB to the internet, and often between regions/AZs); ingress is usually free — the asymmetry is deliberate.
**Why it matters:** Egress is the silent line item that makes architectures expensive and migrations painful: a chatty cross-region design or a media-heavy app can spend more on data transfer than on compute, and you only find out from the bill.
**Techniques & methods:** Keep traffic inside one region/AZ where possible; serve public content through a CDN (cheaper per GB and often free egress deals via CDN origin agreements); compress everything (#131); use VPC endpoints for cloud services (S3, DynamoDB) so traffic skips NAT gateways and the internet; consider provider pricing before multi-region designs. Set billing alerts and per-service cost tags from day one.
**Pitfalls:** Cross-AZ chatter between services and databases adding up per-GB; NAT gateway per-GB processing fees on top of egress; pulling large artifacts from another cloud; discovering egress only at invoice time.
**Rules:** MUST estimate egress cost in any architecture that moves data between regions, AZs, or clouds. SHOULD route public traffic through a CDN and cloud-service traffic through VPC endpoints. MUST set cloud billing alerts before launch.

## 7.7 Cloud & Infrastructure

### #134 — VPCs
**What:** A Virtual Private Cloud is your isolated private network inside a cloud provider: your own IP ranges, subnets, route tables, and gateways, logically separated from every other customer.
**Why it matters:** The VPC is your security perimeter. A badly designed one puts databases on public IPs or makes later segmentation nearly impossible without rebuilding the network under a running product.
**Techniques & methods:** Plan the CIDR block generously (e.g. /16) and non-overlapping with other VPCs/offices you'll ever peer with. Split into public and private subnets per AZ from day one. Codify everything in Terraform; peer VPCs or use a transit gateway rather than punching holes. Log traffic with flow logs.
**Pitfalls:** Tiny CIDRs that run out; overlapping ranges discovered when you try to peer or connect a VPN; flat networks where a compromised web server can reach the database directly.
**Rules:** MUST keep databases and internal services in private subnets. MUST define VPCs as code. NEVER launch production resources in the default VPC without reviewing its rules.

### #135 — Subnets
**What:** Subdivisions of a VPC's address range, each bound to one Availability Zone; a subnet is "public" if its route table points to an internet gateway, "private" if it reaches the internet only via NAT (or not at all).
**Why it matters:** Subnet layout decides what is reachable from the internet and what survives an AZ failure. Put everything in one subnet/AZ and one data-center incident takes the whole product down.
**Techniques & methods:** Per AZ, create a public subnet (load balancers, NAT) and private subnets (app servers, databases) — the classic three-tier layout. Size subnets for growth; keep each tier's route tables minimal and explicit. Spread every tier across at least two AZs.
**Pitfalls:** App servers in public subnets "temporarily" forever; one AZ's subnets for everything; mixing tiers in one subnet so security groups become the only (fragile) line of defense.
**Rules:** MUST span at least two AZs for production tiers. NEVER give app or database instances public IPs unless they are the designated edge. SHOULD keep subnet tiers consistent across AZs.

### #136 — NAT Gateways
**What:** A managed service that lets instances in private subnets initiate outbound internet connections (updates, third-party APIs) while blocking unsolicited inbound traffic — with source-address translation.
**Why it matters:** Private subnets are useless if they can't reach package repos or payment APIs. But NAT gateways bill per hour *plus per GB processed*, quietly becoming a top cost and a throughput bottleneck — and a single one is a single point of failure for its AZ.
**Techniques & methods:** Deploy one NAT gateway per AZ and point each AZ's private route tables at its local NAT. Route cloud-service traffic (S3, DynamoDB, ECR) through free VPC endpoints instead of the metered NAT. Monitor NAT port allocation errors — each destination sees a limited pool of source ports per NAT.
**Pitfalls:** One NAT for three AZs (cost-saving that converts an AZ blip into an outage and adds cross-AZ transfer fees); all internal S3 traffic flowing through NAT; hitting port exhaustion under connection churn.
**Rules:** MUST run one NAT gateway per AZ in production. SHOULD use VPC endpoints for AWS/GCP services to cut NAT cost. MUST alert on NAT port-allocation errors.

### #137 — Firewalls
**What:** Rules that filter network traffic by IP, port, protocol, and (at layer 7) application attributes — implemented as cloud rules, host firewalls (iptables/nftables), WAFs, and egress controls.
**Why it matters:** Firewalls are the enforcement layer of your network design. One "allow 0.0.0.0/0 to port 22" is how servers get cryptojacked within hours of launch; internet scanners find exposed ports faster than you will.
**Techniques & methods:** Default-deny inbound and add narrow allows. Layer it: WAF at the edge for HTTP attacks, security groups for instance rules (#138), host firewall as backstop. Control *egress* too — most breaches exfiltrate out. Review and expire rules; stale "temporary" rules are forever.
**Pitfalls:** Opening ports to the world for debugging and forgetting; allow-all egress; assuming the cloud's perimeter replaces host-level rules; rule sets nobody dares touch because nothing documents why they exist.
**Rules:** MUST default to deny and allow-list explicitly. NEVER expose admin ports (SSH, RDP, DB) to 0.0.0.0/0. MUST document and periodically review every rule. SHOULD restrict egress to known destinations.

### #138 — Security Groups
**What:** Stateful, instance-level virtual firewalls in AWS (and equivalents elsewhere): if you allow a request in, the response is automatically allowed out. Rules reference IPs or *other security groups*.
**Why it matters:** Security groups are usually the last control between the internet and your database. Their reference-chaining is also the cleanest way to encode "only the app tier may talk to the DB" — if you use it instead of IP lists.
**Techniques & methods:** One security group per role (edge LB, app, DB, cache). Chain them: DB group allows 5432 *from the app group only*, app group allows 443 from the LB group only. Keep descriptions on every rule. Use separate groups for admin access so it can be revoked cleanly.
**Pitfalls:** One giant shared group on everything; rules by instance IP that rot on redeploy; forgetting security groups are stateful when reasoning about return traffic; `0.0.0.0/0` on anything but 80/443 at the edge.
**Rules:** MUST scope each rule to a source security group or narrow CIDR. NEVER attach the same permissive group to all tiers. MUST describe every rule's purpose.

### #139 — Service Mesh
**What:** A dedicated infrastructure layer (Istio, Linkerd, Consul) of sidecar proxies beside every service instance, providing mTLS, fine-grained routing, retries, and telemetry uniformly across services.
**Why it matters:** It centralizes cross-cutting network policy instead of re-implementing TLS/retries in every codebase — but it adds real operational complexity, latency, and a new thing that can take everything down. Adopting it too early is a classic over-engineering outage source.
**Techniques & methods:** Adopt when you have many services, multiple languages, strict mTLS/compliance needs, or traffic-shaping requirements libraries can't standardize. Roll out incrementally: observability first, then mTLS (permissive → strict), then routing policies. Budget for the data-plane overhead and upgrade cadence.
**Pitfalls:** Installing Istio for three services; mesh-wide config mistakes propagating instantly everywhere; sidecar resource costs doubling small clusters; debugging becoming "your app, the proxy, or the control plane?"
**Rules:** MUST NOT adopt a service mesh before service count and compliance needs justify it. SHOULD roll out mTLS incrementally, never big-bang strict mode. MUST load-test the mesh overhead on latency-sensitive paths.

### #140 — Ingress Controllers
**What:** In Kubernetes, the controller that watches Ingress/Gateway API resources and configures a reverse proxy (nginx, Envoy, cloud LB) to route external HTTP traffic to services by host and path.
**Why it matters:** Ingress is your front door: TLS termination, routing, rate limiting, and auth for everything in the cluster. Misconfigured, it's either an outage (bad config push reloads the proxy) or a hole (a route you didn't know existed).
**Techniques & methods:** Manage routes as code alongside each service (GitOps). Terminate TLS at the ingress with automated certificates (cert-manager + Let's Encrypt or cloud ACM). Set per-route timeouts, body limits (#130), and rate limits here. Prefer the Gateway API for new clusters — it's the successor to the frozen Ingress API. Test config changes in staging; use implementations that reload without dropping connections.
**Pitfalls:** One monolithic hand-edited ingress nobody owns; annotations piling into unreviewable YAML; missing timeouts letting slow clients pin connections; exposing admin dashboards through an overlooked path rule.
**Rules:** MUST manage ingress config as reviewed code. MUST automate TLS certificate issuance/renewal. NEVER expose internal/admin endpoints through public ingress without auth.

### #141 — Health Checks
**What:** Automated probes — HTTP, TCP, or command — by which load balancers, orchestrators, and monitoring decide whether an instance is working and should receive traffic.
**Why it matters:** Health checks are how systems self-heal: dead instances get removed and replaced automatically. A bad check is doubly dangerous — too shallow and broken instances keep serving errors; too deep and a database hiccup marks every instance unhealthy and causes a total outage.
**Techniques & methods:** Check what the check protects: for load balancers, a cheap endpoint proving the process can serve (see #142). Use a dedicated `/health` path that doesn't hit the database or external APIs. Tune interval/threshold so a genuinely dead instance exits in seconds, not minutes. Report results into monitoring, not just the LB.
**Pitfalls:** Health endpoint that queries the DB — DB maintenance flaps the entire fleet; health endpoint doing expensive work under frequent probing; checks so lax a wedged process passes forever.
**Rules:** MUST expose a lightweight, dedicated health endpoint. NEVER make health depend on downstream services unless the intent is to shed load. SHOULD tune thresholds so detection is fast but not flappy.

### #142 — Liveness vs Readiness Probes
**What:** Kubernetes distinguishes *liveness* ("is this process wedged? restart it") from *readiness* ("can it take traffic right now? remove it from the Service until it can"), plus *startup probes* that gate both during slow boots.
**Why it matters:** Confusing them causes two classic outages: a liveness probe that checks the database restarts the whole fleet when the DB blips (restart storm, still no DB), and missing readiness sends traffic to instances still loading config and caches.
**Techniques & methods:** Liveness: check only internal process health (event loop responsive, not deadlocked) — never external dependencies. Readiness: check the instance can actually serve (dependencies reachable, warm-up done) — this is where a DB check may belong. Add a startup probe with a generous failure budget for slow-starting apps so liveness doesn't kill them mid-boot.
**Pitfalls:** Same endpoint for both probes with a DB query inside (the #1 probe anti-pattern); aggressive liveness thresholds restarting healthy-but-busy pods; no startup probe on JVM/ML apps with 60s+ boots.
**Rules:** MUST keep liveness free of external-dependency checks. MUST fail readiness — not liveness — when dependencies are down. SHOULD use startup probes for slow-booting containers.

### #143 — Graceful Shutdown
**What:** On receiving a termination signal (SIGTERM), the process stops accepting new work, finishes or safely abandons in-flight work, closes connections and resources, then exits.
**Why it matters:** Deploys, autoscaling, and node maintenance all terminate instances constantly. An app that dies instantly mid-request produces user-visible errors on *every deploy* — teams then fear deploying, which is how release processes rot.
**Techniques & methods:** Handle SIGTERM: mark readiness false first so load balancers drain you (#144), stop accepting connections, wait for in-flight requests/jobs with a bounded timeout, checkpoint or requeue unfinished work, close DB pools, then exit 0. Set orchestrator grace periods (e.g. `terminationGracePeriodSeconds`) longer than your drain time. Test it: deploy under load and count errors — target zero.
**Pitfalls:** Only handling SIGINT (Ctrl-C) in dev, never SIGTERM in production; exiting before in-flight requests finish; workers dying mid-job with no idempotency or requeue; grace period shorter than the longest request.
**Rules:** MUST handle SIGTERM with a drain-then-exit sequence. MUST make background job handlers safe to interrupt (idempotent or requeueable). SHOULD verify zero-error deploys under load in staging.

### #144 — Connection Draining
**What:** The load balancer stops sending new requests/connections to an instance being removed while allowing existing ones to complete — the network-level half of graceful shutdown.
**Why it matters:** Without draining, deregistering an instance mid-deploy severs live requests and WebSocket sessions. With it, zero-downtime deploys are routine. The gap between "removed from the LB" and "process exits" is where race conditions hide.
**Techniques & methods:** Sequence matters: readiness fails / deregistration begins → wait for propagation (LBs and kube-proxy take seconds) → *then* stop the app's listener → finish in-flight work → exit. Configure deregistration delay on ALBs (default 300s is often too long — tune it) and use `preStop` hooks/sleeps in Kubernetes to absorb endpoint-propagation lag. Keep keep-alive behavior in mind: clients may still send new requests on existing connections during drain.
**Pitfalls:** Process exiting the instant SIGTERM arrives, before endpoints have propagated; deregistration delay set to days' worth of seconds slowing rollouts; assuming "not ready" stops traffic instantly.
**Rules:** MUST sequence drain before shutdown, with a propagation wait. MUST tune deregistration delays to your deploy speed. NEVER kill in-flight connections during a planned removal.

### #145 — Stateless Services
**What:** Instances hold no request/session data in local memory or disk between requests — state lives in external stores (database, cache, object storage), so any instance can serve any request.
**Why it matters:** Statelessness is the precondition for everything else in this section: horizontal scaling, failover, rolling deploys, connection draining. One instance hoarding session state turns scaling into data loss and failover into logouts.
**Techniques & methods:** Sessions in Redis or signed tokens (JWT/cookies), files in object storage, jobs in queues, config in environment. Design handlers to fetch what they need per request. Keep a deliberate list of what *must* be stateful (databases, queues) and engineer those separately — state has to live somewhere; the rule is it doesn't live in app instances.
**Pitfalls:** In-memory sessions and caches that "work fine" until the second instance ships; uploads written to local disk; sticky sessions used to paper over statefulness, then breaking under autoscaling anyway.
**Rules:** MUST externalize sessions, files, and shared state from app instances. NEVER store user data on instance-local disk or memory as the only copy. SHOULD load-test with instances being killed mid-traffic.

### #146 — Failover
**What:** The automatic or manual switch of traffic/workload from a failed component to a standby — replica promotion for databases, health-based routing for services, multi-AZ/region redirection at the edge.
**Why it matters:** Hardware and AZs *will* fail. Failover is the difference between a blip and an outage — but untested failover is a hope, not a mechanism, and automatic failover can also fire spuriously and split the system.
**Techniques & methods:** Use managed failover where possible (RDS Multi-AZ, managed Redis/Kafka) and understand its trigger window. Make promotion idempotent and fenced (old primary must not keep accepting writes — see split-brain in Part 7.5 thinking: single-writer discipline). Rehearse: game days and chaos tests that actually kill primaries in staging, then in production off-peak.
**Pitfalls:** Failover never tested until the real incident; apps caching the old primary's DNS/connection for minutes; failback forgotten, leaving the system running on the weaker standby for months; health-check flapping causing failover ping-pong.
**Rules:** MUST test failover on a schedule, not just design it. MUST ensure clients reconnect/retry with backoff after failover. SHOULD automate failback or explicitly track running-on-standby state.

### #147 — Multi-Region
**What:** Running the system in two or more geographic cloud regions — active-passive (one serves, one waits) or active-active (both serve) — for latency and/or disaster survival.
**Why it matters:** Regions do fail and regulators sometimes require data residency. But multi-region multiplies cost, data-consistency pain, and operational surface — most products need multi-AZ, not multi-region, and adopt it for fashion at great expense.
**Techniques & methods:** Start active-passive with automated promotion and a tested runbook unless latency truly demands active-active. Decide the data story first: async replication (lag, possible loss), or per-region data partitioning by user home region. Route with latency-based DNS/Anycast (Route 53, Cloudflare, Global Accelerator). Keep regions identically defined in IaC.
**Pitfalls:** Active-active with a shared relational database (physics wins: cross-region writes are slow and conflict-prone); untested region evacuation; forgetting egress fees between regions (#133); config drift making the "standby" region subtly broken.
**Rules:** MUST NOT adopt multi-region without a stated requirement (DR target, residency, measured latency). MUST rehearse region failover. SHOULD prefer user-partitioned data over global active-active writes.

### #148 — Availability Zones
**What:** Physically separate data centers within one region — independent power, cooling, and networking, connected by low-latency links — designed so a failure in one doesn't imply failure in another.
**Why it matters:** AZ redundancy is the cheapest real availability you can buy: spreading across 2–3 AZs survives the most common cloud failure (a data-center incident) with none of multi-region's consistency problems. Single-AZ production is a known, accepted risk only if someone actually accepted it.
**Techniques & methods:** Run every tier across ≥2 AZs (3 for load balancers and quorum systems), with the load balancer distributing evenly. Keep stateful primaries in one AZ with synchronous replicas in another (Multi-AZ). Watch hidden costs: cross-AZ traffic is billed per GB — design chatty pairs to prefer same-AZ replicas where the platform supports it.
**Pitfalls:** "Multi-AZ" cluster whose instances the scheduler placed in one AZ anyway; AZ failure revealing a shared dependency (one NAT, one bastion); assuming an AZ failure is instant — drained capacity in surviving AZs must absorb the load.
**Rules:** MUST span production workloads across at least two AZs. MUST keep enough headroom for one AZ's loss. SHOULD verify actual instance placement, not just configuration intent.

### #149 — Single Points of Failure
**What:** Any component whose failure alone takes down the system — one instance, one LB, one database, one NAT gateway, one person, one API key.
**Why it matters:** Availability multiplies: five 99.9% components in series give ~99.5% overall, and a single non-redundant piece caps the whole system at its own reliability. Postmortems repeatedly find the SPOF was known, cheap, and "scheduled for later."
**Techniques & methods:** Draw the request path and the deploy path; for every node ask "if this dies at peak, what happens?" Eliminate by redundancy (replicas + failover, #146), managed services, and AZ spread (#148). Include non-obvious SPOFs: DNS provider, certificate expiry, the CI system, the one engineer's laptop, a single payment provider.
**Pitfalls:** Redundancy theater — replicas sharing one rack, subnet, or database; backups that were never restore-tested (a backup is a SPOF until a restore proves otherwise); redundant systems with a single shared config push that breaks all at once.
**Rules:** MUST maintain a written SPOF list with an owner and a removal plan. NEVER call replicas redundant if they share a failure domain. SHOULD re-audit SPOFs after every architecture change.

### #150 — Disaster Recovery
**What:** The strategy and tested procedures for restoring service after a catastrophic loss (region failure, data corruption, account compromise): defined by RTO (how fast) and RPO (how much data loss), implemented via backups, pilot-light, warm standby, or multi-region patterns.
**Why it matters:** DR is bought before the disaster or improvised during it — and improvisation loses data and days. Ransomware and accidental deletion, not just cloud failures, are the realistic triggers; the plan must assume credentials and production itself may be hostile or gone.
**Techniques & methods:** Let business-chosen RTO/RPO pick the tier: backups (hours/cheap) → pilot light → warm standby → active multi-region (minutes/expensive). Keep backups in a *separate account/region*, immutable or versioned against deletion, and test restores on a schedule — an untested backup is a rumor. Write runbooks (#157) for the top scenarios and rehearse them.
**Pitfalls:** Backups in the same account an attacker (or a runaway script) can delete; restore procedures that exist only in someone's head; DR region never provisioned, discovered broken during the incident; RPO promised in minutes, backups taken daily.
**Rules:** MUST define RTO and RPO explicitly with the business. MUST store backups isolated and immutably, and MUST test restores regularly. NEVER let DR depend on the same credentials and control plane as production.

## 7.8 Reliability & Operations

### #151 — RTO & RPO
**What:** RTO (Recovery Time Objective) is the maximum downtime you accept after a disaster; RPO (Recovery Point Objective) is the maximum amount of data, measured in time, you accept losing.
**Why it matters:** These two numbers decide your entire backup and disaster-recovery architecture — and its cost. An RPO of 24 hours means daily backups are fine; an RPO of 5 minutes demands continuous replication. Discovering your real tolerance *during* an outage is the most expensive way to learn it.
**Techniques & methods:**
- Set RTO/RPO per service with the business, in writing, before building recovery tooling.
- Derive backup frequency from RPO and restore automation from RTO — never the reverse.
- Test restores on a schedule; an untested backup is a hope, not a plan.
**Pitfalls:** Copying "zero downtime, zero data loss" goals that cost 10× the value they protect. Confusing backup success with restore success.
**Rules:** MUST document RTO/RPO for every production system. MUST rehearse restores. NEVER promise an RPO your backup interval cannot meet.

### #152 — SLAs
**What:** A Service Level Agreement is an external, contractual promise to customers — e.g., "99.9% uptime per month" — with consequences (credits, penalties) when missed.
**Why it matters:** An SLA breach is not just an engineering failure; it's money back, contract damage, and lost trust. Every nine you add costs disproportionately more to defend.
**Techniques & methods:**
- Promise only what you can measure exactly the way the contract measures it.
- Keep SLAs looser than your internal SLOs so you get warned before you breach.
- Exclude planned maintenance and third-party failures explicitly, in writing.
**Pitfalls:** Marketing writing SLAs engineering never reviewed. Measuring uptime differently from the customer (your probe says up, their users say down). Stacking dependencies whose combined availability is below your promise.
**Rules:** NEVER sign an SLA stricter than the measured SLO. MUST alert on SLA burn, not just SLO burn. SHOULD publish a status page so breaches are never a surprise.

### #153 — SLOs
**What:** A Service Level Objective is an internal reliability target for a measured indicator (SLI) over a window — e.g., "99.9% of requests succeed over rolling 30 days" (Google SRE).
**Why it matters:** SLOs turn "is it reliable enough?" from an argument into a number. They tell you when to ship features and when to stop and fix reliability — and they make 100% reliability explicitly *not* the goal, because users can't tell 99.99% from 100% but your budget can.
**Techniques & methods:**
- Build SLOs on user-facing SLIs: availability, latency, freshness — the four golden signals (latency, traffic, errors, saturation) are the starting set.
- Use a rolling window (28–30 days) so old incidents age out.
- Set the SLO slightly below what users actually notice being unhappy about.
**Pitfalls:** SLOs on internal metrics users never feel (CPU at 40%). Copying Google's 99.99% for a CRUD app that needs 99.5%.
**Rules:** MUST have an availability SLO for every user-facing service. NEVER target 100%. SHOULD keep SLOs few — one or two per user journey.

### #154 — Error Budgets
**What:** The error budget is 100% minus the SLO: a 99.9% SLO gives a 0.1% budget — about 43 minutes of downtime per month, or 1,000 failed requests per million (Google SRE).
**Why it matters:** It converts reliability into a spendable resource. Budget remaining = ship fast, take risks, run experiments. Budget exhausted = freeze features and fix reliability. It ends the dev-vs-ops war with arithmetic both sides agreed to in advance.
**Techniques & methods:**
- Write an error budget policy *before* you need it: what happens at 50% burned, at 100%.
- Google's rule of thumb: a single incident consuming >20% of the budget in four weeks forces a postmortem with a P0 action item.
- Track burn rate, not just remaining budget — a budget draining 10× too fast pages you *before* it's gone.
**Pitfalls:** Having a budget nobody enforces. Counting only downtime minutes while ignoring partial failures that burn requests.
**Rules:** MUST halt feature releases when the budget is exhausted. MUST alert on burn rate. NEVER let one team spend another team's budget silently.

### #155 — Incident Response
**What:** The organized process for handling production failures: detect, declare, coordinate, mitigate, resolve, review.
**Why it matters:** Incidents are when companies lose money and users. Ad-hoc response — everyone debugging in a group chat — doubles outage duration. Google's data shows change causes ~70% of outages, so the response muscle matters more than any single fix.
**Techniques & methods:**
- Use clear roles: Incident Commander (coordinates, doesn't debug), Communications Lead, and responders. One person drives; others execute.
- Mitigate first, diagnose later: roll back, fail over, or shed load before hunting the root cause.
- Keep a live incident timeline — it becomes the postmortem skeleton.
**Pitfalls:** The most senior engineer deep in a debugger while nobody coordinates. Fixing forward under pressure instead of rolling back a known-good version.
**Rules:** MUST declare incidents early — severity can drop later. MUST assign an Incident Commander. NEVER let responders silently work the same problem in parallel.

### #156 — On-Call
**What:** A rotation where an engineer carries the pager and is the first responder for production alerts, 24/7.
**Why it matters:** On-call is where reliability culture becomes real — engineers who get paged for their own code write more reliable code. Done badly, it's burnout, attrition, and 3 a.m. heroes holding the company together with caffeine.
**Techniques & methods:**
- Google SRE caps on-call load (e.g., max ~25% of an SRE's time) and pays or time-banks the burden; cap pages per shift (two real incidents per 12h is a sane ceiling).
- Follow-the-sun or reasonable regional rotations beat one global martyr.
- Every page must be actionable; unactionable pages get fixed or deleted (see #176).
**Pitfalls:** The founder/permanent-volunteer on-call forever. Paging for warnings. No compensation and no post-incident recovery time.
**Rules:** MUST compensate or time-bank on-call. MUST review page volume weekly. NEVER page a human for something automation can handle.

### #157 — Runbooks
**What:** Step-by-step operational procedures for known situations: "if this alert fires, do exactly this."
**Why it matters:** At 3 a.m., nobody thinks at their best. A runbook turns a senior engineer's knowledge into a procedure a tired responder — or an AI agent — can execute reliably, cutting mean time to recovery.
**Techniques & methods:**
- Link every alert to its runbook; an alert without a runbook is unfinished work.
- Write commands verbatim, with expected output and the decision points ("if X, stop and escalate").
- Version runbooks in git next to the code; update them in the postmortem of every incident that used them.
**Pitfalls:** Runbooks that describe the system instead of the actions. Stale steps after an architecture change — worse than no runbook, because they're confidently followed.
**Rules:** MUST attach a runbook link to every paging alert. MUST update the runbook after any incident where it was wrong or missing. SHOULD make runbooks executable by the least experienced on-call member.

### #158 — Postmortems
**What:** A written, blameless analysis of an incident: timeline, impact, root cause, and concrete action items to prevent recurrence.
**Why it matters:** Incidents are tuition. A postmortem is how you collect the education instead of paying for the same outage twice. Blamelessness is the mechanism: engineers who fear punishment hide causes; engineers who feel safe surface them.
**Techniques & methods:**
- Structure: summary, impact, timeline, root cause (keep asking "why" past the first answer), what went well/poorly, action items with owners and priorities.
- Focus on systemic causes ("deploy pipeline allowed untested config") not human ones ("Dave pushed the wrong button").
- Google's policy example: an incident burning >20% of the error budget mandates a postmortem with at least one P0 action item.
**Pitfalls:** Postmortem theater — document written, action items never done. Stopping at "human error," which is never a root cause.
**Rules:** MUST write postmortems for all major incidents. MUST track action items to completion. NEVER name-and-shame an individual as a root cause.

### #159 — Chaos Engineering
**What:** Deliberately injecting failures into a system — killing instances, adding latency, cutting dependencies — to verify it survives them before production does it for real (pioneered at Netflix with Chaos Monkey).
**Why it matters:** Resilience you haven't tested is resilience you don't have. Chaos experiments convert "we think it fails over" into evidence, during business hours, with the team watching — instead of at peak traffic on a holiday.
**Techniques & methods:**
- Start from a hypothesis: "if one AZ dies, error rate stays under X." Measure steady state, inject fault, compare.
- Begin in staging, then production with a small blast radius and an abort switch.
- Automate recurring game days for the failure modes you most fear.
**Pitfalls:** Random destruction with no hypothesis — that's just breaking things. Running chaos before basic monitoring exists, so you can't tell what happened.
**Rules:** MUST have an abort mechanism and a defined blast radius. MUST fix what chaos finds before expanding scope. NEVER run chaos experiments during peak events or active incidents.

### #160 — Graceful Degradation
**What:** Designing a system to lose features under stress instead of losing everything — recommendations go stale, images get smaller, but checkout still works.
**Why it matters:** Partial service keeps revenue and trust; total failure loses both. Most outages become disasters because a non-essential dependency (a recommendations service, an analytics call) takes the core flow down with it.
**Techniques & methods:**
- Rank features: core (must survive), valuable (degrade), decorative (drop first). Encode that ranking in code with feature flags.
- Serve stale cached data rather than errors when a backend is slow.
- Set timeouts and circuit breakers on every downstream call so failures stay contained.
**Pitfalls:** Degradation paths that are never tested and fail when first used. Timeout-free calls that let one slow dependency exhaust all your threads.
**Rules:** MUST set timeouts on every external call. MUST be able to disable non-core features without a deploy. NEVER let a non-essential service block the core user journey.

### #161 — Autoscaling
**What:** Automatically adding or removing compute capacity in response to load — more instances when traffic spikes, fewer when it fades.
**Why it matters:** Traffic is bursty; fixed capacity means you either pay for peak 24/7 or fall over at peak. Autoscaling matches cost to demand and absorbs spikes no human could react to in time.
**Techniques & methods:**
- Scale on signals close to user pain: request queue depth, latency, or concurrency — CPU alone lags reality.
- Tune for the scale-out delay: instances take minutes to boot, so scale early and keep headroom; scale in slowly to avoid flapping.
- Test scaling under load tests (#165) — an autoscaler you've never seen fire is a rumor.
**Pitfalls:** Scaling the stateless tier while the database — the real bottleneck — stays fixed. Aggressive scale-in that kills instances mid-request.
**Rules:** MUST load-test autoscaling behavior before production. MUST pair autoscaling with load shedding for spikes faster than scale-out. NEVER scale on CPU alone for latency-sensitive services.

### #162 — Horizontal vs Vertical Scaling
**What:** Vertical scaling = a bigger machine (more CPU/RAM). Horizontal scaling = more machines sharing the work.
**Why it matters:** It's the fundamental capacity decision. Vertical is simple but has a ceiling and a single point of failure; horizontal is effectively unbounded but demands stateless design, load balancing, and data partitioning — retrofitting it later is an architecture rewrite.
**Techniques & methods:**
- Scale vertically first for simplicity until cost or ceiling forces the issue.
- Design stateless services from day one so horizontal scaling stays *possible* even if unused.
- Remember state is the hard part: app servers scale horizontally easily; databases need replicas, sharding, or managed services.
**Pitfalls:** Assuming you can "just add servers" to a system with in-memory sessions and local-disk state. Buying a giant database server when a missing index was the problem.
**Rules:** MUST keep application tiers stateless. SHOULD scale vertically before re-architecting horizontally. NEVER store session state on individual app instances.

### #163 — Cold Starts
**What:** The latency penalty when a platform (serverless function, scaled-to-zero container, fresh JVM) must initialize before serving the first request.
**Why it matters:** A function that's fast warm can take seconds cold — runtime init, dependency loading, connection setup. Users experience the worst case, and p99 latency (#175) is often just "the cold-start percentage."
**Techniques & methods:**
- Keep deployment packages small; lazy-load heavy dependencies only on the code paths that need them.
- Use provisioned concurrency or minimum instances for latency-sensitive endpoints; keep-warm pings only as a last resort.
- Initialize connections and caches outside the handler so warm invocations reuse them.
**Pitfalls:** Putting user-facing synchronous flows on scale-to-zero infrastructure. Measuring average latency (warm-dominated) and missing the cold tail entirely.
**Rules:** MUST measure cold-start rate and duration separately. SHOULD keep critical paths warm. NEVER hide cold starts inside an average.

### #164 — Capacity Planning
**What:** Forecasting the resources a system will need — from growth trends, launch events, and load-test data — and provisioning ahead of demand.
**Why it matters:** Autoscaling handles minutes-scale spikes; it cannot conjure a bigger database, a higher cloud quota, or hardware in a full region. The outages that make the news are usually capacity failures someone could have forecast from a growth chart.
**Techniques & methods:**
- Model demand from business drivers (signups, campaigns, seasonal peaks), not just last month's graph.
- Know every hard limit in your stack: quotas, connection counts, disk IOPS — and your current % of each.
- Run load tests to find the breaking point, then plan to operate at ≤50–60% of it.
**Pitfalls:** Planning for average load instead of peak. Forgetting third-party rate limits are capacity too.
**Rules:** MUST review capacity before any launch or marketing event. MUST track utilization against known limits. NEVER discover a quota during an incident.

### #165 — Load Testing
**What:** Simulating realistic (and beyond-realistic) traffic against a system to measure behavior: throughput, latency under load, and the breaking point.
**Why it matters:** It's the only way to learn what your system does at 10× traffic before your users teach you. Load tests validate autoscaling, expose the real bottleneck (rarely where you guessed), and give capacity planning its numbers.
**Techniques & methods:**
- Use production-shaped traffic: same endpoint mix, payload sizes, and think times — not one URL hammered flat.
- Types with different jobs: smoke (tiny, sanity), load (expected peak), stress (find the break), spike (sudden jump), soak (hours, finds leaks).
- Test in an environment with production-like data volume; an empty database lies about query performance.
**Pitfalls:** Load testing from one laptop and measuring your own network. Declaring victory at average latency while p99 collapses.
**Rules:** MUST load-test before major launches and architecture changes. MUST record the breaking point. NEVER load-test production without coordination and an abort plan.

### #166 — Memory Leaks
**What:** A defect where a program holds references to memory it no longer needs, so usage grows until the process slows, gets killed, or takes the machine down.
**Why it matters:** Leaks are time bombs with fuses of days or weeks — the deploy looks fine, passes review, then the service dies at 4 a.m. on day nine. In garbage-collected languages leaks still happen: unbounded caches, forgotten event listeners, closures capturing ever-growing structures.
**Techniques & methods:**
- Watch resident memory over days, not minutes; a flat line is healthy, a sawtooth that never returns to baseline is a leak.
- Reproduce with load/soak tests and heap snapshots: snapshot, exercise, snapshot, diff retained objects.
- Bound every cache and queue; use weak references where the runtime offers them.
**Pitfalls:** "Fixing" leaks with bigger instances and more frequent restarts — that hides the fuse, it doesn't cut it. Blaming the GC.
**Rules:** MUST bound all caches and in-memory collections. MUST investigate any monotonic memory growth. NEVER ship a known leak mitigated only by restarts.

### #167 — OOM Killer
**What:** Linux's last-resort mechanism: when memory is exhausted, the kernel picks a process (by an "oom score" favoring large consumers) and kills it to save the system.
**Why it matters:** Your process doesn't get an exception — it gets SIGKILL, mid-request, with no chance to clean up. "The app randomly restarts" is very often the OOM killer, and the victim is chosen by the kernel, not by you.
**Techniques & methods:**
- Set container memory limits honestly and keep the app's own limits (heap caps) *below* the container limit, so the app degrades before the kernel shoots it.
- Monitor for OOM kills (`dmesg`, container exit code 137) and alert on them.
- Tune `oom_score_adj` to protect critical processes and sacrifice expendable ones first.
**Pitfalls:** Setting container limits far above node memory (kernel chooses victims under pressure). Mistaking OOM kills for application crashes and debugging the wrong thing for days.
**Rules:** MUST alert on exit code 137 / OOM kill events. MUST size app memory limits below container limits. NEVER run production containers with no memory limit.

### #168 — Structured Logging
**What:** Emitting logs as machine-readable records (usually JSON) with consistent fields — timestamp, level, message, correlation ID, and contextual key–values — instead of free-form text.
**Why it matters:** Free-text logs are for humans reading one server. Structured logs can be searched, filtered, aggregated, and alerted on across a fleet — the difference between "grep and pray" and answering "show me every failed payment for user X" in seconds.
**Techniques & methods:**
- Log events, not narratives: one event per line, stable field names, IDs as fields (not buried in the message string).
- Include the correlation ID (#173) in every record; use the same schema across all services.
- Log at boundaries: request in/out, external calls, state changes, errors with stack traces.
**Pitfalls:** Logging whole objects with passwords and tokens inside. A unique message string per code path, making aggregation impossible. Printing at INFO inside hot loops until log volume becomes a cost and a DoS.
**Rules:** MUST use a single structured format everywhere. MUST include correlation IDs. NEVER log secrets, credentials, or full request bodies with PII.

### #169 — Log Levels
**What:** Severity labels on log records — DEBUG, INFO, WARN, ERROR (and FATAL/CRITICAL) — that let you control volume and attention.
**Why it matters:** Levels are a filtering contract. When everything is ERROR, nothing is; when real errors are logged as INFO, they drown. Alerting and debugging both depend on levels meaning what they say.
**Techniques & methods:**
- DEBUG: diagnostic detail, off (or sampled) in production. INFO: normal business events — service started, order placed. WARN: something's wrong but handled — retry succeeded, config fallback used. ERROR: something failed and needs attention — a request or operation did not complete.
- Make the level configurable at runtime so you can raise verbosity during an incident without redeploying.
- Keep error-rate-by-level as a dashboard metric; a WARN spike is often tomorrow's incident.
**Pitfalls:** Logging expected failures (user typed a wrong password) as ERROR, training everyone to ignore ERROR. Catching exceptions and logging them at INFO to keep dashboards green.
**Rules:** MUST reserve ERROR for failures requiring attention. MUST make log level dynamically adjustable. NEVER catch-and-log an error at a lower level to hide it.

### #170 — Log Rotation
**What:** The automatic cycling of log files: old files are compressed, archived, and eventually deleted so logs never fill the disk.
**Why it matters:** "Disk full" from unrotated logs is one of the oldest self-inflicted outages in computing — the app didn't fail, its own diary suffocated it. Rotation also bounds cost when logs ship to a paid backend.
**Techniques & methods:**
- Rotate on size *and* time (e.g., 100 MB or daily), compress archives, and set explicit retention (e.g., 7–30 days local).
- Prefer shipping logs to a central system and keeping local retention short; in containers, log to stdout and let the platform manage it.
- Alert on disk usage trend, not just at 95%.
**Pitfalls:** Rotation configured for the app server but not the proxy/database on the same box. Keeping DEBUG-level logs at full volume "just in case" until the bill arrives.
**Rules:** MUST configure rotation for every process that writes files. MUST alert on disk growth rate. NEVER let application code manage its own log files in containers — use stdout.

### #171 — Distributed Tracing
**What:** Recording a request's journey across services as a tree of timed spans under one trace ID, so you can see exactly which hop was slow or failed.
**Why it matters:** In a microservices system, "the checkout is slow" can mean any of forty calls. Metrics tell you *that* it's slow; a trace shows you *where* — the one database call taking 2 of the 2.3 seconds.
**Techniques & methods:**
- Propagate trace context (W3C Trace Context standard) across every service boundary, including queues and async jobs.
- Name spans by operation, tag them with useful attributes (endpoint, status, tenant) — but see #174 on cardinality.
- Sample intelligently: keep all error traces, sample successes (head- or tail-based sampling).
**Pitfalls:** Broken context propagation at one async hop, splitting every trace in two. Instrumenting everything so verbosely the tracing system becomes your biggest cost.
**Rules:** MUST propagate trace context across all boundaries. MUST retain 100% of error traces. SHOULD adopt traces before adding more dashboards.

### #172 — OpenTelemetry
**What:** The CNCF open standard (formed 2019 from the merger of OpenTracing and OpenCensus) for generating and exporting traces, metrics, and logs — vendor-neutral APIs, SDKs, the OTLP protocol, and a Collector pipeline.
**Why it matters:** Instrument once, and your telemetry can flow to Jaeger, Prometheus, Datadog, or any OTLP backend. Without it, every observability vendor change means re-instrumenting every service with a proprietary agent.
**Techniques & methods:**
- Use auto-instrumentation for frameworks/libraries, then add manual spans only around meaningful business operations.
- Deploy the Collector to receive, batch, filter, and fan out telemetry — it keeps vendor logic out of your services.
- Follow OTel semantic conventions for attribute names so data is comparable across languages and teams.
**Pitfalls:** Expecting OpenTelemetry to be a dashboard or storage product — it is instrumentation and plumbing only; you still need a backend. Mixing OTel with leftover proprietary agents and double-shipping everything.
**Rules:** MUST instrument new services with OpenTelemetry, not vendor SDKs. MUST route telemetry through a Collector in production. NEVER build custom tracing formats when OTLP exists.

### #173 — Correlation IDs
**What:** A unique ID generated at the edge for each request, attached to every log line, trace, and downstream call that request causes.
**Why it matters:** It's the thread that stitches a distributed system together. With it, one user complaint ("my payment failed at 14:02") becomes one search that returns the full story across every service. Without it, debugging is archaeology.
**Techniques & methods:**
- Generate at the first entry point if absent; accept and forward an incoming one (this is exactly what trace IDs do in #171 — reuse them rather than inventing a parallel system).
- Include the ID in error responses to users/support — "quote reference X" turns tickets into lookups.
- Log it in a fixed structured field (#168) in every service, including background jobs spawned by the request.
**Pitfalls:** Generating a fresh ID per service so nothing correlates. Dropping the ID at async boundaries (queues, scheduled jobs) where failures love to hide.
**Rules:** MUST propagate the correlation ID on every outbound call and message. MUST include it in all logs. SHOULD return it in API error responses.

### #174 — Metrics Cardinality
**What:** The number of unique time series a metric creates — one per unique combination of label values. A label with unbounded values (user IDs, full URLs, error messages) explodes it.
**Why it matters:** High cardinality is how monitoring systems die and bills explode: a `user_id` label on a request counter turns one metric into millions of series, crushing the metrics database precisely when traffic (and your need for it) peaks.
**Techniques & methods:**
- Labels only from small, bounded sets: endpoint *pattern* (`/users/:id`, not `/users/8472`), status class, region, method.
- Put high-cardinality data in logs and traces, where it belongs — metrics are for aggregates.
- Audit label values in CI or code review; estimate series count before merging a new label.
**Pitfalls:** "Just add user_id, it'll help debugging" — the classic self-DoS. Using raw exception text as a label value.
**Rules:** NEVER use unbounded values (user IDs, request IDs, URLs, free text) as metric labels. MUST review new labels for cardinality. SHOULD set a series budget per service.

### #175 — p99 Latency
**What:** The 99th percentile response time: 99% of requests were faster than this, 1% slower. The tail latency real users actually feel.
**Why it matters:** Averages lie. An average of 100 ms can hide a p99 of 5 seconds — and at scale, the tail *is* the product: if each request fans out to 100 backend calls, a user request hits the p99 case almost every time (Google's "tail at scale" problem).
**Techniques & methods:**
- Track p50, p95, p99 (and p99.9 for fan-out-heavy systems) per endpoint; make SLOs on percentiles, not averages.
- Hunt tail causes specifically: GC pauses, cold starts (#163), connection pool waits, one slow shard.
- Measure at the client edge — server timers exclude queueing and network time users experience.
**Pitfalls:** Reporting only averages in dashboards and launch reviews. Optimizing p50 while the p99 that drives complaints stays untouched.
**Rules:** MUST define latency SLOs in percentiles. MUST dashboard p99 next to every average. NEVER quote average latency as user experience.

### #176 — Alert Fatigue
**What:** The condition where so many alerts fire — most unactionable — that responders start ignoring, muting, or bulk-acknowledging them, including the real ones.
**Why it matters:** Alert fatigue converts your monitoring system into background noise and is how major incidents get missed with the alert sitting right there, fired, ignored. It's also a leading driver of on-call burnout (#156).
**Techniques & methods:**
- Alert on symptoms users feel (SLO burn rate, error rate) rather than causes (one host's CPU) — symptom alerts are few and always meaningful.
- Every page must pass the test: "a human must act now, and a runbook says how." Anything else becomes a ticket or a dashboard.
- Review all alerts monthly; fix, rethreshold, or delete the noisy ones. Track pages per shift as a health metric.
**Pitfalls:** Alerting on every threshold in the monitoring tool's default template. "Warning" pages that wake people for non-urgent issues.
**Rules:** MUST delete or downgrade any alert that repeatedly fires without action. MUST alert primarily on SLO burn. NEVER page on a metric with no runbook.

### #177 — Error Tracking
**What:** Tools (Sentry and similar) that capture exceptions with full context — stack trace, release version, user/request data, breadcrumbs — and group them into issues.
**Why it matters:** Most production errors never become user reports; users just leave. Error tracking makes silent failures visible, deduplicated, and countable, so "the app feels buggy" becomes "release 2.4 introduced 3,000 crashes in checkout."
**Techniques & methods:**
- Tag every event with release/environment and the correlation ID (#173) to connect errors to traces and logs.
- Route new-issue and regression alerts to the team channel; review top issues weekly by user impact, not raw count.
- Source maps / symbolication must be uploaded per release, or frontend and native stack traces are garbage.
**Pitfalls:** Capturing errors in staging and personal data in production — scrub PII before sending. A firehose of grouped issues nobody triages, which is alert fatigue (#176) in another costume.
**Rules:** MUST run error tracking in production for every user-facing app. MUST scrub secrets and PII from events. SHOULD alert only on new or regressed issues.

### #178 — Profiling
**What:** Measuring where a running program actually spends time and memory — which functions, lines, and allocations — using sampled or instrumented profilers.
**Why it matters:** Engineers are reliably wrong about what's slow. Profiling replaces guessing with evidence, routinely revealing that the "slow database" is actually JSON serialization, or that 40% of CPU is one regex.
**Techniques & methods:**
- Profile under realistic load (from #165), not on an idle dev machine.
- Use continuous profiling in production (low-overhead sampling) so you can profile the incident that already happened, not just future ones.
- Fix the top item, re-measure, repeat — after the top hotspot, the profile changes completely.
**Pitfalls:** Optimizing without a profile ("premature optimization"). Micro-benchmarking a function in isolation when its real cost is allocation or lock contention in context.
**Rules:** MUST profile before optimizing anything non-trivial. MUST re-profile after each fix. NEVER accept "this should be faster" without before/after numbers.

### #179 — Flame Graphs
**What:** A visualization of profiled stack samples (popularized by Brendan Gregg at Netflix): each box is a function, width = share of samples (time) it consumed, stacked by call depth.
**Why it matters:** A flame graph turns a million stack samples into one picture where the expensive code is literally the widest thing on screen. It's the fastest known way for a human to find "where does the time actually go?"
**Techniques & methods:**
- Read width, not height: wide plateaus at the top are your hotspots; tall thin towers are just deep call chains.
- Generate from the same profiling data as #178 (perf, async-profiler, py-spy, pprof) and compare before/after graphs side by side.
- Search within the graph for known suspects (regex, serialization, crypto, your ORM) to confirm or clear them fast.
**Pitfalls:** Reading a flame graph from an idle or unrepresentative workload. Chasing wide *system/library* frames that are really just where your code called into them — follow the plateau back to your own frames.
**Rules:** SHOULD produce a flame graph for any serious performance investigation. MUST base optimization targets on the widest plateaus. NEVER optimize from a flame graph of a non-production-like load.

## 7.9 Delivery & DevOps

### #180 — Infrastructure as Code
**What:** Defining servers, networks, databases, and permissions in declarative code files (Terraform, Pulumi, CloudFormation) instead of clicking through cloud consoles.
**Why it matters:** Console changes are invisible, unreviewable, and unrepeatable. The failure mode is a snowflake production server nobody can rebuild when it dies — and no record of who changed what before an incident.
**Techniques & methods:**
- Package repeated patterns into modules; keep environments as thin variable files over the same modules.
- Run `plan` in CI on every PR so reviewers see the exact diff before it happens; apply only from the pipeline on merge.
- Tag every resource (service, environment, owner) for cost and incident lookup; schedule drift-detection plans.
**Pitfalls:** Half the infra in code, half clicked in the console → permanent drift. One giant monolithic config where a typo can touch everything. Secrets hardcoded in `.tf` files.
**Rules:** MUST define all persistent infrastructure in code. NEVER make manual console changes to managed resources. SHOULD show plan output on every infrastructure PR.

### #181 — Terraform State
**What:** The JSON state file that maps your configuration blocks to real cloud resource IDs — Terraform's memory of what it manages.
**Why it matters:** Lose or corrupt state and Terraform forgets your infrastructure exists: it may try to recreate production resources, orphan them, or destroy the wrong thing. State also stores many attribute values — including secrets — in plaintext.
**Techniques & methods:**
- Remote backend (S3, GCS, Terraform Cloud) with locking enabled — S3 native lockfile (`use_lockfile`, Terraform ≥ 1.10) or DynamoDB on older versions.
- Enable backend versioning and encryption; roll back to a prior state version when an apply goes wrong.
- Split state per environment and per component to shrink blast radius; fix drift with `terraform import` / `terraform state mv`, never by hand-editing JSON.
**Pitfalls:** State on one laptop. Two applies racing with no lock. Treating state as harmless config and emailing it around while it contains plaintext passwords.
**Rules:** MUST use a remote, locked, versioned backend. NEVER edit state JSON manually or commit it to git. MUST treat state as a secret and restrict backend access with least-privilege IAM.

### #182 — GitOps
**What:** Git holds the desired state of your clusters; an in-cluster agent (Argo CD, Flux) continuously pulls it and reconciles reality to match.
**Why it matters:** Every deployment becomes an auditable, revertible git commit. Without it, anyone with cluster access can `kubectl edit` production into a state nobody recorded — and the next deploy silently wipes or keeps it unpredictably.
**Techniques & methods:**
- One repo (or repo area) per environment; promote by merging a PR from staging to prod, never by re-deploying manually.
- Enable automated sync with self-heal and prune so manual drift is reverted, and alert on OutOfSync instead of silently accepting it.
- Keep secrets out of the repo with Sealed Secrets, SOPS, or External Secrets pulling from a vault.
**Pitfalls:** Auto-sync with no health gates ships a broken build everywhere, fast. Humans and the agent fighting over the same object. Plaintext secrets committed "temporarily."
**Rules:** MUST make git the single source of truth for cluster state. NEVER hand-apply manifests to production. SHOULD let CI bump image tags in git — the agent does the rest.

### #183 — Blue-Green Deployments
**What:** Run two identical production environments (blue = live, green = new version); switch 100% of traffic to green at once via load balancer or DNS, keeping blue as the instant fallback.
**Why it matters:** Rollback becomes flipping traffic back — seconds, not a stressful redeploy during an outage. Without it, a bad big-bang release means rebuilding and redeploying under fire.
**Techniques & methods:**
- Provision green from the exact same IaC and image artifacts as blue; smoke-test green on internal traffic before cutover.
- Keep blue warm and untouched until a defined bake period passes, then decommission.
- Database changes must follow expand/contract so the *old* code still runs on the *new* schema — otherwise rollback is a lie.
**Pitfalls:** Paying 2× infrastructure permanently. Long-lived connections (WebSockets, sessions) stranded on blue. Assuming rollback is instant when a one-way migration already ran.
**Rules:** MUST smoke-test the green environment before switching traffic. MUST keep the previous environment until the bake window ends. NEVER ship a schema change the old version cannot run against.

### #184 — Canary Releases
**What:** Route a small slice of real traffic (1–5%) to the new version, compare its metrics against the baseline, then ramp (25% → 50% → 100%) or abort.
**Why it matters:** Some bugs only exist under real traffic, real data, and real load. A canary finds them while they affect 1% of users instead of 100%.
**Techniques & methods:**
- Define promotion and abort criteria *before* the rollout: error rate, p99 latency, and one business KPI.
- Automate the analysis (Argo Rollouts, Flagger) so threshold breaches halt or roll back without a human watching dashboards.
- Choose a representative canary segment (random users or a full region), not just internal accounts.
**Pitfalls:** Canary too small or too short to detect anything statistically real. No pre-agreed abort criteria → arguments mid-incident. Canary users unrepresentative, so the bug only appears at 100%.
**Rules:** MUST define abort thresholds before the rollout starts. SHOULD automate rollback on SLO breach. NEVER jump straight from a small canary to 100% on high-risk changes.

### #185 — Rollbacks
**What:** Returning production to the last known-good version — code, configuration, and, hardest of all, data.
**Why it matters:** Mean time to recovery is what users remember. A rehearsed 2-minute rollback makes a bad deploy a blip; an improvised one makes it a headline.
**Techniques & methods:**
- Keep previous images/artifacts deployable; prefer rollback over hotfixing forward under pressure — forward fixes are unreviewed code written during an incident.
- Use expand/contract migrations (add → dual-write/backfill → switch reads → drop later) so old code works on new schema.
- Practice rollbacks in staging and game days; treat feature flags as an instant pseudo-rollback for behavior changes.
**Pitfalls:** Rollback plan invented during the incident. A dropped column or destructive migration makes the old code unable to run. Rolling back code but not the config/flag state that broke it.
**Rules:** MUST have a tested rollback path for every release. NEVER deploy a change you cannot reverse. SHOULD measure rollback time and keep it in minutes.

### #186 — Feature Flags
**What:** Runtime switches (LaunchDarkly, Unleash, Flagsmith, or config-backed) that enable/disable code paths per user, percentage, or environment without redeploying.
**Why it matters:** They decouple *deploy* from *release*: code ships dark, exposure ramps gradually, and a kill switch stops a bad feature in seconds instead of a rollback deploy.
**Techniques & methods:**
- Use short-lived release flags with a named owner and expiry date; create the removal ticket when the flag is created.
- Ramp by percentage while watching metrics; evaluate flags server-side for anything security- or billing-sensitive.
- Keep a separate class of long-lived operational kill switches for risky integrations — and test them.
**Pitfalls:** Flag debt — hundreds of stale flags nobody dares remove, doubling the test matrix. Inconsistent flag states across services mid-request. Flags quietly becoming permanent configuration.
**Rules:** MUST assign every flag an owner and a removal date. SHOULD default to the safe state when flag evaluation fails. NEVER leave a fully rolled-out release flag in the code beyond one release cycle.

### #187 — Environment Parity
**What:** Development, staging, and production run the same OS, runtime versions, dependencies, and backing-service versions — 12-Factor's dev/prod parity.
**Why it matters:** Most "works on my machine" bugs are parity bugs: a different database minor version, a missing env var, a different CPU architecture. They surface only in production, where they're most expensive.
**Techniques & methods:**
- One container image and toolchain for all environments (devcontainers, or docker-compose mirroring the prod topology locally).
- Pin runtime and tool versions in the repo (`.nvmrc`, `.tool-versions`, lockfiles); run the same DB engine and major version locally via containers.
- Let *configuration* differ between environments — never the artifact or its dependencies.
**Pitfalls:** SQLite in dev, Postgres in prod. Staging running a newer runtime than production. arm64 laptop builds silently deployed to amd64 servers without testing.
**Rules:** MUST build one immutable artifact and promote it across environments. NEVER rebuild per environment. SHOULD keep local backing services on the same major versions as production.

### #188 — Staging Environments
**What:** A production-like environment where release candidates are deployed and validated before they reach real users.
**Why it matters:** Staging is the last cheap place to catch deploy, config, and migration failures. Skipping it means your users do your integration testing.
**Techniques & methods:**
- Deploy every release candidate to staging first; run migrations and smoke tests there as part of the pipeline.
- Seed it with anonymized or synthetic data shaped like production (sizes, edge cases), never raw customer data.
- Add ephemeral preview environments per pull request for risky changes, torn down automatically.
**Pitfalls:** Staging rots — weeks behind prod, different data shape, until nobody trusts its results. One shared staging env permanently blocked by someone's broken deploy. Staging so undersized that performance bugs never reproduce.
**Rules:** MUST deploy to staging before production. NEVER put real customer PII in staging. SHOULD keep staging within one version of production at all times.

### #189 — 12-Factor Apps
**What:** Heroku's methodology (12factor.net) for portable, resilient SaaS: I. one codebase, many deploys; II. explicitly declared dependencies; III. config in environment variables; IV. backing services as attached resources; V. strict build/release/run separation; VI. stateless processes; VII. port binding; VIII. scale via the process model; IX. disposability (fast start, graceful shutdown); X. dev/prod parity; XI. logs as event streams to stdout; XII. admin tasks as one-off processes.
**Why it matters:** Apps that violate these are exactly the ones that can't scale horizontally, can't move clouds, and break on every deploy.
**Techniques & methods:**
- All config via env vars; logs only to stdout for the platform to aggregate; sessions and files in backing services, never local disk.
- Handle SIGTERM gracefully and start in seconds so orchestrators can move you freely.
**Pitfalls:** Per-environment config files baked into images. In-process state that pins users to one instance. Log files written inside containers and lost on restart.
**Rules:** MUST store config in environment variables, never in code or images. MUST write logs to stdout. NEVER keep state in the process — externalize it.

### #190 — Multi-Stage Builds
**What:** A Dockerfile with multiple `FROM` stages: an early stage with the full toolchain builds the app; the final stage copies only the artifacts into a slim runtime image.
**Why it matters:** Shipping compilers, source code, and dev dependencies in production images means huge images, slow deploys, and a far larger attack surface for scanners (and attackers) to find.
**Techniques & methods:**
- Builder stage (e.g. `node:20`) compiles and prunes; runtime stage (`node:20-alpine` or distroless) gets `COPY --from=builder` of just `dist/` and production `node_modules`.
- Order layers least-changing first (dependencies before source) to maximize build cache; always maintain a `.dockerignore`.
- Inject build secrets with BuildKit secret mounts — never as build `ARG`s, which persist in image history.
**Pitfalls:** "Temporarily" copying the whole build context into the final stage. Floating base tags making builds unreproducible. Secrets baked into intermediate layers.
**Rules:** MUST ship only runtime artifacts in the final image. SHOULD pin base images by digest. NEVER pass secrets as build arguments.

### #191 — Non-Root Containers
**What:** Running the container process as an unprivileged user (e.g. `USER 10001`) instead of root (UID 0), the Docker/Kubernetes default.
**Why it matters:** A compromised root process inside a container is one kernel or misconfiguration bug away from root on the host. Non-root shrinks the blast radius and is required by most cluster admission policies (`runAsNonRoot`).
**Techniques & methods:**
- Create an app user in the Dockerfile, `chown` only the directories the app truly needs, then set `USER` before `CMD`.
- In Kubernetes set `securityContext`: `runAsNonRoot: true`, `runAsUser`, `allowPrivilegeEscalation: false`, `capabilities: drop: ["ALL"]`, and `readOnlyRootFilesystem` where possible.
- Serve on high ports (>1024); non-root processes can't bind privileged ports.
**Pitfalls:** The app breaks writing to root-owned log/cache/tmp paths — fix the paths instead of reverting to root. Assuming "it's just a container" makes root safe.
**Rules:** MUST set a non-root `USER` in every production image. NEVER run production containers as root for convenience. SHOULD drop all Linux capabilities by default.

### #192 — Image Scanning
**What:** Automated analysis of container images for known vulnerabilities (CVEs) in OS packages and libraries, using scanners like Trivy, Grype, Snyk, or registry-native scanning.
**Why it matters:** An image built six months ago accumulates newly disclosed critical CVEs while sitting in production. Unscanned images are how patched-on-paper systems get breached through a forgotten base layer.
**Techniques & methods:**
- Scan in CI on every build; fail the pipeline on fixable Critical/High findings.
- Re-scan images already in the registry on a schedule — new CVEs apply to old images; pair with an SBOM (e.g. Syft output) for inventory.
- Set a base-image rebuild cadence so fixes actually ship, and track findings to closure like bugs.
**Pitfalls:** Scanning only at build time, never after. Alert fatigue: everything reported as critical, so nothing gets fixed. Scanning without gating — reports nobody is required to act on.
**Rules:** MUST scan every image before it reaches production. MUST fail the pipeline on fixable Critical CVEs. SHOULD re-scan deployed images continuously.

### #193 — Resource Requests & Limits
**What:** In Kubernetes, a container's *requests* are the CPU/memory the scheduler guarantees and reserves; *limits* are the ceiling — CPU is throttled at the limit, memory overage gets the process OOM-killed.
**Why it matters:** No requests means the scheduler packs pods blind: noisy neighbors, node memory pressure, cascading evictions. Wrong limits mean throttled latency on healthy services or surprise OOM kills in production.
**Techniques & methods:**
- Set requests from measured p95/p99 usage, not guesses; use VPA in recommendation mode to rightsize over time.
- Set memory request equal to memory limit for predictable behavior; many teams set CPU requests but omit CPU limits to avoid needless throttling.
- Guard namespaces with LimitRanges and ResourceQuotas so one team can't starve the cluster.
**Pitfalls:** Copy-pasted requests never revisited as the app changes. Limits set far above requests, overcommitting nodes. Zero requests → BestEffort pods, evicted first under pressure.
**Rules:** MUST set a memory request and limit on every production container. SHOULD base requests on measured usage. NEVER deploy to production with no requests at all.

### #194 — Pod Disruption Budgets
**What:** A Kubernetes policy (`minAvailable` or `maxUnavailable`) limiting how many pods of an application can be down at once from *voluntary* disruptions — node drains, cluster upgrades, rollouts.
**Why it matters:** Without one, routine maintenance can evict every replica of a service simultaneously and turn a planned upgrade into an outage. With a badly written one, maintenance becomes impossible instead.
**Techniques & methods:**
- Prefer `maxUnavailable: 1` (or 25–50%) for replicated stateless services — it scales automatically as replica counts change; use `minAvailable` = quorum size for stateful systems.
- Run at least 2 replicas: a PDB cannot protect a single pod, only block its eviction. Check `ALLOWED DISRUPTIONS` with `kubectl get pdb` before upgrades.
- PDBs only govern voluntary evictions via the Eviction API — they do nothing for node failures.
**Pitfalls:** `minAvailable` equal to the replica count, or `maxUnavailable: 0`, permanently deadlocking node drains and cluster upgrades. Restrictive PDBs on 1-replica apps creating maintenance standstills.
**Rules:** MUST define a PDB for every multi-replica production service. NEVER set `maxUnavailable: 0` except deliberately for single-instance stateful workloads. SHOULD alert when allowed disruptions sit at zero.

### #195 — Semantic Versioning
**What:** Version numbers as `MAJOR.MINOR.PATCH` (semver.org): MAJOR increments for breaking changes, MINOR for backward-compatible features, PATCH for backward-compatible fixes; bumping a number resets everything to its right to zero.
**Why it matters:** Consumers and automation decide whether an upgrade is safe from the number alone. A version that lies — a breaking change shipped as a patch — destroys that trust and manufactures dependency hell.
**Techniques & methods:**
- `0.y.z` means unstable: anything may change. `1.0.0` declares a stable public API. Use pre-release suffixes (`1.0.0-rc.1`) for candidates.
- Automate bumps from conventional commits or changelog discipline; treat released versions as immutable — never modify and re-publish one.
- Remember version ranges (`^`, `~`) in consumers resolve against your honesty.
**Pitfalls:** Breaking changes shipped as MINOR/PATCH. MAJOR bumped for marketing. Quietly re-tagging a released version with different contents.
**Rules:** MUST bump MAJOR for any incompatible API change. NEVER alter an already-released version. SHOULD state the public API surface the version contract covers.

### #196 — Lockfiles
**What:** The generated file (`package-lock.json`, `yarn.lock`, `Cargo.lock`, `go.sum`, `poetry.lock`) pinning every dependency — direct and transitive — to an exact version and integrity hash.
**Why it matters:** Without a lockfile, the "same" code installs a different dependency tree every day. One upstream patch release becomes your production outage, and builds stop being reproducible.
**Techniques & methods:**
- Commit the lockfile for every deployable application; install in CI with frozen mode (`npm ci`, `yarn --immutable`, `--locked`) so any drift fails the build.
- Update dependencies deliberately, in their own reviewable PRs — read the lockfile diff like code.
- Use one package manager per repo so rival lockfiles don't fight.
**Pitfalls:** Deleting and regenerating the lockfile to "fix" a merge conflict without reading what changed. Gitignoring it in applications. Trusting `^` ranges in CI without the lockfile enforced.
**Rules:** MUST commit the lockfile for every application. MUST install from the lockfile in CI/CD. NEVER hand-edit a lockfile.

### #197 — Reproducible Builds
**What:** Building the same source twice produces bit-identical (or verifiably equivalent) artifacts, because every input — code, dependencies, toolchain, base images — is pinned and recorded.
**Why it matters:** If a build can't be reproduced, you cannot prove the shipped binary matches the reviewed source. That gap is exactly where supply-chain compromises live.
**Techniques & methods:**
- Pin everything: dependency versions via lockfiles, base images by digest, compiler/runtime versions in the build definition.
- Eliminate nondeterminism: embedded timestamps and random ordering (use `SOURCE_DATE_EPOCH`), and build hermetically in CI with no unvetted network fetches.
- Record provenance/attestations for release artifacts (SLSA-style) so verification is a check, not a belief.
**Pitfalls:** Floating tags like `node:latest` in Dockerfiles. Mutable caches on a pet build server. "CI builds it differently than my machine" accepted as normal.
**Rules:** MUST pin toolchain and base images by version or digest. SHOULD be able to rebuild any shipped artifact and match it. NEVER ship an artifact whose build inputs weren't recorded.

### #198 — Branch Protection
**What:** Repository rules on important branches (GitHub/GitLab): required pull-request reviews, required passing status checks, and bans on direct pushes and force-pushes.
**Why it matters:** The protected branch is what production deploys from. One unreviewed commit — or one history-erasing force-push — can ship anything, and remove the evidence.
**Techniques & methods:**
- On `main`: require at least one approving review, green CI, and branches up to date before merge; block force-push and branch deletion.
- Use CODEOWNERS so sensitive paths (infrastructure, auth, billing) require their owners' review.
- Extend the same rules to release branches; consider signed commits for high-assurance repos.
**Pitfalls:** Admins exempting themselves "just this once," permanently. Flaky required checks training the team to override. Protecting `main` while production actually deploys from an unprotected branch.
**Rules:** MUST protect every branch that production deploys from. NEVER force-push to a protected branch. SHOULD require code-owner review for infrastructure, auth, and billing changes.

### #199 — Public S3 Buckets
**What:** Object-storage buckets (S3, or the Azure/GCS equivalents) readable by anyone on the internet because of public ACLs or bucket policies.
**Why it matters:** This is the classic cloud breach headline: database backups, invoices, and customer exports left world-readable. Attackers scan for open buckets continuously, so exposure is discovered in minutes, not months.
**Techniques & methods:**
- Enable S3 Block Public Access with all four settings at the *account* level; new buckets have blocked public access by default (since April 2023), but legacy buckets and "temporarily" relaxed settings still leak.
- Audit continuously with IAM Access Analyzer and alert on any bucket-policy change.
- Serve genuinely public assets through CloudFront with Origin Access Control while the bucket itself stays private.
**Pitfalls:** Disabling Block Public Access "just to share one file." A bucket public via ACL while its policy looks private. Assuming content served publicly via CDN requires a public bucket.
**Rules:** MUST enable Block Public Access account-wide. NEVER make a bucket public to share files — use presigned URLs or CloudFront. SHOULD alert on bucket policy and ACL changes.

### #200 — Presigned URLs
**What:** A URL cryptographically signed with your credentials that grants time-limited access to one specific private object — a download (GET) or upload (PUT) — generated by the storage SDK.
**Why it matters:** Users get direct-to-storage transfer: no file bandwidth proxied through your servers, and no need to make the bucket public. Done wrong, it's a signed blank check.
**Techniques & methods:**
- Generate the URL only *after* a server-side authorization check that this user may access this exact object.
- Keep expiry as short as the UX allows — minutes, not days; constrain uploads with content-length and content-type conditions.
- For high-volume global downloads, prefer CloudFront signed URLs/cookies over raw S3 presigning.
**Pitfalls:** Multi-day expiries that get shared and leaked. Presigning whatever object key the client requests — an IDOR that lets any user download everyone else's files. Unconstrained presigned PUTs abused as free anonymous storage.
**Rules:** MUST authorize the user for the exact object before signing. SHOULD use the shortest workable expiry. NEVER presign a client-supplied key without an ownership check.

### #201 — Cloud Billing Alerts
**What:** Budget thresholds and anomaly detection (AWS Budgets, AWS Cost Anomaly Detection, GCP budget alerts) that notify you — or act — when cloud spend crosses defined lines.
**Why it matters:** Cloud cost failures are silent until the invoice: a runaway autoscaler, an infinite retry loop hitting a paid API, or a leaked key mining crypto can burn thousands overnight in an account nobody was watching.
**Techniques & methods:**
- Set alerts at multiple thresholds (50%, 80%, 100% of monthly budget) per account/project, plus ML-based anomaly detection for spend that doesn't fit the pattern.
- Tag resources by service and team so every alert names an owner; escalate from notify → ticket → automated shutdown for dev/sandbox accounts.
- Review cost next to uptime in the same operational dashboard.
**Pitfalls:** Alerts delivered to an unmonitored mailbox. One giant whole-account budget that hides which service ran away. Alerts with no named owner and no runbook, so everyone assumes someone else is handling it.
**Rules:** MUST configure billing alerts on every cloud account before workloads run in it. SHOULD set multiple thresholds with escalating actions. NEVER dismiss an anomaly alert as "probably fine" without checking.

## 7.10 Testing

### #202 — Unit Tests
**What:** Tests of the smallest testable unit — a function or class — in isolation, running in milliseconds.
**Why it matters:** They are the cheapest bug-catchers in existence and the base of the test pyramid (Fowler/Cohn: many unit tests, fewer integration tests, very few end-to-end). Fast feedback is what makes refactoring safe instead of terrifying.
**Techniques & methods:** Structure every test Arrange–Act–Assert. Test behavior and outcomes, not implementation details. Cover boundary values (0, 1, max, empty) alongside the happy path. Keep tests deterministic: no real network, database, clock, or randomness.
**Pitfalls:** Testing internal call sequences so every refactor breaks tests. Mocking everything until the test only tests the mocks. Slow "unit" tests with hidden I/O that nobody wants to run.
**Rules:** MUST run in milliseconds and in CI on every commit. MUST NOT touch a real network or database. SHOULD assert observable outcomes, not which internal methods were called.

### #203 — Integration Tests
**What:** Tests that verify components work together — service + real database, API + queue, module + file system.
**Why it matters:** Unit tests pass while the wiring, SQL, serialization, and configuration are broken. Most production bugs live at the boundaries between components, and only integration tests see them.
**Techniques & methods:** Run against the real thing — a throwaway instance of the same database engine and version as production (e.g., Testcontainers), not a mock. Target the riskiest seams first. Give every test its own isolated data and clean up after itself.
**Pitfalls:** Sharing mutable test data between tests, producing order-dependent failures. Mocking the very integration the test exists to verify. Letting the suite grow to hours so it stops being run.
**Rules:** MUST use the same database engine/version as production. MUST isolate data per test. SHOULD keep the whole suite in minutes, not hours.

### #204 — End-to-End Tests
**What:** Tests that drive the complete, deployed system the way a real user does — through the UI or public API, across a full journey.
**Why it matters:** They give the highest confidence that the whole system actually works together, and catch environment, configuration, and wiring failures that no lower-level test can see.
**Techniques & methods:** Cover only the few critical journeys — signup, login, checkout, the one core workflow. Use stable selectors (e.g., `data-testid`) instead of CSS structure. Run headless in CI against a staging environment.
**Pitfalls:** The "ice-cream cone": hundreds of brittle E2E tests and almost no unit tests. Fowler's warning stands — UI-driven tests are slow, brittle, and prone to non-determinism, which quietly destroys trust in the whole suite.
**Rules:** MUST keep E2E tests few and limited to critical journeys. NEVER build a long-term suite on record-and-playback tools. MUST treat a red E2E test as a release blocker — or fix or delete it, never ignore it.

### #205 — Contract Testing
**What:** The consumer of an API records the request/response interactions it depends on (a "contract" or pact); the provider automatically verifies it can still satisfy them.
**Why it matters:** In a microservices system, a provider can rename one field and silently break five consumers. Full end-to-end testing across dozens of services is impractical; contracts catch breaking changes before deployment, in each team's own CI.
**Techniques & methods:** Use consumer-driven contracts (e.g., Pact): consumer tests generate the contract, it is published to a broker, provider CI verifies against it, and a `can-i-deploy` check gates every release.
**Pitfalls:** Writing contracts that mirror the provider's implementation instead of what the consumer actually needs. Copying contract files between repos by hand. Verifying against stubs that hide the provider's real behavior.
**Rules:** MUST gate deployments on contract verification (can-i-deploy or equivalent). MUST publish verification results back to the broker. NEVER hand-copy contract files between repositories.

### #206 — Flaky Tests
**What:** A test that passes and fails on the exact same code, nondeterministically.
**Why it matters:** Flakiness destroys the suite's value as a signal. Once developers learn that red "usually means nothing," they stop investigating — and real regressions sail through. As Fowler puts it, you must eradicate non-determinism or the suite stops being trusted.
**Techniques & methods:** Hunt the root cause: shared state, test-order dependence, real clocks and randomness, fixed `sleep()` waits on async work, live external services. Freeze clocks, seed randomness, wait on conditions not timers. Quarantine a flaky test with an owner and a deadline — then fix or delete it.
**Pitfalls:** "Fixing" flakiness with retry-until-green, which hides real intermittent bugs. Leaving flaky tests in the main suite to rot everyone's trust.
**Rules:** MUST treat flakiness as a bug with an owner. NEVER hide nondeterminism behind automatic retries. SHOULD delete a chronically flaky test — a lying test is worse than no test.

### #207 — Mocking
**What:** Replacing collaborators with test doubles. The five kinds (Meszaros/Fowler): **dummy** (fills a parameter), **stub** (canned answers), **spy** (stub that records calls), **mock** (pre-programmed expectations, verifies calls), **fake** (working lightweight implementation, e.g., in-memory database).
**Why it matters:** Doubles isolate the unit under test and tame awkward dependencies (email, payments, time). Misused, they couple tests to implementation — refactors break tests instead of bugs doing it, and green tests coexist with a broken real integration.
**Techniques & methods:** Prefer real objects first, then fakes, then stubs; reserve mocks for boundaries you own. Assert state/outcomes by default; verify interactions only when the call *is* the behavior (e.g., "exactly one confirmation email sent").
**Pitfalls:** Mocking types you don't own (wrap them first). Mocking every collaborator so the test re-implements the code. Fowler's key distinction: only mocks do behavior verification — everything else is state verification.
**Rules:** MUST NOT mock the thing under test. SHOULD prefer fakes and stubs over expectation-heavy mocks. NEVER let mock expectations duplicate the implementation line by line.

### #208 — Regression Tests
**What:** A test written when a bug is found, proving that specific bug can never come back.
**Why it matters:** Bugs recur — the same edge case gets reintroduced by a later refactor, a new hire, or an AI agent that can't see the scar tissue. Without a regression test, the same incident happens twice.
**Techniques & methods:** First reproduce the bug as a failing test, then fix the code until it passes. Name the test after the bug or incident so its purpose survives. Keep it in the permanent suite, forever.
**Pitfalls:** Fixing the bug with no test because "it's obvious." Writing a "regression test" that actually passes on the buggy code — it proves nothing.
**Rules:** MUST write the failing test before the fix. MUST verify the test fails without the fix and passes with it. NEVER close a bug ticket until its regression test is in CI.

### #209 — Smoke Tests
**What:** A tiny, shallow, fast suite that checks a build or deployment basically works: the app boots, the health endpoint answers, the login page loads.
**Why it matters:** It catches dead-on-arrival deployments in minutes — bad config, missing env var, broken migration — before deeper testing runs or real traffic arrives.
**Techniques & methods:** Run automatically after every deploy, in every environment. Cover startup plus three to five critical paths only. Keep total runtime under a few minutes.
**Pitfalls:** Letting the smoke suite quietly grow into a second E2E suite. Depending on perfect pre-existing data. Treating a smoke failure as "probably nothing."
**Rules:** MUST run smoke tests after every deployment, before traffic shifts to the new version. MUST keep them few, fast, and shallow. NEVER ignore a smoke failure — it means stop the rollout.

### #210 — Property-Based Testing
**What:** Instead of example inputs, you state properties that must hold for *all* inputs; the framework generates hundreds of cases and **shrinks** any failure to the smallest counterexample (QuickCheck, Hypothesis, fast-check).
**Why it matters:** Example-based tests only check cases you imagined. Property tests find the input you didn't — the empty string, the huge number, the weird Unicode — automatically.
**Techniques & methods:** Pick strong properties: round-trips (`decode(encode(x)) == x`), idempotence, commutativity, invariants ("balance never goes negative," "sorted output is a permutation of input"). Constrain generators to valid inputs. Save every shrunk counterexample as a permanent regression test.
**Pitfalls:** Weak properties that only assert "doesn't crash." Generators that never produce edge values. Skipping shrinking and debugging a giant random blob.
**Rules:** SHOULD use property tests for parsers, serializers, money math, and state machines. MUST convert shrunk failures into fixed regression tests. NEVER treat property tests as a total replacement for example tests — combine them.

### #211 — Fuzzing
**What:** Bombarding a program with random and mutated inputs to find crashes, hangs, and memory errors; modern fuzzers are coverage-guided (AFL, libFuzzer, go fuzz).
**Why it matters:** Anything that parses untrusted input — file formats, protocols, codecs — will meet hostile input in production, possibly from an attacker. Fuzzing has found countless exploitable, Heartbleed-class bugs that no human thought to test for.
**Techniques & methods:** Fuzz every parser and protocol handler that touches untrusted data. Maintain a seed corpus of interesting inputs and let coverage guide mutation. Run under sanitizers (ASan/UBSan) so silent memory corruption becomes a visible failure. Triage, minimize, and fix every unique crash.
**Pitfalls:** Fuzzing without sanitizers or assertions, so only loud crashes surface. Skipping fuzzing because "inputs are validated" — the validation code is exactly what breaks. Running a fuzzer once, ever.
**Rules:** MUST fuzz code that parses untrusted input. MUST treat every unique crash as a security bug until triaged. SHOULD run fuzzers continuously in CI, not as a one-off exercise.


## 7.11 Code-Level Pitfalls

### #212 — Error Handling
**What:** The deliberate strategy for detecting, reporting, and recovering from failures: typed errors, propagation, logging, and what the user sees.
**Why it matters:** Unhandled errors crash processes mid-request and leak stack traces to strangers; swallowed errors corrupt data silently. The quality of your error handling is the difference between a 3-minute fix and a 3 a.m. mystery.
**Techniques & methods:** Fail fast on programmer errors; handle recoverable failures at system boundaries. Wrap errors with context as they propagate ("failed to charge order 123" beats "null pointer"). Use one global handler per process/API layer. Distinguish user errors (4xx) from system errors (5xx) and give each a stable shape.
**Pitfalls:** Empty `catch {}` blocks that make failures invisible. Using exceptions for normal control flow. Error responses containing SQL, file paths, or stack traces.
**Rules:** MUST log errors with context, NEVER swallow them silently. MUST NOT expose internals in user-facing errors. SHOULD retry only idempotent operations, with backoff.

### #213 — Edge Cases
**What:** Inputs and conditions at the extremes of the range: empty, null, zero, one, maximum, first, last, huge, negative, concurrent.
**Why it matters:** Production lives at the edges. Happy-path code fails on the first real user with an empty cart, a 10,000-item list, or a name your assumptions didn't cover.
**Techniques & methods:** Use boundary value analysis — test min, min+1, nominal, max−1, max. Partition inputs into equivalence classes and sample each. For every input ask: what if it's empty, null, huge, negative, malformed, or arrives twice at once? Use property tests and fuzzing to hunt edges mechanically.
**Pitfalls:** Testing only "representative" values. Forgetting the second-request edge — concurrency. Assuming some other layer enforces the constraint.
**Rules:** MUST test empty, null, zero, and maximum-size inputs for every public function. SHOULD list edge cases in the spec before coding. NEVER assume "that can't happen" without an assertion enforcing it.

### #214 — Off-by-One Errors
**What:** Loops, indexes, or ranges wrong by exactly one — the fencepost error: a 10-metre fence with posts every metre needs 11 posts, not 10.
**Why it matters:** Missed items, duplicated items, index-out-of-bounds crashes, and pagination that skips or repeats rows. Arguably the most common bug class in the history of software.
**Techniques & methods:** Default to half-open ranges `[start, end)`: length is `end − start`, empty is natural, ranges compose cleanly. Iterate collections directly instead of hand-managing indexes. Test every loop and slice with sizes 0, 1, and 2.
**Pitfalls:** Mixing inclusive and exclusive bounds in the same API. Hand-rolled index arithmetic. Offsetting pagination twice (once in the query, once in the UI).
**Rules:** MUST use half-open intervals as the default convention. MUST test iteration logic with 0, 1, and 2 elements. NEVER hand-roll index math where an iterator or range construct exists.

### #215 — Floating Point Math
**What:** IEEE 754 binary floats approximate most decimal fractions: `0.1 + 0.2` is `0.30000000000000004`, not `0.3`.
**Why it matters:** Equality checks fail, running totals drift, and rounding lands on the wrong side. The bugs look random, appear only with certain values, and erode trust in every number the system prints.
**Techniques & methods:** Compare floats with a tolerance (epsilon), never `==`. Use a decimal type (BigDecimal, Decimal, decimal.js) whenever the value must be exact. For long summations, use compensated (Kahan) summation to control accumulated error. Round once, at the final/display step.
**Pitfalls:** `==` on floats. Assuming float→string→float round-trips cleanly. Summing millions of small floats naively. Letting float error accumulate inside loops and ledgers.
**Rules:** NEVER compare floats for equality. MUST use decimal arithmetic for money and anything contractually exact. SHOULD keep floats only where approximation is genuinely acceptable — graphics, ML, physics.

### #216 — Storing Money as Floats
**What:** The most expensive special case of floating point: keeping currency amounts in binary float.
**Why it matters:** Floats cannot represent 19.99 exactly. Across thousands of transactions the errors compound until accounts don't reconcile, customers are over- or under-charged, and finance comes asking questions you can't answer.
**Techniques & methods:** Store integer minor units — cents, paise — in a 64-bit integer, or use a true DECIMAL/NUMERIC column or decimal library end to end. Always store the currency code beside the amount. Define the rounding mode explicitly (half-up, banker's) per business rule and jurisdiction, and apply it in exactly one place.
**Pitfalls:** Doing price math in JavaScript numbers (all float64) and hoping. Multiplying by 100 and rounding late. Mixing currencies in a single amount field. Displaying raw float artifacts to customers.
**Rules:** NEVER store or compute money in a float. MUST store amount and currency together. MUST make rounding rules explicit in code and covered by tests.

### #217 — Time Zones
**What:** The gap between an absolute instant and local civil time: every region has a UTC offset that changes with politics and daylight saving, tracked by the IANA time zone database.
**Why it matters:** Store a "9 a.m." wrong and it renders at the wrong hour for millions of users. Billing windows, schedules, expiries, and log correlation all silently shift.
**Techniques & methods:** Store instants in UTC (or epoch). Convert to the user's IANA zone — `America/New_York`, not "EST" — only at display time. For future local events, store the zone with the wall time so "9 a.m. next March" survives an offset change. Keep the tz database updated.
**Pitfalls:** Storing naive local timestamps. Using fixed offsets (−05:00) instead of named zones. Doing date math in the server's local time. Assuming offsets are whole hours — India is +5:30, Nepal +5:45.
**Rules:** MUST store UTC instants. MUST use IANA zone names for user-facing times, NEVER raw offsets. NEVER let server-local time leak into business logic.

### #218 — Daylight Saving Time
**What:** The twice-yearly clock shift: spring forward deletes an hour (some local times never exist), fall back repeats one (some local times happen twice).
**Why it matters:** 2:30 a.m. may not exist; 1:30 a.m. occurs twice. Schedulers fire twice or not at all, and durations computed from local times are silently wrong by an hour — on exactly two nights a year, when nobody is watching.
**Techniques & methods:** Schedule and compute in UTC; render in local time. For recurring local events, store zone + wall-clock time and resolve through a tz library. Write explicit tests pinned to the transition dates for every affected region.
**Pitfalls:** Cron-style jobs in local time double-firing in autumn and vanishing in spring. Assuming every day is 24 hours. Adding 86,400 seconds and calling it "tomorrow." Libraries silently picking one of the ambiguous times without telling you.
**Rules:** MUST handle nonexistent and ambiguous local times explicitly. MUST test scheduling code against spring-forward and fall-back dates. NEVER compute "next day" by adding a fixed number of seconds to a local time.

### #219 — Unicode
**What:** The standard that assigns a code point to nearly every character of every writing system. One visible character can be several code points: `é` is one code point or two (e + combining accent), and an emoji can be many, joined by zero-width joiners.
**Why it matters:** Naive code truncates names mid-character, counts "length" wrong (breaking validation and per-character billing), and corrupts search, sort, and comparison — for most of the world's users, whose names aren't ASCII.
**Techniques & methods:** Count user-visible characters as grapheme clusters (e.g., `Intl.Segmenter`). Normalize strings (NFC) before comparing, searching, or using as keys. Case-fold with locale awareness — the Turkish dotless i breaks naive lowercasing. Use Unicode-aware regex (`\p{...}` with the `u` flag).
**Pitfalls:** Using `.length` as "characters" (it counts UTF-16 code units in JS). Slicing strings by bytes. ASCII-only validation regexes rejecting real names. Comparing unnormalized strings and getting phantom mismatches.
**Rules:** MUST treat strings as Unicode text, never as bytes. MUST normalize before equality checks and search. NEVER validate names or addresses with ASCII-only patterns.

### #220 — Character Encoding
**What:** The mapping between characters and bytes: UTF-8 (the web's standard), UTF-16, and legacy encodings like Latin-1 / Windows-1252.
**Why it matters:** An encoding mismatch anywhere in the pipeline produces mojibake (`cafÃ©`), silently corrupts stored data, breaks parsing — and historically has smuggled attacks past filters that decoded differently than the application.
**Techniques & methods:** Use UTF-8 end to end: source files, database, HTTP headers, APIs, files. Declare the charset explicitly everywhere. Validate that incoming bytes are well-formed UTF-8 and reject what isn't. In MySQL, use `utf8mb4` — its older `utf8` is a 3-byte subset that cannot store emoji.
**Pitfalls:** The MySQL `utf8` vs `utf8mb4` trap. Assuming 1 byte = 1 character. Latin-1 data silently mixed into UTF-8 columns. Missing charset headers leaving browsers to guess.
**Rules:** MUST use UTF-8 across the whole stack and declare it in headers and schemas. MUST configure databases for full Unicode (utf8mb4 or equivalent). NEVER guess an encoding at read time.

### #221 — Thread Safety
**What:** Whether code behaves correctly when multiple threads touch shared state at once. Most shared mutable state is *not* safe by default.
**Why it matters:** Race conditions corrupt data intermittently — heisenbugs that pass every test and fail under production load, then vanish when you try to reproduce them. They are the most expensive class of bug to diagnose after the fact.
**Techniques & methods:** Design shared state away: prefer immutability, confinement (one owner thread/actor), and message passing. Where sharing is unavoidable, use locks, atomics, or concurrent collections, and keep critical sections tiny. Run race detectors (ThreadSanitizer, Go's `-race`) in CI.
**Pitfalls:** "It worked in testing" — races need load and unlucky timing. Check-then-act sequences that aren't atomic ("if not exists, insert" — twice). Sharing non-thread-safe collections like HashMap or ArrayList across threads.
**Rules:** MUST treat shared mutable state as a bug until proven safe. SHOULD design for immutability or message passing before reaching for locks. MUST run race detection where the platform provides it.

### #222 — Event Loop Blocking
**What:** In Node.js and browser JavaScript, one long synchronous task monopolizes the single main thread — every other request and the entire UI freeze behind it.
**Why it matters:** One 200 ms CPU-bound loop stalls thousands of concurrent users. The resulting latency spikes look random, evade CPU metrics (the process is "only" using one core), and are miserable to diagnose.
**Techniques & methods:** Keep handlers short. Offload CPU-heavy work to worker threads, child processes, or job queues. Chunk long work with `setImmediate`/yielding so the loop breathes. Paginate and stream instead of loading and transforming everything in memory. Monitor event-loop lag as a first-class metric.
**Pitfalls:** Synchronous crypto/file APIs in request paths. Catastrophic regex backtracking (ReDoS) on user input. Sorting or serializing giant arrays per request. Believing "async I/O" makes CPU work free.
**Rules:** MUST NOT run heavy synchronous work in request handlers. MUST move CPU-bound jobs to workers or queues. SHOULD alert on event-loop lag, not just CPU usage.

### #223 — Unhandled Promise Rejections
**What:** A Promise that rejects with no `.catch` attached. Since Node 15, the default behavior is to crash the process; in browsers it logs to the console and the failure silently disappears.
**Why it matters:** One forgotten `await` converts a recoverable error into a full process crash — taking every in-flight request down with it — or into a user staring at a spinner forever.
**Techniques & methods:** Always `await` or `.catch` every promise. Enable lint rules like `no-floating-promises` so unhandled promises fail the build, not production. Make fire-and-forget work explicit, with its own error handling. Add a process-level `unhandledRejection` handler that logs and shuts down gracefully.
**Pitfalls:** Wrapping a non-awaited call in try/catch — it catches nothing. Fire-and-forget promises assumed safe. A global handler that swallows the error and keeps running in a corrupt state.
**Rules:** MUST handle or explicitly catch every promise created. MUST enable floating-promise lint rules in CI. NEVER swallow a rejection silently.

### #224 — Integer Overflow
**What:** Arithmetic exceeding the type's range wraps around (or traps): a signed 32-bit integer maxes at 2,147,483,647, and past that, counters and balances turn negative.
**Why it matters:** IDs, view counts, timestamps, and money totals overflow years after launch, in code everyone trusted. In JavaScript, integers silently lose precision beyond 2^53 — equality and ordering of large IDs quietly break.
**Techniques & methods:** Default to 64-bit integers for IDs, counters, timestamps, and money in minor units. Use BigInt or decimal types where exactness is required beyond safe ranges. Pick database column types with headroom. Know your language's behavior — some wrap silently, some throw.
**Pitfalls:** 32-bit ints for epoch milliseconds or cent amounts. Multiplying before dividing in fixed-point math. Assuming JS numbers are exact integers at any size.
**Rules:** MUST use 64-bit (or bigger) for IDs, timestamps, and money. MUST think about overflow at every arithmetic boundary involving external data. NEVER store epoch time or currency in 32-bit integers.

### #225 — Garbage Collection
**What:** Automatic memory management: the runtime frees unreachable objects for you. The cost isn't a `free()` call — it's collection pauses and the memory you accidentally keep reachable.
**Why it matters:** GC pauses surface as p99 latency spikes. Accidental retention — unbounded caches, forgotten listeners, growing closures — leaks memory in "GC languages" just the same, until the container's OOM killer ends the process.
**Techniques & methods:** Bound every cache (size-capped, LRU) and every in-memory queue. Remove event listeners and timers when done. Profile the heap to find what's actually retained instead of guessing. Size container memory and heap deliberately, together.
**Pitfalls:** "It's a GC language, memory isn't my problem." Global/static collections that only ever grow. Blindly tuning GC flags before profiling. Setting container limits the GC doesn't know about, so the process is killed before collection helps.
**Rules:** MUST bound every in-memory cache and buffer. MUST monitor heap growth in production. SHOULD profile before touching GC tuning flags.

### #226 — Schema Validation
**What:** Checking data against an explicit schema — types, required fields, ranges, formats, allowed values — at every system boundary: API input, config, queue messages, file imports.
**Why it matters:** Unvalidated input is the root cause behind injection, data corruption, and the strangest production bugs. Garbage that gets stored becomes permanent garbage that every future feature must tolerate.
**Techniques & methods:** Validate at the edge with a schema library (Zod, JSON Schema, pydantic) and derive your types from the schema — one source of truth. Enforce ranges and lengths, not just types. Reject unknown fields where the contract allows. Validate data coming from your own queues and database too; it was user input two hops ago.
**Pitfalls:** Validating only in the frontend, which attackers bypass with one curl command. Copy-pasting validation rules into five places that drift apart. Trusting "internal" data blindly.
**Rules:** MUST validate all external input server-side against a schema. MUST return a clean 4xx for validation failures, not a 500 crash. NEVER trust data merely because it came from your own database or queue.

### #227 — Debouncing
**What:** Delaying a function until a burst of events has been quiet for N milliseconds, then running it once (search-as-you-type). Its sibling, throttling, runs at most once per interval (scroll handlers).
**Why it matters:** Without debouncing, every keystroke fires an API call: wasted load, flickering UI — and out-of-order responses, where a slow earlier reply overwrites the correct newer one and the UI lies.
**Techniques & methods:** Debounce user input that triggers network calls (search, autosave, resize) by roughly 200–300 ms. Cancel or ignore stale in-flight requests (AbortController, or track the latest request id). Create the debounced function once and reuse it.
**Pitfalls:** Debouncing but never handling the response race. A delay so long the UI feels dead. The classic React bug: creating a new debounced function on every render, so the timer resets constantly and debouncing silently does nothing.
**Rules:** MUST debounce high-frequency inputs that trigger network calls. MUST guard against out-of-order responses. NEVER recreate a debounced function on every render.

### #228 — Big O Notation
**What:** How an algorithm's time or memory grows as input grows: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ).
**Why it matters:** Code that is instant on 100 test rows collapses on a million production rows. Most "sudden" performance disasters are an O(n²) — often a nested loop or an N+1 query pattern — meeting real data volume for the first time.
**Techniques & methods:** Estimate growth before writing loops over data. Reach for hash lookups (O(1)) instead of repeated linear scans. Benchmark with production-scale data — toy fixtures lie. Know the classic traps: scanning a list inside a loop over the same list, string concatenation in a loop, sorting inside an iteration.
**Pitfalls:** Micro-optimizing constants while ignoring the order of growth. Assuming library calls are free. Judging performance on a dev machine with 50 rows.
**Rules:** MUST be able to state the complexity of any loop over a collection. MUST test performance-critical paths at production-scale data volumes. NEVER nest a full scan inside another scan without explicitly justifying it.

### #229 — Technical Debt
**What:** The future cost of choosing the quick solution now: shortcuts in code, tests, architecture, or docs that tax every subsequent change, like interest on a loan.
**Why it matters:** Unmanaged debt compounds — features slow down, bugs multiply, and engineers stop wanting to touch the codebase. But zero debt is also a failure mode: deliberate debt, taken knowingly, buys speed to market.
**Techniques & methods:** Make debt visible: log every shortcut as a tracked ticket at the moment it's taken, noting its "interest" (what it will slow down). Reserve recurring capacity (e.g., a fixed slice of each sprint) for repayment. Refactor opportunistically in code you're already changing.
**Pitfalls:** Invisible debt nobody wrote down. "Temporary" hacks with no ticket and no owner. Big-bang rewrites as the repayment plan — they usually fail. Gold-plating everything to avoid all debt, and shipping nothing.
**Rules:** MUST record every deliberate shortcut as a ticket when it's taken. SHOULD reserve recurring capacity for repayment. NEVER take shortcuts in authentication, money movement, or data migration code.

### #230 — Dead Code
**What:** Code that never executes: unreachable branches, unused functions, commented-out blocks, and feature-flag paths that were switched off and never removed.
**Why it matters:** It misleads every reader — human and AI agent alike — inflating review and audit surface, hiding the real control flow, and getting pointlessly "maintained" during refactors. Readers can't tell what's load-bearing.
**Techniques & methods:** Delete it. Version control is the safety net; git remembers everything. Use static analysis and coverage data to find unused code. When a feature-flag rollout completes, remove the flag and its losing branch in the same cleanup pass.
**Pitfalls:** Keeping code "just in case." Commenting out blocks "for later." Deleting code that's actually reached via reflection, config, or dynamic dispatch — verify before removing.
**Rules:** MUST delete dead code; NEVER comment it out for later. MUST remove completed feature flags and their dead branches. SHOULD run unused-code detection in CI.

### #231 — Merge Conflicts
**What:** Git cannot auto-merge when parallel branches change the same lines; a human must decide what the combined result should be.
**Why it matters:** Conflicts are where bugs are born. Rushed resolutions silently drop a teammate's feature or resurrect deleted code. Worse are *semantic* conflicts — the merge is clean, the code compiles, and the behavior is wrong.
**Techniques & methods:** Keep branches short-lived and pull requests small. Merge or rebase onto main frequently, so conflicts arrive in small doses. Before editing a hot file, tell the team. When resolving, understand both sides' intent — then run the full test suite against the merged result, because a clean merge is not a correct merge.
**Pitfalls:** Blindly accepting "ours" or "theirs." Resolving without running tests. Giant week-old branches. Unnecessary conflicts from editing generated files and lockfiles by hand.
**Rules:** MUST run the test suite after every conflict resolution. MUST sync feature branches with main frequently. NEVER resolve a conflict in code you don't understand without the other author.

## 7.12 Compliance & Business Realities

### #232 — GDPR
**What:** The EU's data-protection law governing personal data of people in the EEA; it applies to any service with EU users, wherever the company is based.
**Why it matters:** Article 83 fines reach €20M or 4% of global annual turnover (whichever is higher) for core violations — no lawful basis, denied data-subject rights — and €10M/2% for procedural failures. Meta was fined €1.2B. Regulators can also order processing stopped entirely.
**Techniques & methods:** Record a lawful basis for every data use; build data-subject rights into the product (access/export under Art. 20, erasure under Art. 17); keep a processing register and signed DPAs with every subprocessor; run the 72-hour breach-notification clock (Art. 33) from discovery, not confirmation.
**Pitfalls:** Treating consent as the only lawful basis; forgetting that your SaaS vendors are processors in scope; building deletion for the main database but not backups, logs, or analytics.
**Rules:** MUST ship export/delete-by-user-ID from day one. MUST notify breaches within 72 hours. NEVER collect personal data with no stated purpose.

### #233 — PII Handling
**What:** The discipline of identifying, classifying, and protecting personally identifiable information across its whole lifecycle — collection, storage, use, sharing, deletion.
**Why it matters:** PII is what breaches, fines, and lawsuits are made of. In practice, most leaks come from logs, analytics exports, and support tools — not the primary database everyone hardened.
**Techniques & methods:** Maintain a data inventory with classification tiers (public / internal / confidential / restricted); collect the minimum fields the feature needs; encrypt in transit and at rest; tokenize or mask PII outside production; set retention periods and automate deletion.
**Pitfalls:** Logging full request bodies containing emails and tokens; cloning the production database into staging "for debugging"; PII in URLs, error reports, and third-party analytics events.
**Rules:** MUST classify data before storing it. NEVER log raw PII or place it in URLs. SHOULD use synthetic or anonymized data in every non-production environment.

### #234 — Audit Logs
**What:** An append-only record of security- and business-critical events: who did what to which resource, when, from where, with what outcome.
**Why it matters:** Without audit logs you cannot investigate incidents, prove who changed or deleted data, win disputes, or pass SOC 2. They are the evidence — for forensics, regulators, and customers alike.
**Techniques & methods:** Emit structured events (actor, action, resource, timestamp, IP, outcome) for auth, permission changes, data exports, and admin actions; write them to append-only or WORM storage separate from the application database; hash-chain entries or ship them to a SIEM for tamper-evidence; keep clocks NTP-synced.
**Pitfalls:** Logs the application itself can edit or delete; recording secret values or full PII payloads instead of metadata; logging only successful actions, never failures.
**Rules:** MUST log authentication events, privilege changes, exports, and destructive actions. NEVER let application credentials modify or delete audit records. SHOULD alert on anomalous patterns (bulk export, off-hours admin access).

### #235 — Data Residency
**What:** Legal or contractual requirements that specific data be stored and processed within a defined geographic region.
**Why it matters:** GDPR Chapter V restricts transfers out of the EEA (adequacy decisions or SCCs required); China, Russia, and sectoral Indian rules mandate localization. Enterprise contracts routinely demand region pinning — violating any of these can trigger fines and void deals.
**Techniques & methods:** Pin deployments, databases, and storage buckets per region; route users to their home region; keep backups and disaster recovery in-region; maintain a transfer register and SCCs covering every subprocessor that can touch the data.
**Pitfalls:** A global CDN, analytics tool, or error tracker quietly replicating data worldwide; support staff in another country viewing records (that is a transfer); residency solved for the database, forgotten for backups and logs.
**Rules:** MUST know where every copy of regulated data lives, including backups and logs. NEVER move personal data to a new region or vendor without a transfer assessment.

### #236 — SOC 2
**What:** An AICPA attestation report on your controls across the Trust Services Criteria — Security (mandatory), plus Availability, Confidentiality, Processing Integrity, and Privacy as scoped.
**Why it matters:** Enterprise procurement gates purchases on it: no report, no deal. Type I attests controls are *designed* correctly at a point in time; Type II attests they *operated effectively* over a 3–12 month observation window — Type II is what buyers actually require.
**Techniques & methods:** Implement controls early (MFA everywhere, access reviews, change management, vendor reviews, background checks); collect evidence continuously and automatically; start the observation clock as soon as controls run, not when the auditor arrives.
**Pitfalls:** Calling it a "certification" (it is an attestation, not pass/fail); bolting controls on the month before the audit — there is no evidence history to sample; scoping out the systems customers actually care about.
**Rules:** MUST run controls from day one of the observation window. NEVER promise a Type II report in under three months. SHOULD automate evidence collection from the systems that generate it.

### #237 — PCI DSS
**What:** The payment-card industry security standard for anyone storing, processing, or transmitting cardholder data, validated via Self-Assessment Questionnaires (SAQ) or a QSA audit depending on scope.
**Why it matters:** The SAQ type is set by how card data touches your systems. SAQ A is a short form; SAQ D runs to ~300 requirements. Non-compliance after a breach means fines, forensic costs, and potentially losing card acceptance.
**Techniques & methods:** Keep card data off your servers entirely — processor-hosted fields or redirect checkout (Stripe Checkout, Adyen Drop-in) drops most merchants into SAQ A scope; tokenize everything; segment any system that must touch payment data.
**Pitfalls:** Believing "we use Stripe" while a custom form posts raw card numbers through your backend (that is SAQ A-EP or D scope); PANs turning up in logs; storing CVV or magnetic-stripe data after authorization — prohibited outright.
**Rules:** MUST use processor-hosted payment surfaces unless you can genuinely fund SAQ D. NEVER store, log, or transmit raw card numbers or post-authorization sensitive authentication data.

### #238 — Cookie Consent
**What:** The ePrivacy/GDPR requirement of prior, informed, freely given consent before setting any non-essential cookie or tracker.
**Why it matters:** Regulators fine dark patterns — the CNIL fined Google and Facebook over asymmetric reject buttons — and the CJEU's *Planet49* ruling made pre-ticked boxes invalid consent. Fines aside, banners that fire trackers pre-consent are trivially detectable.
**Techniques & methods:** Use a consent platform that actually blocks analytics/ads until consent; give Accept and Reject equal prominence; offer granular categories (necessary / analytics / marketing); store the consent record; re-prompt when purposes change.
**Pitfalls:** A banner that is decoration — cookies set before the click; Reject buried three layers deep; consent walls blocking all access; forgetting that mobile-app SDKs and embedded players set identifiers too.
**Rules:** MUST NOT load non-essential trackers before consent. MUST make rejecting as easy as accepting. NEVER pre-tick optional categories or treat scrolling as consent.

### #239 — Software Licenses
**What:** The legal terms (MIT, Apache-2.0, GPL, AGPL, SSPL, and hundreds more) attached to every dependency and snippet you ship.
**Why it matters:** Copyleft can force disclosure of your source code; AGPL triggers on *network use* — the classic SaaS trap. License violations surface in acquisition diligence and get products pulled.
**Techniques & methods:** Scan all dependencies in CI (ScanCode, FOSSA, license-checker); maintain an SBOM; enforce an allowlist — permissive licenses by default; review transitive dependencies, not just the ones you chose directly.
**Pitfalls:** Assuming "on npm/PyPI" means free to use; pasting code from a GPL project into a proprietary product; embedding an AGPL database or tool inside a closed SaaS.
**Rules:** MUST fail CI on unapproved copyleft in shipped code. NEVER paste code of unknown provenance. SHOULD keep a current license inventory ready for customer diligence.

### #240 — SPF, DKIM & DMARC
**What:** Email authentication: SPF lists which servers may send for your domain, DKIM cryptographically signs messages, DMARC tells receivers how to handle failures and reports back to you.
**Why it matters:** Without all three, anyone can spoof your domain for phishing and your legitimate mail lands in spam. Google and Yahoo *require* all three for bulk senders — deliverability is now an authentication problem.
**Techniques & methods:** Publish one SPF record (respect the 10 DNS-lookup limit); sign with 2048-bit DKIM keys; roll DMARC out p=none → quarantine → reject while checking alignment; separate transactional and marketing mail onto different subdomains so one reputation can't sink the other.
**Pitfalls:** Two SPF records (invalidates both); DMARC parked at p=none forever — monitoring only, zero protection; adding a new email vendor and silently breaking SPF/DKIM.
**Rules:** MUST have all three records, at enforcement (p=reject), on every sending domain. MUST monitor DMARC aggregate reports. NEVER launch a new email vendor without updating all three.

### #241 — Email Bounce Handling
**What:** Systematically processing delivery failures — hard bounces (5xx: address does not exist), soft bounces (4xx: temporary), and spam complaints — and acting on each correctly.
**Why it matters:** Mailing dead addresses destroys sender reputation. Providers enforce limits (keep bounces under ~2%, complaints under ~0.1–0.3%); breach them and you face throttling, suspension, or domain blocklisting — your password resets stop arriving too.
**Techniques & methods:** Consume bounce/complaint webhooks (SES, SendGrid) in real time; permanently suppress hard bounces and complainers in a suppression list checked before *every* send; retry soft bounces with backoff and suppress after repeated failures; sunset chronically unengaged recipients.
**Pitfalls:** Re-importing an old list and re-mailing suppressed addresses; ignoring complaint feedback loops; a bounce pipeline that fails silently so the list rots while dashboards look clean.
**Rules:** MUST suppress hard bounces and complaints on first occurrence. MUST check the suppression list on every send. NEVER buy or scrape mailing lists.

### #242 — Chargebacks
**What:** Cardholder disputes that forcibly reverse a payment through the issuer: you lose the sale amount, the product, and a dispute fee (Stripe charges $15 per dispute in the US, win or lose).
**Why it matters:** Your dispute ratio is scored by the networks. Visa's VAMP program flags excessive merchants (~1.5%, tightening to 0.9%); Mastercard's ECM starts at 1.5% with 100+ disputes/month. Consequences: fines, reserves, and losing card acceptance. Stripe reviews and closes accounts around 0.9%.
**Techniques & methods:** Prevention beats fighting: clear statement descriptor customers recognize, easy refunds and self-serve cancellation, fraud screening (Radar, 3-D Secure), and refunding on Early Fraud Warnings before they convert (~80% do). Contest winnable disputes with compelling evidence — expect a ~30–40% win rate.
**Pitfalls:** An unrecognizable billing descriptor causing "friendly fraud"; dark-pattern cancellation that pushes users to their bank instead; ignoring fraud warnings; ratio spikes in low-volume months.
**Rules:** MUST monitor the dispute rate weekly, alerting well below 0.9%. MUST make refunding easier than disputing. NEVER make cancellation harder than signup.

### #243 — Bot Protection
**What:** Distinguishing automated abuse — credential stuffing, scraping, card testing, fake signups — from real users, and stopping it without punishing humans.
**Why it matters:** Bots drive fraud losses, chargebacks, and infrastructure cost, and they poison your analytics. A card-testing attack can spike your dispute rate and processor risk flags overnight.
**Techniques & methods:** Layer defenses: per-IP/account/device rate limits; risk-triggered challenges (Turnstile, hCaptcha) rather than always-on CAPTCHAs; WAF bot rules; honeypot fields; device fingerprinting; velocity checks on sensitive endpoints like login, signup, and checkout.
**Pitfalls:** CAPTCHA on every page (kills conversion; solvers defeat it anyway); blocking whole countries or all VPN traffic and locking out real customers; armoring login while leaving signup and password reset wide open; dismissing a 200-requests-per-minute script as a "power user."
**Rules:** MUST rate-limit and be able to challenge auth, signup, and payment endpoints. SHOULD escalate friction by risk score, not blanket-block. NEVER rely on a single detection signal.


## 7.13 AI Engineering

### #244 — Prompt Injection
**What:** Attacker-controlled instructions hidden in user input — or in content the model reads, like web pages, documents, and emails — that hijack an LLM into following them. It is LLM01 in the OWASP Top 10 for LLM Applications (2025).
**Why it matters:** A successful injection can exfiltrate data, leak the system prompt, or trigger unauthorized tool calls. OWASP is blunt: there is no foolproof prevention, because models have no reliable channel separating instructions from data.
**Techniques & methods:** Design for containment, not perfect filtering: least-privilege tools and data per task; treat all model output as untrusted and validate it before anything executes; require human approval for sensitive or irreversible actions; break Simon Willison's "lethal trifecta" — private-data access, untrusted content, and external communication must never coexist in one agent.
**Pitfalls:** Believing a system prompt ("never reveal X") is a security boundary; giving an agent broad tool permissions "temporarily"; letting retrieved content trigger actions unreviewed.
**Rules:** MUST scope agent permissions to the immediate task. MUST gate destructive or external actions behind human confirmation. NEVER place secrets in prompts or retrievable context.

### #245 — Hallucinated Packages
**What:** LLMs invent plausible-sounding package names that don't exist. Attackers register those names with malware — an attack called **slopsquatting**.
**Why it matters:** A USENIX Security 2025 study of 576,000 generated code samples found 19.7% of recommended packages were hallucinated (5.2% for commercial models, 21.7% for open-source), and 43% of the fake names repeated across runs — so attackers can predict and pre-register them. One install can exfiltrate CI credentials via postinstall scripts.
**Techniques & methods:** Verify every AI-suggested package actually exists and is the canonical one (download counts, maintainer history, linked repo); install with scripts disabled where feasible (`--ignore-scripts`); pin versions, commit lockfiles, and audit (`npm audit`, `pip-audit`, Socket, Snyk); keep an allowlist of approved dependencies.
**Pitfalls:** Copy-pasting install commands straight from chat output; assuming a successful install means a safe one; conflated names that mash two real packages together.
**Rules:** MUST verify existence and provenance before adding any dependency. NEVER install a package solely because a model suggested it. SHOULD prefer the standard library and established libraries.

### #246 — Real-Time Streaming
**What:** Delivering LLM output token-by-token to the user — usually via Server-Sent Events or fetch streaming — instead of waiting for the complete response.
**Why it matters:** Time-to-first-token is the latency users actually feel. A 20-second generation with no streaming feels broken; streamed, it feels instant. Streaming also introduces partial-failure and cancellation behaviour you must engineer, not discover in production.
**Techniques & methods:** Use SSE for one-way token streams (simple, auto-reconnecting); pass the provider stream through your server without buffering — disable proxy/CDN buffering on the route; on client disconnect, abort the upstream request so you stop paying for tokens nobody will read; render with a markdown parser that tolerates incomplete input.
**Pitfalls:** An intermediary buffering the whole stream so it arrives in one chunk anyway; no abort handling, so abandoned generations bill you in full; persisting half-finished messages as if final; parsing streamed structured output before it is complete.
**Rules:** MUST cancel upstream generation on client disconnect. MUST mark streamed responses explicitly complete or incomplete. SHOULD measure and budget time-to-first-token separately from total latency.

### #247 — Context Windows
**What:** The fixed token budget a model can attend to in one request — system prompt, conversation history, retrieved documents, and the output all compete for the same space.
**Why it matters:** Exceed the window and requests fail or silently truncate. Well before the limit, quality degrades: models under-use information buried mid-context ("lost in the middle"). Context size is also your main cost and latency lever.
**Techniques & methods:** Set an explicit token budget per component (system / history / retrieval / output); place critical instructions at the start or end; retrieve with RAG instead of stuffing documents; summarize or compact long histories; cache stable prompt prefixes; chunk documents with overlap for retrieval.
**Pitfalls:** Concatenating the entire chat history forever; dumping whole codebases "just in case"; assuming a 1M-token window means 1M tokens of comprehension; forgetting the response itself consumes window.
**Rules:** MUST track token usage per request. SHOULD design for the smallest sufficient context. NEVER rely on the model finding a critical instruction buried in the middle of a huge prompt.

### #248 — Evals
**What:** Systematic measurement of AI output quality — curated test sets with expected outputs, scored by exact checks, programmatic validators, LLM judges, or humans. Unit tests for non-deterministic systems.
**Why it matters:** Without evals, every prompt tweak and model upgrade is a gamble: you cannot detect regressions, compare models, or even prove the feature works. "It looked good when I tried it" does not survive the second model release.
**Techniques & methods:** Build a golden dataset from real (anonymized) production traffic with expected outputs; use deterministic validators wherever the answer is checkable, LLM-as-judge with an explicit rubric where it isn't; run evals in CI on every prompt or model change; track quality alongside cost and latency; continuously sample production outputs for human review.
**Pitfalls:** A five-example eval set of easy, hand-picked cases; a judge model that shares the generator's blind spots; optimizing against the eval until it stops representing reality; changing the prompt with no baseline to compare against.
**Rules:** MUST maintain a regression eval set before shipping prompt changes. MUST re-run evals before any model version change. SHOULD log production traces as raw material for future evals.

### #249 — Model Version Pinning
**What:** Deploying against an exact, dated model snapshot (e.g. `provider-model-2026-01-15`) instead of a floating alias like "latest."
**Why it matters:** Providers update aliases silently: formatting, refusal behaviour, and tool-calling reliability shift overnight, breaking prompts tuned to the old behaviour. An unpinned production system is an unplanned migration every few weeks — discovered by your users.
**Techniques & methods:** Pin full version IDs in configuration, not code; stage upgrades by running the eval suite plus shadow or canary traffic on the new version before switching; keep the previous version one config flip away for instant rollback; subscribe to provider deprecation notices, because snapshots are retired on a schedule.
**Pitfalls:** Developing and shipping against "latest"; upgrading the model and the prompt in the same release — two variables changed, no way to attribute a regression; missing a forced deprecation and erroring in production.
**Rules:** MUST pin exact model versions in production. MUST pass the full eval suite before promoting a new version. NEVER change model and prompt in the same release.

### #250 — Reading the Maxed LOC Diff
**What:** The discipline of genuinely reviewing very large AI-generated changesets — thousands of lines — instead of rubber-stamping them because "the agent wrote it and CI is green."
**Why it matters:** Review quality collapses as diff size grows, and defects hide in bulk. Large agent diffs smuggle in unrelated refactors, silent behaviour changes, hallucinated APIs, dead code, and quietly weakened tests. Approving unread code makes you the author of bugs you never saw.
**Techniques & methods:** Demand small diffs up front — split the task before generation; treat anything over roughly 400 changed lines as a smell. Review in layers: file list first (any surprise files?), then interfaces and types, then logic, then the tests — did any test get weaker, skipped, or deleted? Have the agent summarize and self-review its own diff, then spot-check its claims against the actual lines. Run the app, don't just read it.
**Pitfalls:** "LGTM" on 3,000 lines; trusting green CI when the agent edited the tests too; reading top-to-bottom and fatiguing before the one file that mattered; accepting drive-by refactors bundled in with the fix.
**Rules:** MUST cap diff size per task and split larger work. MUST inspect every file in the changeset — no surprise files. NEVER approve a diff you have not read, no matter who or what wrote it.

---

# Appendix A — Mumbai University B.Sc. Computer Science: full subject list
*Official NEP 2020 syllabus, 75 courses across 8 semesters (R.D. National College follows this; minor college-level variations possible).*

**Semester I (9):** Digital System and Architecture · Fundamentals of Database Systems · CS Practical 1 · Intro to Programming with Python · Statistics with R Programming · Linux Operating System · Communication Skills in English I · Entrepreneurship Management · Indian Constitution

**Semester II (6):** Design and Analysis of Algorithms · Intro to OOP using C++ · CS Practical 2 · Web Technologies · DBMS using PL/SQL · Advanced Python Programming

**Semester III (7):** Principles of Operating Systems · Theory of Computation · Data Structures · CS Practical 3 · Java Programming · Hindi Language: Practical Usage · Psychology of Digital Influence

**Semester IV (10):** Computer Networks · Software Engineering · IoT Technologies · CS Practical 4 · Mobile Application Development · MEAN Stack Development · Minor (data-science track: Python / Scala / Advanced Python / SAS-SPSS-R)

**Semester V (10):** Artificial Intelligence · Cyber and Information Security · IKS in Computational Systems · CS Practical 5 · Mini Project I (real-world app) · Ethical Hacking · Electives: Software Testing & QA or Wireless & Sensor Networks (+ practicals)

**Semester VI (9):** Data Science · Cloud Computing · Software Project Management · CS Practical 6 · Mini Project II (research) · Electives: Information Retrieval or Linux Server Administration (+ practicals)

**Semester VII — Hons (12):** Applied Signal & Image Processing (+ PR) · Software Defined Networking (+ PR) · Principles of Compiler Design · Research Methodology · Electives: NoSQL Technologies / Robotics / UI-UX Design (+ PR)

**Semester VIII — Hons (12):** Machine Learning (+ PR) · Natural Language Processing (+ PR) · Simulation and Modelling · On-Job Training · Electives: Bioinformatics / Embedded & IoT / Web Data Analytics (+ PR)

# Appendix B — Where the world's best learn this (curriculum map)
*Representative courses consulted while writing this book (all verified against official course pages during research). Read across a row to see where each part's knowledge is taught at its best.*

- **Foundations (Part 1):** MIT 6.006 Introduction to Algorithms · MIT 6.031 Software Construction · Stanford CS106B / CS107 · IIT Bombay CS core (CS101, CS213)
- **Web (Part 2):** Stanford CS142 Web Applications · Harvard CS50 Web · MIT 6.813/6.831 HCI & web labs
- **Mobile (Part 3):** Stanford CS193P Developing Apps for iOS · Harvard CS50 Mobile (React Native) · MIT Mobile Application Experiences
- **Architecture (Part 4):** MIT 6.031/6.1020 Software Construction · Stanford CS190 Software Design (Ouster) · CMU 17-214/17-313 Software Engineering
- **Data, DevOps, Security (Part 5):** MIT 6.824 Distributed Systems · Stanford CS144 Networking / CS245 Databases · CMU database & systems courses
- **AI & Games (Part 6):** Stanford CS231n / CS224n · MIT 6.036 Machine Learning · CMU 15-466 Computer Game Programming

*Full topic-level MU syllabus: `workspace/syllabus/mumbai-univ-bsc-cs-syllabus.md` (3,871 lines, 75 courses).*
