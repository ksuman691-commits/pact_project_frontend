# CirclePact security policy

This file lives in both repositories (`pact_project_backend_v2` and `pact_project_frontend`).
It sets the rules every change must follow and the checklist every pull request is reviewed against.

## Reporting a vulnerability

Email **[security@circlepact.com]** (placeholder until the company inbox exists). Do not open a public
GitHub issue. We aim to acknowledge within 2 working days. Incidents follow
`claude/circlepact-breach-runbook.md` (CERT-In: report within 6 hours of noticing).

## What we protect first

1. **One person must never read or change another person's data.** Private Circles, followers-only and
   locked/paid Pacts, moments (photos, videos, stories), DMs-like replies, email, date of birth, UPI IDs.
2. **Accounts.** Sign-in, Google sign-in, password reset, sessions.
3. **The integrity of the accountability record.** Nobody can mark a Pact or Dare done, change progress,
   or move a CP Score except through the server's own rules.
4. **Money flows** (tips, pay-to-watch, dare rewards) while they exist.

## Rules for code

### Authorization (the highest-risk area)
- Every endpoint that reads or writes a user-owned object loads it **and** checks the caller's right to it
  on the server: ownership, membership, or the shared helpers (`_can_view_pact`, `can_view_media`,
  `_user_can_view_pact_stories`, circle membership checks). Hiding a button is not access control.
- New visibility rules go into the shared helpers (`app/services/pact_access.py`), never re-implemented
  inline in one route.
- Every new endpoint gets a test that a **second, unrelated user** gets 403/404, and, where relevant, that a
  **signed-out** caller gets 401.
- Private Circle data (name, description, members, pacts, moments) is returned only to members.
- IDs in paths or bodies are never trusted: resolve them, then check access.

### Media and storage
- The server never signs a URL or object key it received from a client. Media keys are created by the server
  at upload time and read back only from database rows the caller is allowed to see.
- Uploads are validated by decoding the file (Pillow for images, HEAD + size/type for presigned video),
  not by the client's `Content-Type` or file name.
- The S3 bucket stays private (no public ACLs); links are short-lived presigned or CloudFront-signed URLs.

### Authentication and sessions
- Use maintained libraries (PyJWT/`pwdlib`/`bcrypt`, `google-auth`). No custom crypto, no custom JWT code.
- Google sign-in requires `email_verified`; an existing password account is linked only after its owner
  proves control of it.
- Accounts created through OAuth get an unusable password.
- Tokens never go in URLs (query strings end up in logs).

### Input, output and errors
- Request bodies are Pydantic models with length and range limits. No `payload: dict` handlers.
- List endpoints cap `limit` (`Query(..., le=100)`).
- Responses use response models so fields are not leaked by accident (email, date of birth, UPI ID only to
  the owner).
- Errors never include stack traces, SQL or internal hostnames. `DEBUG=false` in production.

### Secrets and configuration
- No secrets in code, tests fixtures that look real, docs, or `NEXT_PUBLIC_*` variables.
- `.env*` stays git-ignored. Production refuses to start with a default `SECRET_KEY`.
- A leaked secret is **rotated**, not just deleted from the latest commit.

### Dependencies
- Add a dependency only when it replaces meaningful custom code or a security-sensitive task. Prefer the
  framework's built-ins and official SDKs. Note why in the PR.
- Pin versions; Dependabot PRs are reviewed weekly. No merge with a known HIGH/CRITICAL advisory unless the
  PR records why it is not exploitable here.

### Database
- Schema changes only through Alembic migrations, never `create_all` / `__table__.create` at request time.
- Destructive migrations need a backup and explicit owner approval.
- Uniqueness and ownership rules that matter are database constraints, not only Python checks.

## Automated checks (CI)
Required to pass before merge to `main` (and therefore before Render/Vercel deploy):
- Backend: `pytest`, `pip-audit`, `bandit` (medium+), Semgrep/CodeQL.
- Frontend: `next build`, `npm audit --audit-level=high` (or `pnpm audit`), CodeQL.
- Both: Gitleaks secret scan, Dependabot alerts.

Never disable a check to make a build pass; fix it or record an approved exception.

## Pull request checklist
The same list is in `.github/pull_request_template.md`.
