'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { feedService, shortsService, pactAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const ITEMS_PER_PAGE = 10;

export function usePersonalizedFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.personalized(),
    queryFn: ({ pageParam = 0 }) =>
      feedService.getPersonalized(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTrendingFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.trending(),
    queryFn: ({ pageParam = 0 }) =>
      feedService.getTrending(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDiscoverFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.discover(),
    queryFn: ({ pageParam = 0 }) =>
      feedService.getDiscover(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFollowingFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.following(),
    queryFn: ({ pageParam = 0 }) =>
      feedService.getFollowingFeed(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useShortsVideoFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.shorts.feed(),
    queryFn: ({ pageParam = 0 }) =>
      shortsService.getFeed(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePublicPacts() {
  return useInfiniteQuery({
    queryKey: queryKeys.pacts.public(),
    queryFn: ({ pageParam = 0 }) =>
      pactAdvancedService.getPublicPacts(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserPacts(userId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.pacts.byUser(userId),
    queryFn: ({ pageParam = 0 }) =>
      pactAdvancedService.getPactsByUser(userId, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCirclePacts(circleId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.pacts.byCircle(circleId),
    queryFn: ({ pageParam = 0 }) =>
      pactAdvancedService.getPactsByCircle(circleId, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: !!circleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchPacts(query: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.pacts.search(query),
    queryFn: ({ pageParam = 0 }) =>
      pactAdvancedService.searchPacts(query, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePactComments(pactId: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.pacts.comments(pactId),
    queryFn: ({ pageParam = 0 }) =>
      (async () => {
        const response = await feedService.getPersonalized(pageParam, ITEMS_PER_PAGE);
        return response;
      })(),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === 5 ? pages.length * 5 : undefined,
    initialPageParam: 0,
    enabled: !!pactId,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePactLikes(pactId: number) {
  return useQuery({
    queryKey: queryKeys.pacts.likes(pactId),
    queryFn: async () => {
      // This would typically come from an API endpoint
      return { data: [] };
    },
    enabled: !!pactId,
    staleTime: 1000 * 60 * 2,
  });
}
