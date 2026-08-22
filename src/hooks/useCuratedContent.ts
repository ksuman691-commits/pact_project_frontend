'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { curatedContentService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CuratedContent, CuratedContentListResponse } from '@/types';

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

export function useCuratedReview(status = 'draft') {
  return useQuery<CuratedContent[]>({
    queryKey: queryKeys.curated.review(status),
    queryFn: async () => {
      const data = (await curatedContentService.review(status)).data;
      return data?.items ?? (Array.isArray(data) ? data : []);
    },
    staleTime: 30_000,
  });
}

export function useCuratedReviewMutation() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.curated.all });
  return {
    approve: useMutation({ mutationFn: (id: number) => curatedContentService.approve(id), onSuccess: refresh }),
    reject: useMutation({ mutationFn: ({ id, reason }: { id: number; reason?: string }) => curatedContentService.reject(id, reason), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<CuratedContent> }) => curatedContentService.update(id, payload), onSuccess: refresh }),
  };
}

export function useDeployCuratedContent() {
  return useMutation({ mutationFn: ({ id, circleId }: { id: number; circleId: number }) => curatedContentService.deploy(id, circleId) });
}
