# Research findings

**Status:** research complete for the current sourcing decision  
**Last verified:** 2026-09-15

## Decision

Do not implement the requested bulk YouTube discovery, channel/contact storage, or outreach pipeline. The reviewed LeadMiner workbook confirms that the prior design would collect and retain channel metadata, descriptions, and extracted contacts across many unrelated channels. That does not remove the current YouTube policy restriction; it makes the conflict more direct.

## YouTube Data API policy impact

YouTube's Developer Policies state that API clients must not aggregate YouTube API Data except for channels under the same recognized content owner. They also require non-authorized API Data to be deleted or refreshed within 30 calendar days.

The legacy `lead` sheet contains exactly the type of cross-channel record set that must not become a production lead database: channel IDs, titles, subscriber/video counts, descriptions, and extracted email data. It contains no per-record collection time or source-provenance record, so the workbook cannot demonstrate a compliant freshness posture.

No workaround is approved. Do not split activity across multiple Google projects, scrape to replace the API, or treat old data as an exemption.

## Confirmed future-architecture constraints

- YouTube currently gives `search.list` its own default 100-calls-per-day bucket at 1 unit per call. `channels.list` costs 1 unit, and other endpoints share the default 10,000-unit daily allocation. Daily quotas reset at midnight Pacific Time.
- Gmail push reply monitoring uses Cloud Pub/Sub and mailbox watches must be renewed at least once every seven days.
- A Google OAuth app left in Testing expires its refresh tokens after seven days for Gmail scopes. Production server-side access to restricted Gmail data can require verification and a security assessment unless an exception applies.
- Vercel Hobby is restricted to non-commercial use and is not an appropriate host for this commercial agency system.

These constraints remain useful only after a compliant prospect source has been selected. They do not authorize the blocked YouTube acquisition model.

## Approved next direction & compliant alternatives research

As documented in [COMPLIANT_SOURCING_ALTERNATIVES.md](COMPLIANT_SOURCING_ALTERNATIVES.md), research was conducted to evaluate compliant, zero-to-low-cost alternatives that maximize reuse of the 23-category / 25,391-keyword LeadMiner taxonomy without using prohibited bulk YouTube API aggregation or scraping.

The recommended best path forward is a **3-Tier Compliant Architecture**:
1. **Tier 1 (Core Automated Engine — $0 / month):** Open podcast syndication feeds via **PodcastIndex.org API** matching podcasters, business coaches, finance influencers, and entrepreneurs. Extracting public `<itunes:owner><itunes:email>` and show links directly from open RSS standards.
2. **Tier 2 (Secondary Automated Engine — $0 to $5 / month):** Open web creator footprint discovery via **Brave Search API** ($5/mo free credit, 1,000 free queries/mo) using targeted Boolean queries targeting public Linktree, Beacons, Substack, and personal creator portfolios for streamers, YouTubers, gaming, and anime categories.
3. **Tier 3 (Quality & Governance Gate):** Human-in-the-Loop (HITL) staging review table ensuring 100% human-verified provenance, DNS/MX deliverability checks, and suppression/opt-out compliance before outreach queues are populated.

The future design must independently confirm applicable outreach obligations, including an actionable suppression/opt-out mechanism, before any sending capability is built.

## Sources

- [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies) — accessed 2026-09-15
- [YouTube Data API quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost) — accessed 2026-09-15
- [Gmail API push notifications](https://developers.google.com/workspace/gmail/api/guides/push) — accessed 2026-09-15
- [Google restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification) — accessed 2026-09-15
- [Google OAuth app audience](https://support.google.com/cloud/answer/15549945) — accessed 2026-09-15
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) — accessed 2026-09-15
