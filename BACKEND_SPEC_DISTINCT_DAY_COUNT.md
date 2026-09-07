# Backend spec: distinct-day proof count for the progress ring

**STATUS: PARTIALLY WORKED AROUND ON THE FRONTEND.** The pact detail page's
progress ring is already accurate (see bottom) because it has the full proof
list to compute from. The feed card does not have that list, so its ring
math (where applicable) still uses the raw approximation this doc replaces.
This spec is for closing that gap so any future feed-card feature that needs
an accurate "days completed" count doesn't have to fetch the full proof list
per card to get one.

## Root cause

Multiple proofs per day are now allowed (there is no unique constraint on
`pact_proofs` for `(pact_id, submitted_by, day_number)`, and never was one).
`proof_count` on `PactResponse` is a raw `COUNT(PactProof.id)`:

```python
# app/api/pacts.py — _serialize_pact (single-pact path)
proof_count = db.query(func.count(PactProof.id)).filter(PactProof.pact_id == pact.id).scalar() or 0

# app/api/pacts.py — _serialize_pacts (batch/feed path)
proof_counts = dict(
    db.query(PactProof.pact_id, func.count(PactProof.id))
    .filter(PactProof.pact_id.in_(pact_ids))
    .group_by(PactProof.pact_id)
    .all()
)
```

`getPactProgress()` (`src/components/PactProgressRing.tsx`) uses this value
as a stand-in for "days completed" in the ring's completed/missed math. That
was a safe equivalence back when only one proof per day was possible — one
proof per day meant proof rows and completed days were the same number. Now
that several proofs can land on the same day, a raw row count over-counts
distinct days: e.g. 3 photos posted on day 1 only, then days 2-3 skipped,
reads as `proof_count = 3`, which the ring displays as "3 of 3 days done, 0
missed" instead of the true "1 of 3 days done, 2 missed."

This is a display-only bug — no pact status, stake, or payout logic reads
`proof_count` as a completion threshold, so it doesn't affect money-handling,
only what the ring shows.

## Change: add a distinct-day count alongside proof_count

**File: `app/api/pacts.py`**, single-pact path (`_serialize_pact`, the
`proof_count` line above, ~line 454):

```python
completed_days = (
    db.query(func.count(func.distinct(PactProof.day_number)))
    .filter(PactProof.pact_id == pact.id, PactProof.day_number.isnot(None))
    .scalar()
    or 0
)
```

Batch/feed path (`_serialize_pacts`, the `proof_counts` block above, ~line
601):

```python
completed_days_counts = dict(
    db.query(PactProof.pact_id, func.count(func.distinct(PactProof.day_number)))
    .filter(PactProof.pact_id.in_(pact_ids), PactProof.day_number.isnot(None))
    .group_by(PactProof.pact_id)
    .all()
)
```

Add to both result payloads (alongside the existing `"proof_count": ...`
line in each):

```python
"completed_days": completed_days,              # _serialize_pact
"completed_days": completed_days_counts.get(pact.id, 0),  # _serialize_pacts
```

**File: `app/schemas/pacts.py`**, on `PactResponse`:

```python
completed_days: int = 0  # NEW — distinct days with at least one proof, vs. proof_count's raw row count
```

Keep `proof_count` as-is (it's still correct as a literal "how many photos
have been posted" total, used for the "Upload proof (N)" menu label — that
one should stay a raw count). `completed_days` is additive, not a
replacement.

### Note on `day_number` being nullable

Any proof uploaded before the day-tag fix (see `BACKEND_SPEC_*` history / the
`ProofUploadModal` day_number wiring) has `day_number = NULL` in the DB — the
`.isnot(None)` filter above already excludes those from the distinct count
rather than having them all collapse into a single "day `NULL`" bucket. That
means pacts with old, pre-fix proofs will still slightly under-count real
completed days until those rows either backfill (out of scope here) or age
out. New proofs are unaffected.

## Frontend: partial fix already in place, full fix once this ships

`getPactProgress()` in `src/components/PactProgressRing.tsx` already accepts
an optional second argument — the pact's own already-fetched proof list — and
when passed, computes `completed` as a distinct-day count client-side from
each proof's `day`/`day_number` field instead of trusting `proof_count`:

```ts
const distinctDaysCompleted = proofs
  ? new Set(proofs.map((p) => p.day ?? p.day_number).filter((d): d is number => typeof d === 'number')).size
  : null
```

The pact detail page (`src/app/pacts/[id]/page.tsx`) already passes its
`proofs` list this way, so **its ring is fully accurate today, no backend
change needed for that page.**

The feed card (`FeedPactCard.tsx`) only ever receives `recent_proofs` — capped
to the 5 newest proofs, not the full history — so it cannot reliably derive a
correct distinct-day count client-side (a pact with photos on 8+ days would
have earlier days silently drop out of the capped window). It does not
currently render a proof-count-based ring at all (its ring is purely
elapsed-days-vs-duration, unaffected by this bug), so there is no active bug
on the feed today. This spec exists so that if a future feed-card feature
needs an accurate "days completed" number, it can read the new
`completed_days` field directly instead of re-fetching each pact's full proof
list just to compute it. Today, `getPactProgress(pact)` called with no
second argument falls back to `pact.proof_count ?? pact.proofs_count ??
pact.completed_days ?? ...` — `proof_count` (the raw, over-counting value)
wins that chain since it's checked first. Receiving the new `completed_days`
field is safe immediately (unknown extra fields are simply ignored), but a
small follow-up edit to swap that fallback order — checking
`pact.completed_days` before `pact.proof_count` — is needed once this ships
for the feed's non-detail-page callers to actually pick it up.
