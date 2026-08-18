'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { getHasNavigatedWithinApp } from '@/lib/inAppNavigation';

/**
 * Back-navigation helper for in-app chevrons/arrows that normally just call
 * router.back(). Plain router.back() dead-ends (or, in some browser
 * contexts, exits the tab) when there's no real in-app page to return to —
 * e.g. a deep link or a shared link opened in a fresh tab. This checks
 * getHasNavigatedWithinApp() before deciding: if this tab has completed at
 * least one real client-side navigation, it behaves exactly like
 * router.back() (no behavior change for normal in-app navigation);
 * otherwise it pushes a deterministic fallback route so the button always
 * lands somewhere useful instead of dead-ending or leaving the app.
 *
 * Deliberately does NOT check window.history.length — verified via a real
 * fresh-tab reproduction that a brand-new tab reports history.length === 2
 * (the tab's own initial blank-document entry, plus the navigated-to
 * page), which is indistinguishable from the length after one genuine
 * in-app navigation. That made a length-based check trigger router.back()
 * in exactly the case it needed to catch, dead-ending on the blank entry.
 * See src/lib/inAppNavigation.ts for the tracker this uses instead.
 */
export function useSmartBack(fallbackHref: string) {
  const router = useRouter();

  return useCallback(() => {
    if (getHasNavigatedWithinApp()) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);
}
