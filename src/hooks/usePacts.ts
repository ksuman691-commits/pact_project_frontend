import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { pactService, pactAdvancedService, shortsService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { Pact } from '@/types';

const ITEMS_PER_PAGE = 10;

export function usePacts() {
  return useQuery({
    queryKey: queryKeys.pacts.list(),
    queryFn: () => pactService.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePact(id: number) {
  return useQuery({
    queryKey: queryKeys.pacts.detail(id),
    queryFn: () => pactService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePactProofHistory(pactId: number) {
  return useQuery({
    queryKey: queryKeys.pacts.proofHistory(pactId),
    queryFn: () => pactAdvancedService.getProofHistory(pactId),
    enabled: !!pactId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePactAnalytics(pactId: number) {
  return useQuery({
    queryKey: queryKeys.pacts.analytics(pactId),
    queryFn: () => pactAdvancedService.searchPacts('', 0, 1), // Placeholder for analytics endpoint
    enabled: !!pactId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useTodaysPacts() {
  return useQuery({
    queryKey: queryKeys.pacts.today(),
    queryFn: async () => {
      const response = await pactService.list();
      const pacts = response.data;
      const today = new Date().toDateString();
      return pacts.filter((pact: Pact) => {
        const deadline = new Date(pact.deadline).toDateString();
        return deadline === today;
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useActivePacts() {
  return useQuery({
    queryKey: queryKeys.pacts.active(),
    queryFn: async () => {
      const response = await pactService.list();
      return response.data.filter((pact: Pact) => pact.status === 'active');
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useInfinitePublicPacts() {
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

export function useShortsFeed() {
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
