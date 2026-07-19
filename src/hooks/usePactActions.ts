'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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

  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    return detail.msg;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useSupportPact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pactId: number) => pactService.support(pactId),
    onSuccess: (_response, pactId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to support pact'));
    },
  });
}

export function useSkipPact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pactId: number) => pactService.skip(pactId),
    onSuccess: (_response, pactId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to skip pact'));
    },
  });
}

export function useReportPact(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: 'fake_or_ai' | 'spam' | 'offensive') => pactService.report(pactId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.pacts.all, 'my-reports'] });
      toast.success('Pact reported');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to report pact'));
    },
  });
}