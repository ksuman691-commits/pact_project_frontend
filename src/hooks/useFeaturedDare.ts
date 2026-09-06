'use client';

import { useMemo } from 'react';
import { useDareFeed } from './useDareQueries';
import { getTimeRing, isDareExpired } from '@/lib/dareCountdown';

/**
 * The single "featured dare" selection used everywhere a Dare of the Day
 * hero is shown (the Dares page hero and the Home feed) — the most
 * time-critical open, unclaimed public dare in Discover, a real record from
 * the same feed the Discover tab renders rather than an editorially "picked"
 * one (there's no daily-rotation/curation mechanic in the data model). Falls
 * back to the highest recipient count when nothing is time-bound, so the
 * hero still shows something meaningful whenever Discover has at least one
 * open public dare. Both call sites share this one hook so there is no
 * second, differently-tuned "featured" mechanic to drift out of sync with
 * this one.
 */
export function useFeaturedDare() {
  const feedQuery = useDareFeed();
  const discover = useMemo(
    () => feedQuery.data?.pages?.flatMap((page) => page.data) || [],
    [feedQuery.data],
  );

  const featuredDare = useMemo(() => {
    const openPublic = discover.filter(
      (d: any) => d.audience === 'public' && !d.my_recipient_status && !isDareExpired(d),
    );
    if (!openPublic.length) return null;
    return [...openPublic].sort((a: any, b: any) => {
      const targetA = a.expires_at ?? a.respond_by;
      const targetB = b.expires_at ?? b.respond_by;
      const ringA = getTimeRing(targetA, a.created_at);
      const ringB = getTimeRing(targetB, b.created_at);
      if (ringA.hoursRemaining !== ringB.hoursRemaining) return ringA.hoursRemaining - ringB.hoursRemaining;
      return (b.recipient_count ?? 0) - (a.recipient_count ?? 0);
    })[0];
  }, [discover]);

  return { featuredDare, isLoading: feedQuery.isLoading };
}
