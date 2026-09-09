# Backend Spec: Age Enforcement + Content Moderation

Frontend built against these contracts as if they already exist (see
`src/app/verify-age/page.tsx`, `src/components/AgeVerificationGate.tsx`,
`useAuthStore.completeAgeVerification`, `src/components/ProofUploadModal.tsx`).
Both pieces degrade gracefully until the backend ships: age verification
falls back to a client-only localStorage flag (`src/lib/ageVerification.ts`)
so users aren't permanently locked out, and moderation-rejection handling in
`ProofUploadModal` is a no-op catch branch until the new error shape below
starts appearing. **Neither of these frontend fallbacks is a substitute for
the server-side work in this doc** — they exist only so the UI is usable and
testable while the backend catches up.

## 1. Age enforcement (provider-agnostic)

### Why provider-agnostic

Google sign-in exists today, manual email/password signup is being phased
out, and more OAuth providers (LinkedIn, etc.) may be added later. OAuth
providers generally do not reliably hand back a real date of birth, and this
check must not be re-implemented per provider as more are added. So:

- Do **not** add `date_of_birth` as a field on the registration endpoint.
- Do **not** try to source it from any OAuth provider's profile payload.
- Add a **new, standalone endpoint** that any authenticated user hits once,
  regardless of how they signed up.

### Is there an existing "complete onboarding" / "update profile" endpoint?

No. Checked `app/api/auth.py` (register, login, google, refresh, verify,
logout, avatar) — there is no generic profile-update or onboarding-completion
endpoint to extend. **A new endpoint needs to be added.**

### New endpoint: `POST /api/auth/verify-age`

Auth: required (Bearer token, any provider — same dependency as
`GET /api/auth/me`).

Request body:
```json
{ "date_of_birth": "2001-06-15" }
```
- `date_of_birth`: ISO 8601 date string (`YYYY-MM-DD`), required.

Behavior:
1. Parse `date_of_birth`. Reject with `422` if unparseable or in the future.
2. Compute age server-side using the same calendar-aware logic as the
   frontend (year diff, minus 1 if birthday hasn't occurred yet this year).
3. If age < 18, reject with `403`:
   ```json
   { "detail": { "code": "underage", "message": "You must be 18 or older to use CirclePact." } }
   ```
   Do **not** persist the date of birth in this case — do not let a user
   retry with a different, older-sounding date and have the rejected one
   linger anywhere.
4. If age >= 18, persist `date_of_birth` on the user record and return the
   updated profile in the same shape as `GET /api/auth/me`.

### Schema change

Add to the `users` table:
- `date_of_birth` — `DATE`, nullable (null = not yet verified, works for all
  existing rows on migration).

### Gating core app features

Once this column exists, **every endpoint that lets a user act inside the
app** — creating a pact, joining a pact, uploading proof, creating a dare,
accepting a dare, creating/joining a circle, voting, commenting — must check
`current_user.date_of_birth is not None` and reject with `403`:
```json
{ "detail": { "code": "age_verification_required", "message": "Please complete age verification to continue." } }
```
The cleanest place for this is the same shared `get_current_user` dependency
(or a thin wrapper around it) already used across `app/api/*.py`, rather than
adding the check to each route individually — one central choke point on the
backend, mirroring the single global gate on the frontend.

Read endpoints (viewing feed, viewing a pact, viewing a profile) should stay
open — only state-changing / participation actions need the block.

### Trade-off, stated explicitly

This is **self-declared, not ID-verified** age gating — identical to the
standard consumer-app pattern (e.g. most social apps' DOB gates). A user can
lie about their date of birth. This is intentionally out of scope; if
stronger verification is ever needed later, that's a separate, larger spec
(ID upload + a verification provider).

## 2. Content moderation on proof upload

### Scope

Applies to both proof-upload endpoints: `POST /api/pacts/{id}/upload-proof`
(JSON, `file_url` already hosted) and
`POST /api/pacts/{id}/upload-proof-file` (multipart, raw file). The file
endpoint is the one the current UI actually calls
(`ProofUploadModal` → `pactService.uploadProofFile`).

### Provider: OpenAI Moderation API

Free, covers image inputs (the `omni-moderation-latest` model accepts
`image_url` content alongside text). Sufficient for current volume — no need
for AWS Rekognition or Sightengine unless volume or category granularity
needs grow later.

### Where the check happens

For `upload-proof-file`:
1. Receive the multipart file upload as today.
2. **Before** the final S3 commit (i.e. before the file becomes a permanent,
   retrievable `Proof` row), send the file to the Moderation API.
   - If S3 currently receives the file via a pre-signed URL flow the client
     uploads to directly, this means moderating the file server-side first
     (e.g. buffer it through the backend, or do a two-phase upload: stage to
     a temp/private key, moderate, then copy to the final public key only on
     pass) — do not moderate after the object is already at its public URL.
3. If flagged (see thresholds below), delete/discard the staged file and
   return the rejection shape below **without creating a `Proof` row**.
4. If clean, proceed with the existing commit + `Proof` row creation exactly
   as today.

For `upload-proof` (JSON, `file_url` already hosted elsewhere): fetch the
image at `file_url` server-side and run the same moderation call before
creating the `Proof` row. If the URL is unreachable, treat as a normal
upload failure (`400`), not a moderation rejection.

### Call shape

```python
import openai

client = openai.OpenAI(api_key=OPENAI_API_KEY)
response = client.moderations.create(
    model="omni-moderation-latest",
    input=[{"type": "image_url", "image_url": {"url": image_url_or_data_uri}}],
)
result = response.results[0]
```

For an uploaded file (not yet at a public URL), pass it as a base64 data URI
in `image_url.url` (e.g. `f"data:{content_type};base64,{b64_data}"`) rather
than writing it to a temporary public URL just to moderate it.

### Response shape

```json
{
  "id": "...",
  "model": "omni-moderation-latest",
  "results": [{
    "flagged": true,
    "categories": {
      "sexual": false, "sexual/minors": false,
      "violence": true, "violence/graphic": false,
      "self-harm": false, "self-harm/intent": false, "self-harm/instructions": false,
      "hate": false, "hate/threatening": false,
      "harassment": false, "harassment/threatening": false
    },
    "category_scores": {
      "sexual": 0.0001, "violence": 0.91, "...": "..."
    }
  }]
}
```

### Threshold logic

Reject (flag) if `result.flagged` is `true` **and** any of these specific
categories is flagged (ignore categories outside this list — e.g. don't
reject on `harassment` alone, since that's a text-oriented category that
shouldn't realistically fire on proof photos and would just create false
positives):
- `sexual`
- `violence`
- `self-harm` (and its `self-harm/intent`, `self-harm/instructions` variants)
- `hate` (and `hate/threatening`)

### Rejection response shape

On a flagged upload, both endpoints return `422`:
```json
{
  "detail": {
    "code": "content_flagged",
    "message": "This photo doesn't meet our content guidelines — please try a different photo."
  }
}
```
This exact `{ code: "content_flagged" }` shape is what
`ProofUploadModal.tsx`'s catch block already checks for (currently a no-op
until this ships) — matching it exactly means the graceful frontend handling
activates with no frontend changes needed when this lands.

### Where the API key lives

`OPENAI_API_KEY` as a backend-only secret (environment variable on the
Render service, same tier as any other backend secret — never exposed to the
frontend, never sent in any response). No frontend env var is needed; the
frontend never calls OpenAI directly.
