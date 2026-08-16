'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { dareService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

export function useDareFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.dares.feed(),
    queryFn: ({ pageParam = 0 }) => dareService.getFeed(pageParam * 20, 20),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination || { skip: 0, limit: 20, total: 0 };
      if (pagination.skip + pagination.limit < pagination.total) {
        return Math.floor(pagination.skip / 20) + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
}

export function useMyDares(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: queryKeys.dares.mine(),
    queryFn: ({ pageParam = 0 }) => dareService.getMine(pageParam * 20, 20),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination || { skip: 0, limit: 20, total: 0 };
      if (pagination.skip + pagination.limit < pagination.total) {
        return Math.floor(pagination.skip / 20) + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
    // Callers that mount unconditionally (e.g. BottomNav in the root
    // layout) must pass `enabled: false` until a session actually exists —
    // firing this while logged out 401s, which triggers the API client's
    // hard-redirect-to-login, which remounts the caller and fires again.
    enabled: options?.enabled ?? true,
  });
}

export function useDareDetail(dareId: number | null | undefined) {
  return useQuery({
    queryKey: dareId ? queryKeys.dares.detail(dareId) : ['dares-detail-null'],
    queryFn: () => {
      if (!dareId) throw new Error('Dare ID is required');
      return dareService.getById(dareId);
    },
    enabled: !!dareId,
  });
}

export function useDareRecipients(dareId: number | null | undefined) {
  return useQuery({
    queryKey: dareId ? queryKeys.dares.recipients(dareId) : ['dare-recipients-null'],
    queryFn: () => {
      if (!dareId) throw new Error('Dare ID is required');
      return dareService.getRecipients(dareId);
    },
    enabled: !!dareId,
  });
}

export function useDareStats(dareId: number | null | undefined) {
  return useQuery({
    queryKey: dareId ? queryKeys.dares.stats(dareId) : ['dare-stats-null'],
    queryFn: () => {
      if (!dareId) throw new Error('Dare ID is required');
      return dareService.getStats(dareId);
    },
    enabled: !!dareId,
  });
}
