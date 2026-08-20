# Backend Spec: Per-Pact Weekly Activity Metric

**Owner:** Backend team (`pact_project_backend_v2`, separate repo — not in
this frontend repo)
**Status:** Not implemented. Frontend currently ships a client-side
approximation described below.
**Requested by:** Pacts landing page (`/pacts`) "Most active" stat.

## Why this is needed

The Pacts landing page (`/pacts`) shows a unified stat card — Active / Win
rate / Most active — mirroring the existing Circles and Dares landing page
stat cards. "Most active" is meant to surface the pact in the user's list
that currently has the most real engagement (proof submissions, cheers,
comments) recently, similar to how Circles' "Active this week" and Dares'
"Accepted"/"Completed" cells summarize genuine backend-driven activity.

There is currently **no backend field that represents this** — no
per-pact "activity this week" score, no timestamp-scoped counts.

## Current frontend approximation (shipped, not authoritative)

`src/app/pacts/page.tsx` computes a `mostActivePact` by scoring every pact
in the user's list as:

```
score = (pact.proof_count ?? 0) + (pact.active_cheer_count ?? 0)
```

and picking the highest-scoring pact. Both `proof_count` and
`active_cheer_count` are fields already returned on pact objects elsewhere
in this app (see `FeedPactCard.tsx`, `PactProgressRing.tsx`), so this reuses
real data — but it is a **lifetime total, not a "this week" or "trending"
signal**, and it has no time decay. A pact that was extremely active a
month ago and has since gone quiet will still outrank a pact that just
became active today. This is explicitly called out as an approximation in
the code comment above the computation.

## Requested backend addition

Add a per-pact activity score to the response of whatever endpoint backs
`pactAdvancedService.getMyPacts()` (currently `GET
/api/pacts/mine` or equivalent — confirm exact route in the backend repo).
Suggested field: `activity_score_7d` (number), computed server-side as a
weighted, time-boxed count of:

- Proof submissions in the last 7 days
- Cheers received in the last 7 days
- Comments received in the last 7 days (if/when comments exist as a
  first-class model)

Exact weighting is a product decision, not a frontend one — the frontend
just needs a single sortable number scoped to a recent, rolling window
instead of an all-time total.

## Frontend follow-up once this ships

Replace the `score = proof_count + active_cheer_count` computation in
`src/app/pacts/page.tsx` with `pact.activity_score_7d`, and remove the
approximation comment. No UI change needed — the stat card already renders
whichever pact wins the sort.
