const AGE_VERIFIED_KEY_PREFIX = 'circlepact_age_verified_';

/**
 * Age verification is decided only by `user.date_of_birth` as returned by the
 * backend. Older builds also wrote a per-user localStorage flag when
 * PATCH /api/users/me failed, which let users past the gate without the
 * backend ever storing their date of birth (every later create call then
 * 403'd with `missing_date_of_birth`). That flag is no longer trusted
 * anywhere; this only removes a leftover one.
 */
export function clearAgeVerifiedLocally(userUuid: string | undefined | null): void {
  if (typeof window === 'undefined' || !userUuid) return;
  try {
    localStorage.removeItem(`${AGE_VERIFIED_KEY_PREFIX}${userUuid}`);
  } catch {
    // Storage unavailable (private mode etc.) — nothing to clear.
  }
}

export function isMissingDateOfBirthError(error: any): boolean {
  return error?.response?.status === 403 && error?.response?.data?.detail?.code === 'missing_date_of_birth';
}
