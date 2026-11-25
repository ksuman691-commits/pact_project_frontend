'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { circleAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

/**
 * User ids with a pending invite to this circle (GET /api/circles/{id}/invites,
 * members only). Anyone in here shows "Invited" and can't be invited again.
 * An older backend without the endpoint just means an empty list.
 */
export function usePendingCircleInvites(circleId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.circles.invites(circleId),
    queryFn: async (): Promise<number[]> => {
      try {
        const response = await circleAdvancedService.listInvites(circleId);
        return (response.data || []).map((invite: { invited_user_id: number }) => invite.invited_user_id);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 403 || status === 404 || status === 405) return [];
        throw error;
      }
    },
    enabled: enabled && Number.isFinite(circleId),
    staleTime: 30_000,
  });
}

export function useInviteUserToCircle(circleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: number; message?: string }) =>
      circleAdvancedService.inviteUser(circleId, data.userId, data.message),
    onSuccess: (_response, variables) => {
      // Mark them invited at once, then refresh from the server.
      queryClient.setQueryData<number[]>(queryKeys.circles.invites(circleId), (ids = []) =>
        ids.includes(variables.userId) ? ids : [...ids, variables.userId],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.members(circleId) });
      toast.success('Invite sent');
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

