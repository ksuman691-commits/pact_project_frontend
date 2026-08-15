# Backend Handoff: Cheer Deduplication

**Owner:** Backend team (`pact-project-backend-v2`, separate repo — not in this
frontend repo)
**Status:** Confirmed root cause, fix not yet implemented server-side
**Reported symptom:** Same user "cheering" the same pact generated 4 duplicate
notifications in ~1 hour.

## Root cause (confirmed by live testing against production API)

`POST /api/pacts/{pact_id}/cheers` has **no uniqueness constraint**. The same
authenticated user can call it an unlimited number of times on the same pact,
and every call succeeds with `201 Created` and inserts a new `cheers` row.

Reproduction (against `https://pact-project-backend-v2.onrender.com`):

```
POST /api/pacts/38/cheers  (user 33, file A) -> 201, cheer id 11
POST /api/pacts/38/cheers  (user 33, file A) -> 201, cheer id 12
POST /api/pacts/38/cheers  (user 33, file A) -> 201, cheer id 13
POST /api/pacts/38/cheers  (user 33, file A) -> 201, cheer id 14

GET /api/notifications (as pact creator) -> 4 notifications,
  all type "friend_activity", all message "New cheer",
  timestamps 16:39:35 / :51 / :52 / :54
```

Each `POST /cheers` call correctly creates exactly one `friend_activity`
notification (verified 1 cheer → 1 notification, 4 cheers → 4 notifications).
**Notification creation is not the bug** — there is no separate
duplicate-firing/dedup issue in the notification pipeline. The entire
symptom is explained by the missing per-user-per-pact limit on cheers.

## Why this matters beyond notification spam

Cheer count is displayed as a trust/engagement signal (`CheerGallery`,
`Cheers (N)` count). With no limit, any single participant can inflate that
count arbitrarily by re-submitting the same or different photos — the same
risk class as the earlier auth gap (a control meant to reflect real distinct
user actions has no server-side enforcement behind it).

## Comparison: `vote` already does this correctly

`POST /api/pacts/{pact_id}/vote` already implements proper per-user
upsert semantics — voting twice with the same `vote` value does **not**
create a second row (verified: 2x `{"vote":"believe"}` in a row → the
`/votes` list still shows exactly one row for that user, updated in place).
**Reuse this same pattern for cheers** — do not design a new mechanism.

## Product decision (confirmed with the user, do not re-litigate)

Cheers are **not permanent**. A user may have at most **one active cheer per
pact at a time**, but they can remove it and send a new one later (like a
like/unlike toggle, not a one-shot permanent action). This is a deliberate
choice — it is a larger scope than "just block duplicates," because it
requires a delete endpoint that does not exist today.

## Required backend changes

### 1. Unique constraint
Add a unique constraint/index on `cheers(pact_id, sender_id)`. Enforce at
the DB level, not just in application code (the same lesson from the auth
gap — UI-only or app-only checks are not sufficient).

### 2. `POST /api/pacts/{pact_id}/cheers` — reject duplicates
If the authenticated user already has a cheer row for this pact, return
`409 Conflict` with a clear error body, e.g.:
```json
{ "detail": "You have already cheered this pact. Remove your existing cheer before sending a new one." }
```
Do not silently replace the existing row on POST — undo must be an explicit
action (see #3) so the "remove vs. re-send" distinction stays visible to the
user and auditable.

### 3. New endpoint: delete a cheer
Add `DELETE /api/pacts/{pact_id}/cheers/me` (preferred — no client-side
cheer ID lookup required) or `DELETE /api/cheers/{cheer_id}` with an
ownership check (403 if the caller is not the cheer's sender). Behavior:
- Hard-delete the row.
- Return `204 No Content` on success, `404` if the caller has no active
  cheer on that pact.
- Do **not** create a notification for a delete (deletes are silent).
- After a delete, the same user calling `POST .../cheers` again must
  succeed (the unique constraint from #1 is satisfied again).

### 4. Data cleanup for existing duplicates
Before adding the unique constraint, existing duplicate rows will violate
it. Migration should, per `(pact_id, sender_id)` group with more than one
row: keep the earliest `cheers` row, hard-delete the rest. This will also
retroactively fix cheer counts that are currently inflated by the bug.

Optional: no action required on existing duplicate `friend_activity`
notifications — they are historical and harmless (cosmetic backlog noise
in old inboxes), not worth a special migration.

### 5. Known test data created while verifying this
While reproducing the bug against the live API, the following test-only
rows were created and are safe to leave or purge as convenient:
- Pact id `34` ("Cold shower 7 days in 7 Days", creator `verifytester321`)
  — 4 duplicate cheer rows from user `lbtest1786810244`.
- Pact id `38` ("Notif dedup test pact", creator `notifcreator<ts>`,
  cheerer `notifcheerer<ts>`) — created purely for this investigation, 4
  duplicate cheer rows, 4 resulting notifications.

## Frontend status (this repo, already shipped)

A **non-authoritative UI guard** has been added ahead of the backend fix:
- `src/app/pacts/[id]/page.tsx` computes `hasCheered` from the already-fetched
  cheer list (`cheer.sender_id === currentUser.id`).
- `src/components/CheerButton.tsx` renders a disabled "Cheered" state once
  `hasCheered` is true, instead of the active "Send a cheer" button.

This stops honest double-taps from the app's own UI, which is the most
common real-world cause of the reported bug. It does **not** stop a second
device, a replayed request, or a modified client — that requires the
server-side constraint above. There is intentionally **no "undo cheer" UI
yet** in this frontend change, because there is no `DELETE` endpoint to call
— building that UI now would just 404. Once endpoint #3 ships, add:
- An "Undo cheer" affordance next to the disabled "Cheered" button.
- A mutation hook (`useDeleteCheer`, mirroring `useCreateCheer`) that calls
  the new `DELETE` endpoint and invalidates the same query keys
  (`queryKeys.pacts.cheers(pactId)`, `queryKeys.pacts.detail(pactId)`).

## Other notification types: risk audit

Checked whether other notification-producing actions share either failure
mode (missing per-user limit, or duplicate notification firing per event):

| Action | Per-user-per-pact limit enforced server-side? | 1 action → 1 notification? |
|---|---|---|
| Vote (believe/doubt) | Yes — upsert, verified live | Not applicable to this bug (upsert prevents repeat firing) |
| Cheer | **No — this bug** | Yes, 1:1 (not the bug) |
| Proof submission | Out of scope for this investigation — not tested | Out of scope |
| Comment | Out of scope for this investigation — not tested | Out of scope |

Proof submissions and comments were not exercised in this investigation and
should get the same live-API duplicate-submission test before being assumed
safe — recommend a follow-up pass.

## Verification checklist for the backend team

- [ ] Unique constraint added on `cheers(pact_id, sender_id)`
- [ ] Existing duplicate rows deduped in a migration before constraint rollout
- [ ] `POST /api/pacts/{pact_id}/cheers` returns `409` on a repeat call from
      the same user for the same pact
- [ ] `DELETE /api/pacts/{pact_id}/cheers/me` (or equivalent) added, returns
      `204`/`404` correctly, enforces ownership
- [ ] After delete, a subsequent `POST` from the same user succeeds again
- [ ] No notification is created on delete
- [ ] Cheer count displayed in the app now reflects distinct users only
