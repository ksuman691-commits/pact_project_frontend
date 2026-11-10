'use client';

import { useMyDares } from './useDareQueries';
import { useAuthStore } from '@/store/auth';

/**
 * How many dares are waiting for the viewer's answer. Shares the "my dares"
 * query (and its cache) with the Dares page, so it adds no request of its own.
 * Stays off until a session exists: asking while signed out 401s and bounces
 * to sign-in (see useMyDares).
 */
export function usePendingDareCount(enabled = true): number {
  const { user, isInitialized } = useAuthStore();
  const query = useMyDares({ enabled: enabled && isInitialized && !!user });
  return (query.data?.pages?.flatMap((page) => page.data) || []).filter(
    (d: any) => d.my_recipient_status === 'pending' && d.creator_id !== user?.id,
  ).length;
}
