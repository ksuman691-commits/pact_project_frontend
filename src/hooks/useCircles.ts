import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { circleService, circleJoinRequestService, circleAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const ITEMS_PER_PAGE = 10;

export function useCircles() {
  return useQuery({
    queryKey: queryKeys.circles.list(),
    queryFn: async () => {
      const response = await circleService.list();
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCircle(id: number) {
  return useQuery({
    queryKey: queryKeys.circles.detail(id),
    queryFn: async () => {
      const response = await circleService.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCircleMembers(circleId: number) {
  return useQuery({
    queryKey: queryKeys.circles.members(circleId),
    queryFn: async () => {
      const response = await circleJoinRequestService.listMembers(circleId);
      return response.data;
    },
    enabled: !!circleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicCircles() {
  return useInfiniteQuery({
    queryKey: queryKeys.circles.public(),
    queryFn: ({ pageParam = 0 }) =>
      circleAdvancedService.getPublicCircles(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchCircles(query: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.circles.search(query),
    queryFn: ({ pageParam = 0 }) =>
      circleAdvancedService.searchCircles(query, pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCircleLeaderboard(circleId: number) {
  return useQuery({
    queryKey: queryKeys.circles.leaderboard(circleId),
    queryFn: async () => {
      const response = await circleAdvancedService.getLeaderboard(circleId);
      return response.data;
    },
    enabled: !!circleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCirclePactsList(circleId: number) {
  return useQuery({
    queryKey: queryKeys.circles.pacts(circleId),
    queryFn: async () => {
      // Using pactAdvancedService to get circle pacts
      const response = await circleAdvancedService.getLeaderboard(circleId);
      return response.data;
    },
    enabled: !!circleId,
    staleTime: 1000 * 60 * 5,
  });
}
