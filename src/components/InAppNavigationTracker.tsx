'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { markInAppNavigation } from '@/lib/inAppNavigation';

/**
 * Invisible root-level tracker: marks inAppNavigation.ts's flag true the
 * first time the pathname actually changes after this document loaded
 * (i.e. a real client-side navigation happened), not on the initial
 * render. See inAppNavigation.ts for why this replaces a history.length
 * check for the "smart back" fallback used by DetailPageHeader and the
 * profile/create-flow back buttons.
 */
export default function InAppNavigationTracker() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      markInAppNavigation();
    }
    previousPathname.current = pathname;
  }, [pathname]);

  return null;
}
