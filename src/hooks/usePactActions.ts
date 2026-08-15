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

/**
 * The vote endpoints (/vote-support, /vote-skip) return 403 with this
 * message for anyone who hasn't joined the pact yet. FeedPactCard uses this
 * to swap the swipe-right/support gesture from a dead-end error into an
 * inline "Join to support this pact" nudge instead — so the generic toast
 * below must stay silent for this one case and let the caller render that
 * nudge instead of a competing/duplicate error toast.
 */
export function isNotParticipantError(error: any): boolean {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const message = typeof detail === 'string' ? detail : '';
  return status === 403 && /participant/i.test(message);
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
      if (isNotParticipantError(error)) return;
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
      if (isNotParticipantError(error)) return;
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
