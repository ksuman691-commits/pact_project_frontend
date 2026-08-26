# Backend spec: expose `comment_count` on `PactResponse`

**STATUS: NOT YET IMPLEMENTED.** Frontend has a graceful fallback in place
(see bottom) — the chat icon badge and "Chat · N" header show `0`/the
lazily-fetched live count until this ships, then automatically show the
correct count everywhere with no further frontend changes needed.

## Root cause

The chat/comment count shown next to the feed card's chat icon (and in the
"View all N in chat" / bottom-sheet header) always reads `0` from the feed
and detail list responses. This isn't a missing-column problem — it's a
serialization gap:

```python
# app/models/entities.py (or wherever Pact is defined) — the column
# already exists and is already kept up to date:
pact.comment_count = int(pact.comment_count or 0) + 1   # app/api/pacts.py:1311, on every new comment

# app/api/pacts.py:538 — even used server-side in a feed sort-score expression:
+ func.coalesce(Pact.comment_count, 0)
```

But neither of the two dict-building functions that turn a `Pact` row into
the response payload actually include it:

- `_serialize_pact` (single-pact path, around line 470-509) builds `support_count`,
  `proof_count`, `active_cheer_count`, etc. from fresh queries, but never adds
  `"comment_count": pact.comment_count or 0`.
- The feed batch-serialization loop (around line 658-694, same file) has the
  same omission in its per-pact `results.append({...})` dict.

And `PactResponse` in `app/schemas/pacts.py` has no `comment_count` field to
receive it even if the dict did include it.

## Change

**File: `app/schemas/pacts.py`**, on `PactResponse`, alongside the other
count fields:

```python
proof_count: int = 0
comment_count: int = 0   # NEW — mirrors the already-maintained Pact.comment_count column
active_cheer_count: int = 0
```

**File: `app/api/pacts.py`**, add one line to each of the two payload dicts:

- In `_serialize_pact`'s `payload = {...}` (around line 501, next to `"proof_count": proof_count,`):
  ```python
  "comment_count": pact.comment_count or 0,
  ```
- In the feed batch loop's `results.append({...})` (around line 691, next to `"proof_count": proof_counts.get(pact.id, 0),`):
  ```python
  "comment_count": pact.comment_count or 0,
  ```

No new query is needed for either path — `pact.comment_count` is already a
column on the already-loaded `Pact` row, unlike `support_count`/`proof_count`
which need separate aggregate queries.

## Why this shape

- Reuses an already-correct, already-incrementing column — this is a pure
  serialization fix, not a new counter or migration.
- Matches the existing `proof_count`/`active_cheer_count` naming and
  placement convention on `PactResponse`.

## Frontend: already wired, no change needed once this ships

`FeedPactCard.tsx` already reads `pact.comment_count` first (falling back to
a live count from the open chat sheet, then to `0`) — the moment this field
starts coming back from the API, the chat icon badge is accurate immediately
on every card, without ever having to open the sheet first.
