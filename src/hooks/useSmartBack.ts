'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Back-navigation helper for in-app chevrons/arrows that normally just call
 * router.back(). Plain router.back() dead-ends (or, in some browser
 * contexts, exits the tab) when the current entry is the first one in the
 * session's history stack — e.g. a deep link, a shared link opened in a
 * fresh tab, or a page reload. This checks window.history.length before
 * deciding: if there's real history to go back through, it behaves exactly
 * like router.back() (no behavior change for normal in-app navigation);
 * otherwise it pushes a deterministic fallback route so the button always
 * lands somewhere useful instead of doing nothing or leaving the app.
 *
 * history.length starts at 1 for a fresh navigation/reload and only grows
 * as this tab pushes entries, so length <= 1 reliably signals "no back
 * target in this tab."
 */
export function useSmartBack(fallbackHref: string) {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);
}
