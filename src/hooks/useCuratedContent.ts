'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { curatedContentService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CuratedContentListResponse } from '@/types';

export function useCuratedContent(filters: { type?: string; category?: string; trending?: boolean }) {
  return useQuery<CuratedContentListResponse>({
    queryKey: queryKeys.curated.discover(filters),
    queryFn: async () => {
      const response = await curatedContentService.discover(filters);
      const data = response.data;
      return data?.items ? data : { items: Array.isArray(data) ? data : [], page: 1, limit: 20, total: 0, has_more: false };
    },
    staleTime: 60_000,
  });
}

export function useDeployCuratedContent() {
  return useMutation({ mutationFn: ({ id, circleId }: { id: number; circleId: number }) => curatedContentService.deploy(id, circleId) });
}
