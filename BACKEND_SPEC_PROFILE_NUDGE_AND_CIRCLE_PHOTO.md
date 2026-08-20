# Backend spec: profile completion stats + circle photo upload

**STATUS: SHIPPED.** Both changes below have been confirmed live in production
(photo upload/delete round-trips correctly, `circles_count`/`pacts_joined_count`
return real numbers). The frontend (`pact_project_frontend`) is wired directly
against these live fields — no fallback/degraded paths remain. Kept here as a
record of the contract that was implemented.

## 1. Add `circles_count` + `pacts_joined_count` to `UserStatsResponse`

**File: `app/schemas/users.py`**

```python
class UserStatsResponse(BaseModel):
    pacts_created: int
    pacts_completed: int
    win_rate: int
    current_streak: int
    reputation: int
    cheers_sent: int
    circles_count: int          # NEW
    pacts_joined_count: int     # NEW
```

**File: `app/api/users.py`**, inside `get_user_stats`:

```python
from app.models.entities import PactParticipant, PactParticipantRole  # add to existing import block

@router.get("/{user_id}/stats", response_model=UserStatsResponse)
def get_user_stats(user_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    created_count = db.query(func.count(Pact.id)).filter(Pact.creator_id == user_id).scalar() or 0
    completed_count = (
        db.query(func.count(Pact.id))
        .filter(Pact.creator_id == user_id, Pact.status == PactStatus.completed)
        .scalar()
        or 0
    )
    win_rate = round((completed_count / created_count) * 100) if created_count else 0

    user_row = db.query(User).filter(User.id == user_id).first()
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")

    cheers_sent = db.query(func.count(PactCheer.id)).filter(PactCheer.sender_id == user_id).scalar() or 0

    # NEW — reuses the existing _get_user_circle_ids helper defined lower in this file.
    circles_count = len(_get_user_circle_ids(db, user_id))

    # NEW — pacts joined as a participant (role == participant), distinct from pacts_created.
    pacts_joined_count = (
        db.query(func.count(PactParticipant.id))
        .filter(PactParticipant.user_id == user_id, PactParticipant.role == PactParticipantRole.participant)
        .scalar()
        or 0
    )

    return {
        "pacts_created": created_count,
        "pacts_completed": completed_count,
        "win_rate": win_rate,
        "current_streak": 0,
        "reputation": round(float(user_row.reputation_score or 0)),
        "cheers_sent": int(cheers_sent),
        "circles_count": circles_count,           # NEW
        "pacts_joined_count": pacts_joined_count,  # NEW
    }
```

Note: `_get_user_circle_ids` is currently defined *after* `get_user_stats` in the file
(around line 121) — either move it above, or just inline the query:

```python
circles_count = (
    db.query(func.count(CircleMembership.id))
    .filter(CircleMembership.user_id == user_id)
    .scalar()
    or 0
)
```

No migration needed — this endpoint has no new DB columns, just new query logic.

---

## 2. Add `photo_url` to `Circle` + a photo upload endpoint

### 2a. Model + migration

**File: `app/models/entities.py`**, on `Circle`:

```python
class Circle(Base, TimestampMixin):
    __tablename__ = "circles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    icon_emoji: Mapped[str | None] = mapped_column(String(20), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)  # NEW
    visibility: Mapped[CircleVisibility] = mapped_column(Enum(CircleVisibility), default=CircleVisibility.public)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=1)
```

Add an Alembic migration adding `photo_url VARCHAR(512) NULL` to `circles`. `icon_emoji`
stays exactly as-is and permanent — `photo_url` is a separate, optional field. This is the
fix for the icon_emoji-fed-into-`Image`-component bug: the frontend now has a real URL
field to pass to `next/image`/`Avatar`, and never passes `icon_emoji` there again.

### 2b. Schema

**File: `app/schemas/circles.py`**

```python
class CircleResponse(BaseModel):
    id: int
    name: str
    description: str
    icon_emoji: str | None = None
    photo_url: str | None = None   # NEW
    visibility: CircleVisibility
    owner_id: int
    owner_username: str | None = None
    owner_avatar_url: str | None = None
    member_count: int
    is_member: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
```

`CircleCreate` does NOT need a `photo_url` field — photo is attached via its own upload
endpoint after creation, exactly mirroring how `/api/auth/avatar` works for users (create
user/circle first, then `POST .../photo` with the file).

### 2c. Storage service

**File: `app/services/storage.py`**, add a sibling to `upload_avatar_file`:

```python
def upload_circle_photo_file(self, circle_id: int, upload_file: UploadFile) -> str:
    extension = ""
    if upload_file.filename and "." in upload_file.filename:
        extension = upload_file.filename[upload_file.filename.rfind("."):]

    object_key = (
        f"{self.prefix}/circle_photos/circle_{circle_id}/"
        f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{extension}"
    )

    self.client.upload_fileobj(
        upload_file.file,
        self.bucket,
        object_key,
        ExtraArgs={"ContentType": upload_file.content_type or "application/octet-stream"},
    )

    return f"https://{self.bucket}.s3.{settings.aws_region}.amazonaws.com/{object_key}"
```

### 2d. Endpoint

**File: `app/api/circles.py`**, add near the other `/{circle_id}/...` routes:

```python
@router.post("/{circle_id}/photo", response_model=CircleResponse)
def upload_circle_photo(
    circle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    circle = db.query(Circle).filter(Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    if circle.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the circle owner can update its photo")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Circle photo must be an image file")

    storage = S3StorageService()
    circle.photo_url = storage.upload_circle_photo_file(circle_id=circle.id, upload_file=file)
    db.add(circle)
    db.commit()
    db.refresh(circle)

    return _serialize_circle(circle, db, current_user_id=user.id)
```

Remember to add `File` to the `fastapi` import at the top of `circles.py` if it isn't
already imported (`auth.py` already imports it — same pattern).

### 2e. Presigned URL in `_serialize_circle`

**File: `app/api/circles.py`**, inside `_serialize_circle`'s return dict, add:

```python
"photo_url": _sign_avatar_url(circle.photo_url),
```

`_sign_avatar_url` (already defined in this file) is a generic S3 presigner despite its
name — it just needs a raw S3 URL in, and returns a presigned GET URL out, so it works
unchanged for circle photos too.

---

## Summary of files touched (backend repo)

- `app/schemas/users.py` — `UserStatsResponse` + 2 new fields
- `app/api/users.py` — `get_user_stats` computes the 2 new fields
- `app/models/entities.py` — `Circle.photo_url` column
- Alembic migration — add `circles.photo_url`
- `app/schemas/circles.py` — `CircleResponse.photo_url`
- `app/services/storage.py` — `upload_circle_photo_file`
- `app/api/circles.py` — new `POST /{circle_id}/photo` endpoint (owner-only) + `_serialize_circle` includes `photo_url`
