# Backend spec: multi-photo gallery on feed list endpoints

**STATUS: NOT YET IMPLEMENTED.** Frontend has a graceful fallback in place (see
bottom) — the feed hero shows exactly one photo (today's real behavior) until
this ships, then automatically shows the full swipeable gallery with no
further frontend changes needed.

## Root cause

The Feed's photo strip (swipe + dots) never had more than one photo to page
through, because the feed list response only ever includes a single most-recent
proof per pact:

```python
# app/schemas/pacts.py — PactResponse (used by the feed list endpoints)
proof_url: str | None = None
proof_type: ProofType | None = None
latest_proof_caption: str | None = None
latest_proof_upload_date: datetime | None = None
proof_count: int = 0   # tells the client "there are more", but never returns them
```

The pact **detail** page works around this by calling the separate
`GET /pacts/{id}/proofs` endpoint (`PactProofResponse` list) to fetch the full
proof history. The feed list can't reasonably do that per-card (N+1 requests
for every visible card), so it needs the list endpoint itself to return a
small, capped array of recent proof thumbnails inline.

## Change: add `recent_proofs` to the feed enrichment query

**File: `app/api/pacts.py`**, inside `_fetch_feed_page` (or whichever shared
helper builds the feed/personalized-feed result rows — the block currently
building `latest_proofs` via one `.first()` query per pact id, around line
570-579):

```python
RECENT_PROOFS_LIMIT = 5  # matches RECENT_SUPPORTERS_LIMIT's pattern — small, capped, per-card

recent_proofs_by_pact: dict[int, list[dict]] = {}
if pact_ids:
    proof_rows = (
        db.query(PactProof)
        .filter(PactProof.pact_id.in_(pact_ids))
        .order_by(PactProof.pact_id, PactProof.created_at.desc())
        .all()
    )
    for row in proof_rows:
        bucket = recent_proofs_by_pact.setdefault(row.pact_id, [])
        if len(bucket) < RECENT_PROOFS_LIMIT:
            bucket.append(_serialize_proof_row(row))
```

This reuses the existing `_serialize_proof_row` helper (already defined at
line 198) — same per-proof shape (`id`, `proof_url`, `proof_type`, `caption`,
`day_number`, `uploaded_at`) as `PactProofResponse`, just capped to N and
returned inline instead of via a separate request. It replaces the N
single-row `.first()` queries with one `IN (...)` query (cheaper, not more
expensive, than what's there today).

Then in the per-pact result dict (around line 619-660), add:

```python
"recent_proofs": recent_proofs_by_pact.get(pact.id, []),
```

**File: `app/schemas/pacts.py`**, on the feed's `PactResponse` model:

```python
recent_proofs: list["PactProofResponse"] = Field(default_factory=list)  # NEW
```

(`PactProofResponse` is already defined a few lines below — just needs to be
usable as a forward ref there, or move it above `PactResponse`.)

## Why this shape

- Capped array, inline on the list response — no extra round trip per card,
  no N+1.
- Same field names as `PactProofResponse` (used by the detail page's
  `/pacts/{id}/proofs`), so the frontend's existing proof-normalizing code
  works unchanged for both sources.
- `proof_count` stays as the total count (for "+12 more" style UI later if
  wanted); `recent_proofs` is just the most recent `RECENT_PROOFS_LIMIT`.

## Frontend: already wired, no change needed once this ships

`getProofs()` in `src/components/FeedPactCard.tsx` already prefers
`pact.recent_proofs` (this exact shape) when present, and only falls back to
`pact.proofClips` / the single `pact.proof_url` when it's absent — the moment
this field starts coming back from the API, feed cards get the full
swipeable gallery automatically, no frontend deploy required.

Until the backend ships this, the feed hero correctly shows one photo (today's
real data) — the swipe/dots gesture code itself has no bug; it was only ever
missing more than one tile to page through.
