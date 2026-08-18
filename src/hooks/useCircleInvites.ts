'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circleInviteService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

const CIRCLE_INVITES_KEY = ['circleInvites', 'mine'];

/**
 * Pending invites sent to the current user via the (not-yet-deployed)
 * direct-invite flow. GET /api/users/me/circle-invites doesn't exist on
 * the live backend yet — it's being built alongside POST
 * /api/circles/{id}/invite by the backend developer. A 404 here just
 * means "not deployed yet", so it's swallowed into an empty list rather
 * than surfaced as an error — the "Pending invites" card on /circles
 * simply stays hidden until the endpoint is live, instead of showing a
 * broken state.
 */
export function useMyCircleInvites() {
  return useQuery({
    queryKey: CIRCLE_INVITES_KEY,
    queryFn: async () => {
      try {
        const response = await circleInviteService.listMine();
        return response.data || [];
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 501) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useAcceptCircleInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: number) => circleInviteService.accept(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_INVITES_KEY });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.all });
      toast.success('Joined circle!');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 404 || status === 501) {
        toast.error('Invites are launching soon — this one isn\u2019t live yet.');
        return;
      }
      toast.error(error?.response?.data?.detail || 'Failed to accept invite');
    },
  });
}

export function useDeclineCircleInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: number) => circleInviteService.decline(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIRCLE_INVITES_KEY });
      toast.success('Invite declined');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 404 || status === 501) {
        toast.error('Invites are launching soon — this one isn\u2019t live yet.');
        return;
      }
      toast.error(error?.response?.data?.detail || 'Failed to decline invite');
    },
  });
}
