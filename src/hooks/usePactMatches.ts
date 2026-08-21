'use client';

import { useQuery } from '@tanstack/react-query';
import { pactAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import type { PactMatchesResponse } from '@/types';

const EMPTY_MATCHES: PactMatchesResponse = { category: '', total_count: 0, matches: [] };

/**
 * Mutual-goal category matches for a pact — GET /api/pacts/{id}/matches.
 * NOT YET LIVE on the backend (see BACKEND_SPEC_MUTUAL_GOAL_MATCHING.md), so
 * this mirrors the app's existing "degrade gracefully" convention
 * (circleAdvancedService.inviteUser and friends): a 404 or network failure
 * resolves to an empty result instead of throwing, so the calling UI (the
 * Feed strip / Discover banner) just renders nothing rather than an error.
 */
export function useGoalMatches(pactId: number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.pacts.matches(pactId || 0),
    queryFn: async () => {
      try {
        const response = await pactAdvancedService.getCategoryMatches(pactId as number);
        return (response.data ?? EMPTY_MATCHES) as PactMatchesResponse;
      } catch {
        return EMPTY_MATCHES;
      }
    },
    enabled: Boolean(pactId) && (options?.enabled ?? true),
    retry: false,
    staleTime: 1000 * 60 * 2,
  });
}
