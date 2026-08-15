# Backend Handoff: Missing "circles for a given user" endpoint

**Owner:** Backend team (separate repo, not in this frontend repo)
**Status:** Confirmed missing, blocks the public-profile Circles tab
**Reported need:** `/profile/[username]` (viewing someone else's profile) should
show that user's real circle memberships in the Circles tab, the same way
`/profile` (own profile) shows the current user's memberships.

## Root cause (confirmed against the live OpenAPI schema)

`GET /api/circles` is the only "list circles" route, and it is scoped to the
**authenticated caller** via the bearer token — it has no parameters at all:

```json
{
  "get": {
    "summary": "List Circles",
    "operationId": "list_circles_api_circles_get",
    "responses": { "200": { ... } },
    "security": [{ "OAuth2PasswordBearer": [] }]
  }
}
```

Confirmed via `curl $NEXT_PUBLIC_API_URL/openapi.json`. There is no
`/api/users/{user_id}/circles` route (`404` on a live probe) and no `user_id`
query param on `/api/circles`. Every other "get X for a given user" pattern in
this API is a real route (`/api/users/{id}/pacts`, `/api/users/{id}/stats`,
`/api/users/{id}/followers`, `/api/users/{id}/following`) — circles is the one
resource missing that shape.

## Why this can't be worked around client-side

There is no safe way to derive "circles user X belongs to" from the existing
routes:
- `/api/circles/public` lists public circles, but doesn't say which members
  belong to which — checking membership would mean calling
  `/api/circles/{id}/members` once per public circle, which is expensive and
  still misses any circle the target user is in that isn't public.
- Private circles the profile viewer isn't a member of have no route that
  exposes membership at all, by design (that's the correct privacy behavior —
  the workaround would leak private membership, not just be slow).

## What's needed

A new route, e.g. `GET /api/users/{user_id}/circles`, returning the same shape
as `CircleResponse` (as used by `GET /api/circles`), scoped to circles that
`user_id` is a member of and that the requester is allowed to see (public
circles, or circles the requester shares with `user_id`).

## Frontend status

`src/app/profile/[username]/page.tsx` Circles tab is left as an explicit
"not available yet" state (not a fake/mocked circle list) until this route
exists — see the code comment at that tab's render branch.
