'use client';

import { Check, X, Loader, Mail } from 'lucide-react';
import { useMyCircleInvites, useAcceptCircleInvite, useDeclineCircleInvite } from '@/hooks/useCircleInvites';
import Avatar from '@/components/Avatar';

/**
 * Recipient-side counterpart to the "Search for someone" invite tab in
 * InviteMembersModal. Backed by GET /api/users/me/circle-invites, which
 * doesn't exist on the live backend yet (being built alongside the
 * direct-invite endpoint — see the NOTE on circleAdvancedService.inviteUser).
 * useMyCircleInvites swallows a 404 into an empty list, so this card
 * simply renders nothing until the backend is deployed, rather than
 * showing a broken or empty-looking section.
 */
export default function PendingCircleInvites() {
  const { data: invites, isLoading } = useMyCircleInvites();
  const acceptMutation = useAcceptCircleInvite();
  const declineMutation = useDeclineCircleInvite();

  const list = (invites || []) as any[];

  if (isLoading || list.length === 0) return null;

  return (
    <section
      className="mb-6 rounded-2xl border p-5"
      style={{ background: 'var(--pact-surface)', borderColor: 'var(--pact-hairline)' }}
    >
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" style={{ color: 'var(--pact-violet)' }} />
        <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-violet)]">
          Pending invites
        </h2>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {list.map((invite: any) => {
          const circleName = invite.circle?.name || invite.circle_name || 'a circle';
          const inviterName = invite.invited_by?.full_name || invite.invited_by?.username || invite.inviter_name;
          const accepting = acceptMutation.isPending && acceptMutation.variables === invite.id;
          const declining = declineMutation.isPending && declineMutation.variables === invite.id;
          return (
            <div key={invite.id} className="flex items-center gap-3">
              <Avatar name={circleName} avatarUrl={invite.circle?.icon_url} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--pact-text)]">{circleName}</p>
                {inviterName && (
                  <p className="truncate text-xs text-[var(--pact-text-faint)]">Invited by {inviterName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => declineMutation.mutate(invite.id)}
                disabled={accepting || declining}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60"
                style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text-muted)' }}
                aria-label={`Decline invite to ${circleName}`}
              >
                {declining ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => acceptMutation.mutate(invite.id)}
                disabled={accepting || declining}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                aria-label={`Accept invite to ${circleName}`}
              >
                {accepting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
