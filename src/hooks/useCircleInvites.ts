'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circleInviteService, circleService, userService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

const CIRCLE_INVITES_KEY = ['circleInvites', 'mine'];

/**
 * Pending invites sent to the current user via the direct-invite flow
 * (POST /api/circles/{id}/invite on the sending side). GET
 * /api/users/me/circle-invites returns flat records — just
 * { id, circle_id, invited_by_user_id, status, created_at } — with no
 * nested circle/inviter details, so each invite is enriched here with a
 * circleService.getById + userService.getById lookup to get the circle
 * name/emoji and inviter name for display. A 404/501 on the list
 * endpoint itself still means "not deployed" and is swallowed into an
 * empty list so the card stays hidden rather than erroring.
 */
export function useMyCircleInvites() {
  return useQuery({
    queryKey: CIRCLE_INVITES_KEY,
    queryFn: async () => {
      let invites: any[];
      try {
        const response = await circleInviteService.listMine();
        invites = response.data || [];
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 501) {
          return [];
        }
        throw error;
      }

      const pending = invites.filter((invite) => invite.status === 'pending');

      const enriched = await Promise.all(
        pending.map(async (invite) => {
          const [circleResult, inviterResult] = await Promise.allSettled([
            circleService.getById(invite.circle_id),
            userService.getById(invite.invited_by_user_id),
          ]);

          const circle = circleResult.status === 'fulfilled' ? circleResult.value.data : null;
          const inviter = inviterResult.status === 'fulfilled' ? inviterResult.value.data : null;

          return {
            ...invite,
            circle,
            inviter,
          };
        })
      );

      return enriched;
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
