/**
 * Tracks whether the current tab has completed at least one client-side
 * route change since this JS document loaded. Deliberately NOT based on
 * `window.history.length` — that count is unreliable for detecting "is
 * there a real previous in-app page to go back to": a brand-new tab
 * opened from an external link (share sheet, notification, bookmark)
 * reliably reports history.length === 2 in Chromium (the tab's initial
 * blank-document entry plus the navigated-to page), which is
 * indistinguishable from the length after one real in-app navigation.
 * Relying on history.length for the "smart back" fallback caused the
 * exact dead-end/exit bug it was meant to fix, confirmed by reproducing
 * it in a fresh browser session (history.back() landed on a blank page).
 *
 * This module-level flag is the authoritative signal instead: it only
 * flips true once Next's router has actually completed a pathname change
 * within this app, so a fresh deep link/reload always starts false and a
 * real in-app back destination is only trusted once we know it exists.
 */
let hasNavigatedWithinApp = false;

export function markInAppNavigation() {
  hasNavigatedWithinApp = true;
}

export function getHasNavigatedWithinApp() {
  return hasNavigatedWithinApp;
}
