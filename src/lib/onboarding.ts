const ONBOARDING_SEEN_KEY = 'circlepact_onboarding_seen';

/**
 * Whether the visitor has already been through the onboarding carousel on
 * this device. Read directly from localStorage (same pattern as the auth
 * store's token checks) rather than through React state, since this only
 * needs to gate a single redirect decision on mount.
 */
export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
  } catch {
    // Private browsing / storage disabled — treat as already seen so we
    // never trap a visitor who can't persist the flag.
    return true;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    // Ignore — worst case the carousel reappears next visit.
  }
}
