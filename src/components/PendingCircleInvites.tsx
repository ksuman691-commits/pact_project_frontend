'use client';

import { useMyCircleInvites, useAcceptCircleInvite, useDeclineCircleInvite } from '@/hooks/useCircleInvites';

/**
 * Recipient-side counterpart to the "Search for someone" invite tab in
 * InviteMembersModal. Backed by GET /api/users/me/circle-invites, which
 * returns flat records (circle_id, invited_by_user_id) enriched by
 * useMyCircleInvites into { ...invite, circle, inviter }. If the list
 * endpoint isn't deployed, useMyCircleInvites swallows a 404 into an empty
 * list, so this renders nothing rather than a broken state.
 */
export default function PendingCircleInvites() {
  const { data: invites, isLoading } = useMyCircleInvites();
  const acceptMutation = useAcceptCircleInvite();
  const declineMutation = useDeclineCircleInvite();

  const list = (invites || []) as any[];

  if (isLoading || list.length === 0) return null;

  return (
    <section aria-label="Circle invitations" className="mx-6">
      {list.map((invite: any) => {
        const circleName = invite.circle?.name || 'a circle';
        const inviterName = invite.inviter?.full_name || invite.inviter?.username || 'Someone';
        const accepting = acceptMutation.isPending && acceptMutation.variables?.inviteId === invite.id;
        const declining = declineMutation.isPending && declineMutation.variables?.inviteId === invite.id;
        return (
          <div key={invite.id} className="flex items-center gap-3 border-b border-[var(--hairline)] py-3.5">
            <p className="min-w-0 flex-1 text-[14px] leading-[1.35] text-[var(--ink)]">
              <span className="font-semibold">{inviterName}</span> invited you to <span className="font-semibold">{circleName}</span>
            </p>
            <button
              type="button"
              onClick={() => declineMutation.mutate({ circleId: invite.circle_id, inviteId: invite.id })}
              disabled={accepting || declining}
              className="h-11 px-2 text-[14px] text-[var(--muted)] disabled:opacity-60"
              aria-label={`Decline invite to ${circleName}`}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => acceptMutation.mutate({ circleId: invite.circle_id, inviteId: invite.id })}
              disabled={accepting || declining}
              className="h-11 rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)] disabled:opacity-60"
              aria-label={`Accept invite to ${circleName}`}
            >
              {accepting ? 'Joining…' : 'Join'}
            </button>
          </div>
        );
      })}
    </section>
  );
}
