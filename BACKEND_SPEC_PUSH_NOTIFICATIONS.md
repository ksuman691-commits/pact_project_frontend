# Backend Spec: Push Notifications (Firebase Cloud Messaging)

Status: **not implemented on the backend.** This doc is the contract the
frontend is already built against (see `src/lib/firebase.ts`,
`src/hooks/usePushNotifications.ts`, `src/services/api.ts` `pushService`,
`src/app/notifications/preferences/page.tsx`). Nothing here should be
implemented in v0/Next.js — this is Copilot/`pact_project_backend_v2` work,
per the existing split (v0 writes the spec + frontend, backend is applied
separately).

Blocked on: **a real Firebase project does not exist yet.** The user has to
create one (or delegate that) and produce a service account JSON for
Firebase Admin SDK before the "sending" half of this spec can go live. None
of the schema/scheduling work below is blocked on that, though — build and
test it with fake tokens first.

## 1. Schema

### `push_subscriptions`

One row per device/browser the user has granted permission on (a user can
have several — phone + laptop, etc).

| column | type | notes |
|---|---|---|
| `id` | serial PK | |
| `user_id` | FK -> `users.id`, indexed | |
| `fcm_token` | string(255), unique, indexed | the FCM registration token from `getToken()` |
| `timezone` | string(64) | IANA tz name (e.g. `America/Chicago`), inferred client-side from `Intl.DateTimeFormat().resolvedOptions().timeZone` at subscribe time — see "Timezone handling" below |
| `created_at` | timestamp | |
| `last_active_at` | timestamp | bump on every successful send *and* every re-subscribe call (FCM tokens rotate; treat a duplicate `fcm_token` insert as an upsert that refreshes this) |

`POST /api/push/subscribe` — body `{ fcm_token: string, timezone: string }`.
Upsert on `fcm_token` (unique). Returns 401 if unauthenticated, 200 otherwise.

`POST /api/push/unsubscribe` — body `{ fcm_token: string }`. Deletes the row
if present. Call this from the frontend on logout and would ideally also be
called when FCM's `onTokenRefresh`/delivery-failure signals a token is
dead — not implemented client-side yet, note it as a follow-up.

### `notification_preferences`

Per-user, per-type opt-out. Default-on: a missing row for a
`(user_id, type)` pair means "on".

| column | type | notes |
|---|---|---|
| `id` | serial PK | |
| `user_id` | FK -> `users.id`, indexed | |
| `type` | enum, see below | |
| `enabled` | boolean, default `true` | |
| `updated_at` | timestamp | |

Unique constraint on `(user_id, type)`.

Enum values, matching the frontend toggle keys in
`src/app/notifications/preferences/page.tsx` exactly:
`daily_reminder`, `streak_warning`, `circle_nudges`, `milestones`, `weekly_recap`.

Note the frontend UI intentionally does **not** expose a separate toggle
for "missed-day recovery" (type 6 below) — treat it as always-on and
bucketed under the same opt-out umbrella as `daily_reminder` (i.e. if a user
turns off `daily_reminder`, also suppress missed-day recovery for them).
If product wants it independently toggleable later, add a 6th enum value
and a 6th frontend row — no other schema change needed.

`GET /api/push/preferences` — returns `{ [type]: boolean }` for all 5 types
(defaulting missing rows to `true`).
`PUT /api/push/preferences` — body is the same shape; upserts each provided
key.

## 2. Notification types and triggers

| # | Type | Trigger | Timing |
|---|---|---|---|
| 1 | `daily_reminder` | User has ≥1 active pact, hasn't posted proof today | Once, in the evening in the user's *local* time (see timezone handling) |
| 2 | `streak_warning` | Active streak ≥3 days, no post today | Later / more urgent than (1) — see "same-day exclusivity" below |
| 3 | `circle_nudges` | **Event-driven.** A circle member taps "nudge" on another member | Immediately on the action |
| 4 | `milestones` | **Event-driven.** Fires at proof-upload time when the resulting streak crosses 7, 14, or 30 days | Immediately on proof upload |
| 5 | Missed-day recovery | Day after a user misses a day (streak reset to 0) | Once, framed constructively ("new day, new streak") — bucketed under `daily_reminder`'s opt-out, see above |
| 6 | `weekly_recap` | Scheduled | Once a week (e.g. Sunday evening local time), aggregating days-completed + circle average from existing data — no new aggregation tables needed, reuse whatever query already backs the circle leaderboard/stats endpoints |

### Type 3 — circle nudges: dependency not yet built

**There is currently no "nudge a circle member" feature anywhere in this
codebase** (frontend or backend) as of this spec. `nudge`-named code that
exists today (`MultiDayNudge.tsx`, `ProfileNudgeCard.tsx`) is unrelated —
those are dare-scheduling and profile-completion UI, not a
member-to-member nudge action. Before type 3 can fire, someone has to build:
- A UI affordance (e.g. a button on a circle member's row) that calls
- A new endpoint, e.g. `POST /api/circles/{id}/members/{user_id}/nudge`

Once that exists, its handler should call the same "send a push" helper
this spec defines (see section 5) rather than duplicating send logic.
Until then, type 3 has no trigger and should be treated as spec'd-but-idle.

### Same-day exclusivity (rate limiting)

Cap at **1–2 pushes per user per day**. Specifically:
- (1) `daily_reminder` and (2) `streak_warning` are **mutually exclusive on
  the same day** — never send both to the same user. If a user has a
  streak ≥3 days and hasn't posted, send only the streak warning (it's the
  more urgent framing of the same underlying fact); otherwise send the
  plain daily reminder if applicable. This is a single scheduled job
  decision, not two independent jobs.
- (5) missed-day recovery only fires the day *after* a miss, when neither
  (1) nor (2) would have fired anyway (there's no active streak to warn
  about) — so it doesn't stack with them.
- (6) `weekly_recap` is scheduled independently (once a week) and is allowed
  to land on the same day as (1)/(2)/(5) — recap is a low-frequency digest,
  not daily nag, so the 1–2/day cap treats it as the "+1" allowance.
- (3) and (4) are event-driven and user-initiated (someone nudged you) or
  milestone-worthy (you just hit 7/14/30 days) — allow them to send
  regardless of what already went out that day; these are rare enough in
  practice that they won't cause fatigue, and suppressing a milestone
  celebration because a reminder already fired that morning would undercut
  the entire point of the notification.
- Net rule: **at most one of {daily_reminder, streak_warning, missed-day
  recovery} per user per day**, plus optionally weekly_recap, plus any
  number of event-driven (3)/(4) — but see below, don't let (3)/(4) become
  a spam vector; consider a soft cap (e.g. max 3 event-driven pushes/day)
  if usage data later shows it's needed. Not implementing that cap now —
  no volume data exists yet to size it correctly.

## 3. Timezone handling

Capture timezone client-side (already implemented — see
`usePushNotifications.ts`'s `enablePush()`, which reads
`Intl.DateTimeFormat().resolvedOptions().timeZone` and sends it in the
`POST /api/push/subscribe` body) and store it on `push_subscriptions.timezone`.

A user can have multiple subscription rows (multiple devices) that could
theoretically disagree on timezone (e.g. traveling with a phone and a
laptop signed in from home). For scheduling, use the **most recently
active** subscription's timezone (`ORDER BY last_active_at DESC LIMIT 1`)
as the user's "evening" reference — simplest correct-enough behavior
without a separate user-level timezone column doing double bookkeeping.

"Evening" = a fixed local hour (e.g. 7pm local) rather than a fixed UTC
hour — this is the entire reason timezone capture exists. Recommend
convert-once-per-user-per-day: for the scheduled cron run (see below),
compute each user's local "now" from their stored timezone and only act on
users where local time has just crossed the reminder threshold.

## 4. Scheduling approach

Recommend **Vercel Cron** for the three scheduled types, since the app
(frontend, and presumably wherever `pact_project_backend_v2` deploys to) is
already on Vercel infrastructure per the existing project setup:
- `daily_reminder` / `streak_warning` combined job: runs hourly (not once a
  day at a fixed UTC time), and for each run only processes users whose
  *local* time is currently in the "evening reminder" window — this is how
  a single hourly cron correctly serves all timezones without 24 separate
  per-timezone jobs.
- Missed-day recovery: can piggyback on the same hourly job — check
  "did this user miss yesterday and have they not already gotten a
  recovery message" as an additional branch.
- `weekly_recap`: a separate cron, once a week (e.g. hourly on Sundays,
  same local-time-window trick, or simpler: fixed UTC time is acceptable
  here since a recap landing a few hours off doesn't carry the same
  urgency as a same-day reminder).

Event-driven types (3 `circle_nudges`, 4 `milestones`) fire from **existing
action handlers**, not a cron job:
- Type 4 (milestones) hooks into the existing proof-upload endpoint — after
  a successful upload, compute the resulting streak length and fire if it
  just crossed 7/14/30.
- Type 3 (circle_nudges) hooks into the nudge endpoint once it exists (see
  section 2's dependency note).

## 5. Rate limiting implementation note

Whatever cron/handler sends a push should go through one shared helper
(e.g. `send_push(user_id, type, title, body, data)`) that:
1. Checks `notification_preferences` for that `(user_id, type)` — no-op if
   disabled.
2. Checks the same-day exclusivity rule in section 2 for scheduled types.
3. Looks up all `push_subscriptions` rows for the user and sends to each.
4. On an FCM `UNREGISTERED`/`invalid-registration-token` error response,
   delete that subscription row (dead token cleanup) rather than retrying.

## 6. Firebase Admin SDK usage (once credentials exist)

```python
import firebase_admin
from firebase_admin import credentials, messaging

# Service account JSON — store as a single env var (e.g.
# FIREBASE_SERVICE_ACCOUNT_JSON containing the whole JSON blob) rather than
# a file path, matching how Vercel-deployed services typically inject
# secrets.
cred = credentials.Certificate(json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"]))
firebase_admin.initialize_app(cred)

def send_push(fcm_token: str, title: str, body: str, data: dict | None = None):
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
        token=fcm_token,
    )
    try:
        messaging.send(message)
    except messaging.UnregisteredError:
        # Dead token — delete the push_subscriptions row.
        ...
```

Required env vars once the Firebase project exists (frontend already reads
these — see `src/lib/firebase.ts` for the client-side ones):
- Backend: `FIREBASE_SERVICE_ACCOUNT_JSON` (Admin SDK, server-only, secret)
- Frontend (already wired, just needs values):
  `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`,
  `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
