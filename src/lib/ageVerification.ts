const AGE_VERIFIED_KEY_PREFIX = 'circlepact_age_verified_';

/**
 * Client-only fallback for the age-gate (see /verify-age and
 * useAuthStore.completeAgeVerification) while the backend doesn't yet
 * persist `date_of_birth` on the user record (POST /api/auth/verify-age is
 * not live — see BACKEND_SPEC_CONTENT_MODERATION.md). Keyed per-user (by
 * user_uuid, stable across providers) so it doesn't leak between accounts
 * on a shared device, and so it stops being consulted the moment the
 * backend field ships and GET /api/auth/me starts returning a real
 * date_of_birth.
 *
 * This is explicitly NOT a security control — it only prevents the gate
 * from re-prompting a verified user on every navigation. A user under 18
 * is still blocked from ever setting this flag by the age-gate's own
 * client-side calculation (see VerifyAgePage), but a determined user could
 * clear localStorage or call the API directly to bypass it entirely, which
 * is exactly why real enforcement must happen server-side once the
 * `date_of_birth` column and per-request checks in the spec are built.
 */
export function isAgeVerifiedLocally(userUuid: string | undefined | null): boolean {
  if (typeof window === 'undefined' || !userUuid) return false;
  try {
    return localStorage.getItem(`${AGE_VERIFIED_KEY_PREFIX}${userUuid}`) === '1';
  } catch {
    return false;
  }
}

export function markAgeVerifiedLocally(userUuid: string | undefined | null): void {
  if (typeof window === 'undefined' || !userUuid) return;
  try {
    localStorage.setItem(`${AGE_VERIFIED_KEY_PREFIX}${userUuid}`, '1');
  } catch {
    // Ignore — worst case the gate re-prompts next session until the
    // backend field exists, which is a nag, not a broken flow.
  }
}
