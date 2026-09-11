const AGE_VERIFIED_KEY_PREFIX = 'circlepact_age_verified_';

/**
 * Client-only fallback for the age-gate (see /verify-age and
 * useAuthStore.completeAgeVerification). PATCH /api/users/me is now live
 * and persists `date_of_birth` on the user record — see
 * BACKEND_SPEC_CONTENT_MODERATION.md — so this flag is now mainly a
 * resilience fallback for transient failures (network hiccup, unexpected
 * 5xx) rather than the primary mechanism. Keyed per-user (by user_uuid,
 * stable across providers) so it doesn't leak between accounts on a
 * shared device.
 *
 * This is explicitly NOT a security control — it only prevents the gate
 * from re-prompting a verified user on every navigation. A user under 18
 * is blocked both by the age-gate's own client-side calculation (see
 * VerifyAgePage) and, authoritatively, by the backend's 403
 * { code: 'underage_user' } rejection, which useAuthStore.
 * completeAgeVerification always propagates rather than falling back to
 * this flag for. A determined user could still clear localStorage or call
 * the API directly with a false date of birth — this is a self-declared
 * age gate, not ID verification, same trade-off as most consumer apps
 * (see BACKEND_SPEC_CONTENT_MODERATION.md for that explicitly stated).
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
