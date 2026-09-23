# LeadMiner — Deferred Decisions & Ignored Items
# These were explicitly deprioritized by the owner. Do not implement without explicit instruction.

## Deferred by Owner

### YouTube 30-day Data Refresh/Delete (P2-32)
- **Issue:** YouTube API ToS requires stored API data to be refreshed or deleted within 30 days.
- **Owner decision:** Ignore for now.
- **When to revisit:** Before any significant scale-up or before opening to other users.
- **Risk:** ToS violation. Low immediate risk for a single-user system.

### Non-YouTube Lead Source / Adapter (P2-33)
- **Issue:** Single-source dependency on YouTube. If YouTube blocks or changes API, discovery stops.
- **Owner decision:** V2 scope only. Not touching in V1.
- **When to revisit:** When V1 is fully stable and V2 architecture begins.

### GDPR Delete-My-Data Path (P3-12)
- **Issue:** No way for a lead to request deletion of their data.
- **Owner decision:** Not prioritized.
- **When to revisit:** If operating in EU or when GDPR compliance is needed.

## Rejected Audit Findings (do not re-open)

These were rejected by the Chief Architect as speculation or misreads:

1. "Pipeline only sends 2 emails" — per-tick batch size, not a bug
2. "Phi capacity model is overbuilt" — design preference, not evidence of harm
3. (9 others per Chief Architect's final merge)
