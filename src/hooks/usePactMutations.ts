'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pactService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { toErrorMessage } from '@/lib/errorMessages';
import { useMissingDobRedirect } from '@/hooks/useMissingDobRedirect';
import toast from 'react-hot-toast';

export function useCreatePact() {
  const queryClient = useQueryClient();
  const redirectIfMissingDob = useMissingDobRedirect();

  return useMutation({
    mutationFn: (data: any) => pactService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      // No success toast here — the create-pact flow transitions to its own
      // SuccessStep screen (stamp + title + suggestions) on success, so a
      // toast on top of that would be a redundant leftover from the old
      // form-based flow.
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to create pact'));
      redirectIfMissingDob(error);
    },
  });
}

