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

const PROFILE_NUDGE_DISMISSED_UNTIL_KEY = 'circlepact_profile_nudge_dismissed_until';
const PROFILE_NUDGE_SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Whether the single dismissible profile-completion nudge (e.g. "Add a
 * photo") is currently suppressed on this device. Same localStorage pattern
 * as the onboarding-seen flag above: read directly rather than through
 * React state since it only gates a render decision.
 */
export function isProfileNudgeDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PROFILE_NUDGE_DISMISSED_UNTIL_KEY);
    if (!raw) return false;
    const dismissedUntil = Number(raw);
    if (!Number.isFinite(dismissedUntil)) return false;
    return Date.now() < dismissedUntil;
  } catch {
    return false;
  }
}

/** Suppresses the profile nudge for PROFILE_NUDGE_SUPPRESS_MS (7 days). */
export function dismissProfileNudge(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_NUDGE_DISMISSED_UNTIL_KEY, String(Date.now() + PROFILE_NUDGE_SUPPRESS_MS));
  } catch {
    // Ignore — worst case the nudge reappears sooner than 7 days.
  }
}

const PROFILE_CHECKLIST_DISMISSED_UNTIL_KEY = 'circlepact_profile_checklist_dismissed_until';
const PROFILE_CHECKLIST_SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Whether the guided profile-completion checklist flow (new-user variant,
 * see useProfileCompletion + ProfileCompletionCard) is currently suppressed
 * on this device. Same pattern as the single nudge above, but tracked with
 * its own key since the two cards are independent surfaces. The checklist
 * stamps this the moment it's shown (not only on explicit dismissal) — any
 * exposure in the last 7 days, whether completed, skipped, or closed early,
 * counts as "seen" and suppresses it for the rest of that window.
 */
export function isProfileChecklistDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PROFILE_CHECKLIST_DISMISSED_UNTIL_KEY);
    if (!raw) return false;
    const dismissedUntil = Number(raw);
    if (!Number.isFinite(dismissedUntil)) return false;
    return Date.now() < dismissedUntil;
  } catch {
    return false;
  }
}

/** Suppresses the profile checklist flow for PROFILE_CHECKLIST_SUPPRESS_MS (7 days). */
export function dismissProfileChecklist(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_CHECKLIST_DISMISSED_UNTIL_KEY, String(Date.now() + PROFILE_CHECKLIST_SUPPRESS_MS));
  } catch {
    // Ignore — worst case the checklist reappears sooner than 7 days.
  }
}
