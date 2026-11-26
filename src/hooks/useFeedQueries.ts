'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { feedService, pactAdvancedService, socialService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { retryBackoff, retryTransient } from '@/lib/transient';

const ITEMS_PER_PAGE = 10;

export function usePersonalizedFeed(category = 'all', paidOnly = false) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.personalized(category, paidOnly),
    queryFn: ({ pageParam = 0 }) =>
      feedService.getPersonalized(pageParam, ITEMS_PER_PAGE, category, paidOnly),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    // Short, so a pact someone just started in your circle shows up when you open or return to the app.
    staleTime: 1000 * 20,
    refetchOnWindowFocus: true,
    // Keeps the skeleton up through a slow start (about a minute) before showing Tap to retry.
    retry: retryTransient(4),
    retryDelay: retryBackoff,
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

export function useUserJoinedPacts(userId: number) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.pacts.byUser(userId), 'joined'],
    queryFn: ({ pageParam = 0 }) =>
      pactAdvancedService.getJoinedPactsByUser(userId, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePactComments(pactId: number, sort: 'top' | 'newest' | 'oldest' = 'oldest', enabled = true, day?: number | null) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.pacts.comments(pactId), sort, day ?? 'all'],
    queryFn: ({ pageParam = 0 }) =>
      socialService.getComments(pactId, pageParam, ITEMS_PER_PAGE, sort, day),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: !!pactId && enabled,
    staleTime: 1000 * 30,
  });
}

