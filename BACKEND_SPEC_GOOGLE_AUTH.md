# Backend spec: Google authentication

## Endpoint

`POST /api/auth/google`

Request body:

```json
{
  "id_token": "<Google OAuth ID token>"
}
```

The backend must validate the Google ID token server-side (including issuer, audience, expiry, and signature). Never trust profile data supplied by the browser.

## Response

Return the same response shape as `POST /api/auth/login` and `POST /api/auth/register`:

```json
{
  "access_token": "<CirclePact access token>",
  "refresh_token": "<CirclePact refresh token>"
}
```

The frontend stores both tokens, then calls `GET /api/auth/me` to hydrate the user profile and redirects to `/` (Feed), exactly like email/password login.

## Errors

Use the existing auth error response shape, preferably with an HTTP 401 for an invalid, expired, or wrong-audience Google token and a 409 if the Google identity cannot be associated with an account under the product's account-linking rules.

## Frontend configuration

The browser client ID is configured through `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. This is not a secret and is used only by Google's JS SDK. The backend must validate the ID token's `aud` claim against the configured Google OAuth client ID independently.

## Account behavior

For an existing Google identity, sign the user in. For a new identity, create the CirclePact user using the verified Google subject/email/profile data, following the backend's normal username collision and email uniqueness rules, then return the same token response.
