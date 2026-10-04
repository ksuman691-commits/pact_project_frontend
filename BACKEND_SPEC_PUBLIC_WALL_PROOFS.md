# Backend spec: public wall proofs

`GET /api/circles/{id}/wall` (no auth) currently returns `{ id, name, photo_url, icon_emoji, pacts[] }`.
The pacts carry no images, authors, or member count, so the wall cannot show a photo gallery yet.
The frontend already parses the fields below when present and falls back to a plain list of public
pacts when `proofs` is absent.

## Add to the response

```json
{
  "description": "string | null",
  "member_count": 3,
  "proofs": [
    {
      "id": 101,
      "pact_id": 12,
      "pact_title": "Run before work",
      "image_url": "https://...presigned...",
      "member_name": "Maya",
      "submitted_at": "2026-10-04T06:42:00Z"
    }
  ]
}
```

## Rules

- `proofs` contains only proofs the member explicitly marked public. Never add proofs automatically.
- `image_url` is a presigned, time-limited GET URL (same mechanism as feed proofs). No auth needed to fetch it.
- Image proofs only; skip video/text proofs for now.
- Order newest first. Cap at 60. An empty list means "no public proofs"; omit the key entirely only if unsupported.
- No likes, view counts, or ranking fields.
- `member_count` is the real count of circle members. `description` is the circle description (null if none).
- Image dimensions are optional but welcome (`width`, `height`) so the client can reserve space.
