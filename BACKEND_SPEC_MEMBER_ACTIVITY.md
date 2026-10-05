# Backend spec: per-member weekly activity and proof witness counts

## Why

The Classic UI shows a small tick on a circle member's seat when they sent proof for a pact this week, and sentences like "3 of 5 sent proof this week" and "2 of your 3 witnesses have seen it".

Today the API returns none of this. Circle member payloads (`GET /api/circles`, `GET /api/circles/{id}/members`) carry identity only, and proofs carry no view count. Until these fields exist the frontend shows no ticks and no activity sentence at all. It shows only "{n} members". It never infers "nobody sent proof" from a missing field.

## 1. Member weekly activity

Add to every member object returned by `GET /api/circles/{circle_id}/members`:

```json
{
  "user_id": 12,
  "username": "priya",
  "full_name": "Priya N",
  "avatar_url": "https://...",
  "sent_proof_this_week": true
}
```

- `sent_proof_this_week: boolean`. True when the member has submitted at least one proof (for any pact, not only pacts in this circle) during the current ISO week.
- The ISO week (Monday 00:00 to Sunday 23:59:59) is computed in the **requesting user's timezone**. Accept a `tz` query parameter (IANA name, e.g. `Europe/London`) or read it from the user profile. Fall back to UTC.
- The field must be omitted or `null` when it cannot be computed. Do NOT return `false` as a default. The frontend treats a missing or `null` value as "unknown" and shows nothing. `false` means "we checked, and they did not send proof".
- Optional: `last_proof_at: string | null` (ISO timestamp) so the UI can say "Sent proof on Sunday".

### Circle list aggregate

Add to each circle in `GET /api/circles` so the list can render captions without loading every member list:

```json
{
  "id": 3,
  "member_count": 5,
  "members_sent_proof_this_week": 3
}
```

`members_sent_proof_this_week` follows the same rules (omit or `null` if unknown). The list also needs a small `members_preview` array (up to 8 members: `user_id`, `full_name`, `username`, `avatar_url`, `sent_proof_this_week`) so the ring seats can be drawn from the list response.

## 2. Proof witness counts

Add to each proof object (`GET /api/pacts/{id}/proofs`, and the latest-proof summary on pact list items):

```json
{
  "id": 88,
  "seen_by_count": 2,
  "witness_count": 3
}
```

- `witness_count: number`. How many witnesses this proof is addressed to (pact circle members or named witnesses, excluding the author).
- `seen_by_count: number`. How many of those witnesses have opened the proof.
- Both are required together. If either is unavailable, omit both. The UI then shows only "Today's proof went in at 06:42."

## Frontend behaviour once shipped

No frontend change is needed. `src/lib/circleActivity.ts` already reads `sent_proof_this_week`, `members_sent_proof_this_week` and `members_preview`. It switches from "{n} members" to ticks and "x of n sent proof this week" the first time it sees a boolean there.
