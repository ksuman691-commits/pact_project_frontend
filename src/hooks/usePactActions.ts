'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pactService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { toErrorMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

/**
 * The vote-skip endpoint returns 403 with this message for anyone who
 * hasn't joined the pact yet.
 */
export function isNotParticipantError(error: any): boolean {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const message = typeof detail === 'string' ? detail : '';
  return status === 403 && /participant/i.test(message);
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
