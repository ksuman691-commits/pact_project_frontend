# Backend spec: public dare-proof share link

Per the project convention (see `v0_memories` "Backend handled separately via
Copilot/VS Code"), this is a contract for the backend to implement, not a
file v0 edits directly in `pact_project_backend_v2`. The frontend is wired
against this contract already, with graceful 404/network-error fallback —
see `src/services/darePublicShareService.ts`.

## Why a new endpoint, not `dare.proof_url`

`DareResponse` (see `app/schemas/dares.py` / `_serialize_dare` in
`app/api/dares.py`) does **not** carry a `proof_url`/`proof_type` field today
— that's a separate, pre-existing gap (the frontend's `DareCard` and the
dare detail page already read `dare.proof_url` defensively, anticipating a
field that isn't actually on the live response yet). This spec does **not**
depend on that field being added. Instead, the new endpoint queries
`DareProof` directly, so the share feature works regardless of whether that
separate gap ever gets fixed.

## New endpoint

```
GET /api/dares/{dare_id}/public
```

No auth required — same pattern as `GET /api/circles/{circle_id}/wall`
(`get_current_user_optional` or no user dependency at all; this route is
meant to be reachable by a signed-out visitor who followed a share link).

### Logic

1. Look up `Dare` by `dare_id`. 404 (`"Dare not found"`) if missing.
2. Look up the most recent `DareProof` row for this `dare_id`
   (`db.query(DareProof).filter(DareProof.dare_id == dare_id).order_by(DareProof.created_at.desc()).first()`).
3. If no proof exists yet, 404 (`"This dare hasn't been completed yet"`) —
   do not expose a dare with nothing to show, and do not leak whether a
   private dare with no proof exists.
4. Resolve the creator (`User` by `dare.creator_id`) for attribution.
5. Sign the proof file URL the same way `_sign_private_url` already does
   for `creator_avatar_url` elsewhere in `app/api/dares.py`
   (`S3StorageService().generate_presigned_get_url(proof.file_url)`), since
   the bucket is private.

### Response shape

```json
{
  "id": 42,
  "title": "Cold plunge every morning for a week",
  "description": "No excuses.",
  "creator_username": "jordan",
  "creator_full_name": "Jordan Lee",
  "creator_avatar_url": "https://...(signed)",
  "proof_url": "https://...(signed)",
  "proof_type": "photo",
  "caption": "Day 7, done.",
  "completed_at": "2026-09-30T14:02:00Z"
}
```

`proof_type` is the `ProofType` enum value (`photo` | `video` | `checklist`)
already used by `DareProofResponse`. `completed_at` is `proof.created_at`.

### Pydantic schema (suggested)

```python
class DarePublicShareResponse(BaseModel):
    id: int
    title: str
    description: str
    creator_username: str | None = None
    creator_full_name: str | None = None
    creator_avatar_url: str | None = None
    proof_url: str | None = None
    proof_type: ProofType
    caption: str | None = None
    completed_at: datetime
```

### Route (suggested, mirrors `get_circle_wall`'s style exactly)

```python
@router.get("/{dare_id}/public", response_model=DarePublicShareResponse)
def get_dare_public_share(dare_id: int, db: Session = Depends(get_db)):
    dare = db.query(Dare).filter(Dare.id == dare_id).first()
    if not dare:
        raise HTTPException(status_code=404, detail="Dare not found")

    proof = (
        db.query(DareProof)
        .filter(DareProof.dare_id == dare_id)
        .order_by(DareProof.created_at.desc())
        .first()
    )
    if not proof:
        raise HTTPException(status_code=404, detail="This dare hasn't been completed yet")

    creator = db.query(User).filter(User.id == dare.creator_id).first()

    return {
        "id": dare.id,
        "title": dare.title,
        "description": dare.description,
        "creator_username": creator.username if creator else None,
        "creator_full_name": creator.full_name if creator else None,
        "creator_avatar_url": _sign_private_url(creator.avatar_url) if creator else None,
        "proof_url": _sign_private_url(proof.file_url),
        "proof_type": proof.proof_type,
        "caption": proof.caption,
        "completed_at": proof.created_at,
    }
```

Place it alongside the other `@router.get("/{dare_id}/...")` routes in
`app/api/dares.py`, **before** the generic `@router.get("/{dare_id}")` route
if FastAPI route ordering matters here (it shouldn't, since `/public` is a
static suffix, not a competing `{dare_id}` path param, but match whatever
ordering the existing `/{dare_id}/recipients` etc. routes already use).

## Frontend usage

- `src/services/darePublicShareService.ts` calls this via the existing
  unauthenticated `publicApi` client (same one `circlePublicWallService`
  uses) and returns `null` on any error (404, network, backend down) so the
  public page can show a clean "not found" state instead of crashing.
- `src/app/dares/[id]/public/page.tsx` is the share-link landing page.
- The "Share" button on the authenticated dare detail page
  (`src/app/dares/[id]/page.tsx`) generates the link as
  `${origin}/dares/{id}/public` — a plain, readable URL, not a token, since
  nothing here is sensitive once a dare's proof is shareable at all (same
  non-tokenized convention as the Circle Wall share link).

## Verification status (flagged per project convention)

**Not live-tested.** `pact-project-backend-v2.onrender.com` is currently
suspended at the Render infrastructure level (confirmed `503` /
`x-render-routing: suspend` on `/docs` and `/openapi.json` during this
session) — unrelated to this spec, but it means this contract could not be
exercised against a real deployment. Once the service is back up:

1. Confirm this route is implemented and returns the shape above for a
   dare that actually has a `DareProof` row.
2. Confirm it 404s (not 500) for a dare with no proof yet, and for a
   nonexistent `dare_id`.
3. Re-verify `darePublicShareService.getPublicShare()` against the real
   response once confirmed, the same way `circlePublicWallService`'s header
   comment documents its own live verification date — update that comment
   here once this endpoint is confirmed shipped.
