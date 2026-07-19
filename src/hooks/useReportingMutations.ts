'use client';

import { useMutation, useQueryClient, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { pactService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

function toErrorMessage(error: any, fallback: string) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.msg === 'string') return item.msg;
        return null;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.msg === 'string') return detail.msg;
    return fallback;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useReportPact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pactId, reason }: { pactId: number; reason: 'fake_or_ai' | 'spam' | 'offensive' }) =>
      pactService.report(pactId, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      queryClient.invalidateQueries({ queryKey: ['reportedPacts'] });
      toast.success('Pact reported successfully. Thank you for helping keep our community safe.');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to report pact'));
    },
  });
}

export function useGetMyReports(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ['reportedPacts', limit],
    queryFn: ({ pageParam = 0 }) => pactService.getMyReports(pageParam, limit),
    getNextPageParam: (lastPage, allPages) => {
      const response = lastPage.data;
      if (!response) return undefined;
      
      const pagination = response.pagination || {};
      const totalFetched = allPages.reduce((acc, page) => acc + (page.data?.data?.length || 0), 0);
      const hasMore = totalFetched < (pagination.total || 0);
      
      return hasMore ? totalFetched : undefined;
    },
    initialPageParam: 0,
    enabled: true,
  });
}

export function useGetReportCount(pactId: number) {
  return useQuery({
    queryKey: ['reportCount', pactId],
    queryFn: () => pactService.getReportCount(pactId),
    enabled: !!pactId,
  });
}

export function useGetReportLogs(pactId: number) {
  return useQuery({
    queryKey: ['reportLogs', pactId],
    queryFn: () => pactService.getReportLogs(pactId),
    enabled: !!pactId,
  });
}

// Vote mutations - updated to use new endpoints
export function useVoteSupport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pactId: number) => pactService.voteSupport(pactId),
    onSuccess: (response, pactId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to vote'));
    },
  });
}

export function useVoteSkip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pactId: number) => pactService.voteSkip(pactId),
    onSuccess: (response, pactId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to vote'));
    },
  });
}
