## What this changes
<!-- One or two lines. Link the issue or doc. -->

## Security checklist (see SECURITY.md)
Tick each box or write "N/A — why".

**Access to other people's data**
- [ ] Every new or changed endpoint checks the caller's ownership/membership on the server.
- [ ] Private Circle, followers-only, and locked/paid Pact access is unchanged — or the change is described below and tested.
- [ ] Tests show an unrelated user gets 403/404 and a signed-out caller gets 401.
- [ ] No IDs, URLs or object keys from the client are trusted without a server-side lookup.

**Accounts and tokens**
- [ ] No change to sign-in, Google sign-in, password reset, token lifetime or sessions — or it is described and tested.
- [ ] No tokens or secrets in URLs, logs, error messages or `NEXT_PUBLIC_*` variables.

**API**
- [ ] Request bodies are Pydantic models with limits; list endpoints cap `limit`.
- [ ] Responses don't add personal fields (email, DOB, UPI ID, IP) for other users.
- [ ] New write endpoints are rate-limited where abuse is possible (auth, comments, reports, follows, uploads).

**Business rules**
- [ ] Nobody can complete, fail, extend or score a Pact/Dare outside the server's rules.
- [ ] Repeated or concurrent requests can't create duplicates (constraint or idempotency).

**Database**
- [ ] Schema changes are an Alembic migration (no runtime `create_all`).
- [ ] Destructive migration? Backup taken and owner approval linked.

**Dependencies**
- [ ] No new dependency — or: why it's needed, maintained, licence OK, no known HIGH/CRITICAL advisories.

**Secrets**
- [ ] No credentials, keys or real personal data added (CI secret scan is green).

## How it was tested
<!-- Commands run, new tests, manual checks. -->
