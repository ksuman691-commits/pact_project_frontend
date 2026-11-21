'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { circleAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

export function useInviteUserToCircle(circleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: number; message?: string }) =>
      circleAdvancedService.inviteUser(circleId, data.userId, data.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.members(circleId) });
      toast.success('User invited to circle!');
    },
    onError: (error: any) => {
      // The direct-invite endpoint is still being built on the backend
      // (see the NOTE on circleAdvancedService.inviteUser) — a 404/501
      // here means "not deployed yet", not a real failure, so every call
      // site of this mutation (this modal, the create-circle flow) gets
      // a friendly message instead of a confusing generic error.
      const status = error?.response?.status;
      if (status === 404 || status === 501) {
        toast.error('Direct invites are launching soon — try the Shareable Link tab for now.');
        return;
      }
      toast.error(error.response?.data?.detail || 'Failed to invite user');
    },
  });
}

