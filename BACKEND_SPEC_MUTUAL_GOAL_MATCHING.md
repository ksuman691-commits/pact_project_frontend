# Backend Spec: Mutual-Goal Pact Matching

**Owner:** Backend team (`pact_project_backend_v2`, separate repo — not in
this frontend repo)
**Status:** Not implemented. Frontend ships wired against this contract with
a graceful fallback (renders nothing) until it's live.
**Requested by:** Feed pact card — "X others are on the same goal" strip
(on the viewer's own pacts) and "Same goal, different circle" banner (on
public pacts browsed in Discover mode).

## Why this is needed

`Pact.category` is a closed enum (`fitness | startup | coding | creator |
study | habits | social`) already sent on every pact create and already
used to filter the personalized feed. There is currently no way to find
*other people* who have an active pact in the same category — the feature
needs a lightweight "who else is chasing this same goal" lookup so the
Feed can surface a low-friction "start a circle with them" moment.

## Requested endpoint

`GET /api/pacts/{pact_id}/matches?limit=6`

- **Auth:** required.
- **404** if `pact_id` doesn't exist, or isn't visible to the viewer under
  the existing visibility rules for the *source* pact (it can be the
  viewer's own private pact — matching is driven by category only, this
  never exposes the source pact itself more broadly).
- **Query:** other users' pacts where:
  - `visibility == 'public'`
  - `status == 'active'`
  - `category == <pact.category>` (the pact identified by `pact_id`)
  - `creator_id != viewer_id`
  - Reuse the same filter shape as the existing `_public_active_feed_query`
    (`app/api/pacts.py`) for the `visibility`/`status` conditions — this is
    the exact boundary already used for `GET /api/pacts`, do not reuse
    `_personalized_visible_filter` (that one also surfaces private/
    circle_only pacts, which must stay out of this).
- **Dedupe** by `creator_id` — one result per matching person, not per pact.
  When a user has multiple qualifying pacts, pick their most recently
  created one for `pact_id`/`pact_title`.
- **Order:** most-recently-created qualifying pact first.
- **Limit:** `limit` query param, default 6 (caps the `matches` array —
  used for the avatar stack). Also return an unbounded `total_count` so the
  frontend can show "12 others…" even when only 6 avatars are rendered.

### Response shape

```json
{
  "category": "fitness",
  "total_count": 5,
  "matches": [
    {
      "user_id": 12,
      "username": "priya",
      "full_name": "Priya Shah",
      "avatar_url": "https://.../priya.jpg",
      "pact_id": 88,
      "pact_title": "Lose 5kg in 60 days"
    }
  ]
}
```

## Frontend integration (already shipped, calling this as if live)

- `pactAdvancedService.getCategoryMatches(pactId, limit)` —
  `src/services/api.ts`.
- `useGoalMatches(pactId)` — `src/hooks/usePactMatches.ts`. Catches any
  error (404 today) and resolves to `{ category: '', total_count: 0,
  matches: [] }`, so the UI shows nothing rather than an error state.
- `GoalMatchStrip` — `src/components/GoalMatchStrip.tsx`. Two variants:
  - `feed`: compact strip on the viewer's own pact card (avatars + "N
    others are on the same X goal right now").
  - `discover`: bordered banner on a public pact card being browsed by a
    non-creator ("Same goal, different circle" + first names + "Start a
    circle with them").
- Both wired into `FeedPactCard.tsx`, gated on `pact.category` being set.
- "Start a circle with them" navigates to
  `/circles/create?inviteUserId=<comma-separated user ids>` — the create-
  circle flow (`CreateCircleFlowContext`) already accepts multiple
  pre-populated invitee ids via this param.

No frontend changes should be needed once this endpoint ships — just
remove the "NOT YET LIVE" comments in `api.ts` / `usePactMatches.ts` once
confirmed against the deployed OpenAPI schema.
