'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const ITEMS_PER_PAGE = 20;

export function useGlobalLeaderboard() {
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboards.global(),
    queryFn: ({ pageParam = 0 }) =>
      leaderboardService.getGlobal(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCircleLeaderboard(circleId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboards.circle(circleId),
    queryFn: ({ pageParam = 0 }) =>
      leaderboardService.getCircle(circleId, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: !!circleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrendingLeaderboard() {
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboards.trending(),
    queryFn: ({ pageParam = 0 }) =>
      leaderboardService.getTrending(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}
