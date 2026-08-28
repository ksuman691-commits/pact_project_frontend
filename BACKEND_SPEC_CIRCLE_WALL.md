# Backend spec: public Circle Wall endpoints (Circle QR Reveal feature)

**STATUS: NOT YET IMPLEMENTED.** Frontend has a graceful fallback in place
(see bottom) — the wall page shows a "not available yet" empty state until
this ships, then automatically lists real data with no further frontend
changes needed.

## Why new endpoints are needed (not reusing existing ones)

The two existing circle endpoints in `app/api/circles.py` can't serve this
feature as-is:

- `GET /api/circles/{id}` — requires `Depends(get_current_user)`, 401s for a
  logged-out visitor.
- `GET /api/circles/{id}/pacts` — also requires auth, **and does not filter
  by visibility at all** (`Pact.circle_id == circle_id` only). It's safe
  today only because the frontend gates the whole page behind circle
  membership. It must never be reused directly for a public route.

## Non-negotiable constraint

Both new endpoints must filter strictly on `Pact.visibility ==
PactVisibility.public`. Private and circle-only pacts must never be returned
by either endpoint, under any circumstance. Reuse the existing filter
helper already used by the main feed and pact-matching:

```python
# app/api/pacts.py
def _public_active_feed_query(db: Session):
    return db.query(Pact).filter(Pact.visibility == PactVisibility.public, Pact.status == PactStatus.active)
```

Per the product decision, the Wall shows **active + completed** public
pacts (completed pacts serve as a track record for a cold visitor), so the
new query extends this same condition to include both statuses rather than
introducing a different filter:

```python
def _public_circle_wall_pacts_query(db: Session, circle_id: int):
    return db.query(Pact).filter(
        Pact.circle_id == circle_id,
        Pact.visibility == PactVisibility.public,
        Pact.status.in_([PactStatus.active, PactStatus.completed]),
    )
```

## New endpoint 1: circle summary

**File: `app/api/circles.py`**

```python
@router.get("/{circle_id}/public-wall", response_model=CirclePublicWallResponse)
def get_circle_public_wall(circle_id: int, db: Session = Depends(get_db)):
    circle = db.query(Circle).filter(Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")

    public_pacts = _public_circle_wall_pacts_query(db, circle_id).all()
    completed = [p for p in public_pacts if p.status == PactStatus.completed]

    return CirclePublicWallResponse(
        id=circle.id,
        name=circle.name,
        description=circle.description,
        icon_emoji=circle.icon_emoji,
        photo_url=circle.photo_url,
        member_count=circle.member_count,
        public_pact_count=len(public_pacts),
        public_pact_completed_count=len(completed),
    )
```

No `Depends(get_current_user)` — this route is intentionally unauthenticated.

**File: `app/schemas/circles.py`**

```python
class CirclePublicWallResponse(BaseModel):
    id: int
    name: str
    description: str
    icon_emoji: str | None = None
    photo_url: str | None = None
    member_count: int
    public_pact_count: int
    public_pact_completed_count: int
```

## New endpoint 2: circle's public pacts

**File: `app/api/circles.py`**

```python
@router.get("/{circle_id}/public-wall/pacts", response_model=list[PactResponse])
def get_circle_public_wall_pacts(circle_id: int, db: Session = Depends(get_db)):
    circle = db.query(Circle).filter(Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")

    pacts = _public_circle_wall_pacts_query(db, circle_id).order_by(Pact.created_at.desc()).all()
    return _serialize_pacts(pacts, db, viewer_id=None)
```

Reuses the existing `_serialize_pacts` helper from `app/api/pacts.py` (same
`PactResponse` shape already used by the feed and detail pages), called with
`viewer_id=None` since there is no logged-in viewer — `is_joined_by_me`,
`user_vote`, `is_reported_by_me` naturally resolve to their `False`/`None`
defaults for an anonymous visitor. No auth dependency on this route either.

## Why no new field is needed for QR reveal progress

Reveal % is computed entirely on the frontend from data already present on
`PactResponse` (`start_date`, `end_date`, `proof_count`, `status`) via the
existing `getPactProgress()` helper in `PactProgressRing.tsx` — averaged
across the wall's public-pact set. No new backend field is required for
this; the two endpoints above only need to return the already-existing
`PactResponse` shape, correctly filtered.

## Frontend: graceful fallback already in place until this ships

`circlePublicWallService` calls these two endpoints through a dedicated
unauthenticated `publicApi` client (bypasses the app's normal 401→login
redirect interceptor, since a logged-out visitor must never be bounced to
the login page from this route). If the endpoints 404 or error today
(because they don't exist yet), the wall page shows a friendly "This
circle's public pacts aren't available yet" empty state rather than
crashing — same fallback pattern as `circleAdvancedService.inviteUser`'s
404-degrades-to-toast handling. Once these endpoints ship, the page starts
rendering real data automatically with no frontend deploy required.
