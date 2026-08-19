'use client';

import { useEffect } from 'react';
import { getHasNavigatedWithinApp } from '@/lib/inAppNavigation';

interface SeededHistoryState {
  __seededBack?: boolean;
  [key: string]: unknown;
}

/**
 * Seeds the browser's REAL session-history stack for detail pages so the
 * Android/iOS hardware back button — which calls the browser/WebView's
 * native history.back() directly, completely bypassing React, Next's
 * router, and useSmartBack — has a genuine previous entry to land on
 * instead of closing the tab/app.
 *
 * useSmartBack only decides what an in-app chevron's onClick does; it can
 * never intercept the hardware back gesture, which never fires a click
 * handler at all. This hook is the piece that actually fixes the hardware
 * button by manipulating the tab's real history stack (via the native
 * History API), not just app-level state.
 *
 * Only relevant when getHasNavigatedWithinApp() is false: this tab's very
 * first paint landed directly on this URL (deep link, shared link, or a
 * freshly (re)launched PWA/homescreen session), so there is no real
 * previous entry in the actual browser history for the hardware button to
 * pop to. When the user already navigated in-app, a genuine previous
 * entry already exists and this is a no-op.
 *
 * Pass `fallbackHref` as `undefined`/`null` while the real destination
 * isn't known yet (e.g. a pact detail page waiting on its circle_id to
 * load) — the hook simply won't seed until it receives a real value, so
 * it naturally waits for the correct destination instead of seeding a
 * placeholder that would then get "locked in" by the de-dupe guard below.
 *
 * Rewrites the current entry to `fallbackHref` via replaceState, then
 * pushes the real URL back on top via pushState. That makes the tab's
 * actual history become [fallbackHref, currentUrl], so the native back
 * gesture pops to fallbackHref in-app instead of closing the tab — Next's
 * router picks up the resulting popstate normally since fallbackHref is a
 * real in-app route.
 *
 * Guarded via a marker stored on history.state itself (not a ref/module
 * flag) so this survives React 18 Strict Mode's dev-only double-invoked
 * effects, and any later re-render with a changed fallbackHref, without
 * ever pushing duplicate entries.
 */
export function useSeedBackHistory(fallbackHref: string | null | undefined) {
  useEffect(() => {
    if (!fallbackHref) return;
    if (typeof window === 'undefined') return;
    if (getHasNavigatedWithinApp()) return;

    const state = window.history.state as SeededHistoryState | null;
    if (state?.__seededBack) return;

    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    window.history.replaceState({ ...state, __seededBack: true }, '', fallbackHref);
    window.history.pushState({ ...state, __seededBack: true }, '', currentUrl);
  }, [fallbackHref]);
}
