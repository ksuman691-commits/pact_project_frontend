# Backend Spec: Per-Dare Recipient Status Aggregate (for dares the viewer sent)

**Owner:** Backend team (`pact_project_backend_v2`, separate repo — not in
this frontend repo)
**Status:** Not implemented. Frontend currently ships a scoped-down,
honest stat described below (previously showed a misleading count — see
"Bug found" section).

**Requested by:** Dares landing page (`/dares`) "Accepted"/"Completed"
stats, and the "Sent by You" tab.

## Bug found while investigating a stat/list mismatch

The "Accepted" stat card showed a count (e.g. 5) that didn't match any
card visible under the "Sent by You" tab, which all showed "Pending" (in
fact "Expired" — see the separate status-pill fix). Root cause:

`src/app/dares/page.tsx` computed:

```
acceptedCount = mineAll.filter(d => d.my_recipient_status === 'accepted' || d.status === 'accepted').length
```

The `dare.status === 'accepted'` half of this OR was dead code. Per the
backend (`app/api/dares.py`, `accept_dare`/`decline_dare`), accepting or
declining a dare only ever writes to the per-recipient `DareRecipient.status`
row — it never touches the top-level `Dare.status` field. So for a dare
the viewer created and sent to someone else, there is **no field in the
`GET /api/dares/mine` response that reflects whether that recipient
accepted, declined, or completed it.** `dare.status` stays whatever it was
set to at creation (observed live as always `pending`).

Practical effect: "Accepted"/"Completed" on this page can only ever count
dares sent **to** the viewer that the viewer personally responded to
(`my_recipient_status`). A dare the viewer sent that was accepted by its
recipient(s) contributes 0 to either stat, and there is no way to show it
in the "Sent by You" tab either, for the same reason.

## Current frontend fix (shipped, not a full fix)

- Removed the dead `dare.status === 'accepted'/'completed'` fallback —
  the stats are now honestly scoped to `my_recipient_status` only, with a
  code comment explaining why.
- Clicking "Accepted"/"Completed" now navigates to `/dares?status=accepted`
  or `?status=completed`, which shows exactly the dares included in that
  count (so the number and the visible list can never disagree again).
- "Sent by You" no longer implies acceptance progress at all — it just
  lists the dares the viewer created, since that's the only property this
  endpoint response can support today.

## Requested backend addition

Add a per-dare recipient-status aggregate to the `GET /api/dares/mine`
(and ideally `GET /api/dares/{id}`) response, computed server-side from the
`DareRecipient` rows for that dare. Suggested fields on each dare object:

- `recipient_status_counts`: `{ pending: number, accepted: number, declined: number, completed: number, failed: number }`

This lets the frontend show real progress on dares the viewer sent (e.g.
"2 of 3 accepted") instead of nothing, and lets "Accepted"/"Completed" on
this page include the sent-dare side without an N+1 fetch of
`/api/dares/{id}/recipients` per dare in the list.

## Frontend follow-up once this ships

- "Sent by You" cards can show `recipient_status_counts` inline (e.g. a
  small "2/3 accepted" chip) instead of nothing.
- `acceptedCount`/`completedCount` on `/dares` can add
  `sum(dare.recipient_status_counts.accepted)` for dares the viewer
  created, and the `?status=accepted`/`?status=completed` filtered views
  can include those dares (currently they can't, for the reason above).
