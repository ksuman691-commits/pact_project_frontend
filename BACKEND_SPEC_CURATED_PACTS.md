# Backend Specification: Curated Pacts / Ready Pacts

## Scope
Implement shared reusable Pact/Dare templates with mandatory human review. The AI drafting job is out of scope. Nothing is visible in discovery until `status=approved`.

## Shared model: `curated_content`
Use one table/model for both types rather than altering the existing Pact and Dare tables.

Required fields:
- `id`: UUID or integer primary key
- `title`: string, required
- `description`: text, required
- `category`: existing canonical category string (`fitness`, `startup`, `habits`, `social`, `creator`, `study`)
- `type`: enum `pact | dare`, required
- `status`: enum `draft | approved | rejected`, default `draft`
- `source`: enum `ai_generated | manual`, internal only; never return from public discovery
- `trending_until`: nullable timestamp
- `duration_days`: nullable positive integer, used for Pact defaults
- `target`: nullable string/number, used for Pact defaults where applicable
- `defaults`: nullable JSON object for additional type-specific deployment defaults
- `created_at`, `updated_at`
- `reviewed_by`: nullable user id
- `reviewed_at`: nullable timestamp
- `rejection_reason`: nullable string

Add `User.is_staff` boolean, default false. Include it in the authenticated `/api/auth/me` (or equivalent `/me`) response. Backend authorization, not the frontend, is the security boundary.

## Public discovery
`GET /api/curated-content`

Auth: authenticated users only.

Query params:
- `type`: optional `pact|dare`
- `category`: optional canonical category
- `trending`: optional `true`; only rows where `trending_until IS NULL OR trending_until >= now()` (or, if product wants strict trending, require non-null and >= now)
- `page`, `limit` (default 20, max 50)

Return only approved rows. Do not serialize `source`, reviewer fields, rejection fields, or other internal metadata.

Response:
```json
{
  "items": [{
    "id": 1,
    "title": "...",
    "description": "...",
    "category": "startup",
    "type": "pact",
    "trending_until": null,
    "duration_days": 7,
    "target": "...",
    "defaults": {}
  }],
  "page": 1,
  "limit": 20,
  "total": 1,
  "has_more": false
}
```

## Staff review queue
All endpoints require an authenticated user with `is_staff=true`; return `403 {"detail":"Staff access required"}` otherwise.

- `GET /api/admin/curated-content?status=draft&page=1&limit=50`
- `PATCH /api/admin/curated-content/{id}` — edit editable template fields; validate enum/category/positive duration.
- `POST /api/admin/curated-content/{id}/approve` — set approved, reviewed_by/current user, reviewed_at now, clear rejection_reason.
- `POST /api/admin/curated-content/{id}/reject` — optional `{ "reason": "..." }`, set rejected, reviewed_by/current user, reviewed_at now.

Review response may include internal `source`, status, reviewer, and rejection fields because it is staff-only.

## Deployment
`POST /api/curated-content/{id}/deploy`

Auth: authenticated user. Body: `{ "circle_id": "..." }`.

Server must verify:
1. template exists and `status=approved`;
2. caller can access/create content in the selected Circle (membership/permissions);
3. stored defaults are valid for the target type;
4. create the real Pact or Dare using the existing creation rules, assigning the selected Circle;
5. return the created resource, including its id and type.

Response: `201` with `{ "type": "pact|dare", "id": "...", "resource": { ... } }`.

Errors use `{ "detail": "..." }` with `401` unauthenticated, `403` forbidden/not a member, `404` missing template/circle, `409` not approved, and `422` invalid defaults.

## Security and publishing rules
- Never return drafts/rejected rows from public discovery.
- Never trust a client-provided status/source/reviewer field.
- Enforce `is_staff` on every admin endpoint server-side.
- Validate category/type/status with enums and parameterized queries.
- Do not implement the AI drafting scheduler/job in this pass.

## Manual verification data
Insert at least one draft Pact and one draft Dare, approve one, reject one, and use the approved item to exercise discovery and deploy into a Circle.
