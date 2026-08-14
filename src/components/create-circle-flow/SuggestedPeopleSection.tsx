'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { useFollowing } from '@/hooks/useFollows';
import { circleAdvancedService } from '@/services/api';

/**
 * "People you might want to invite" tray on the Circle Success screen —
 * adapts the same suggestion source InviteStep uses (the existing
 * "who you follow" list) rather than building a second recommendation
 * system, mirroring how SuggestedPactsSection reuses /api/feed discover.
 */
export default function SuggestedPeopleSection({
  circleId,
  alreadyInvitedIds,
}: {
  circleId: number;
  alreadyInvitedIds: number[];
}) {
  const { user } = useAuthStore();
  const { data, isLoading } = useFollowing(user?.id);
  const [invitedIds, setInvitedIds] = useState<Record<number, boolean>>({});
  const [invitingId, setInvitingId] = useState<number | null>(null);

  const people = (Array.isArray(data?.data) ? data!.data : Array.isArray(data) ? data : []) as any[];
  const suggestions = people.filter((p) => !alreadyInvitedIds.includes(p.id)).slice(0, 3);

  if (isLoading || suggestions.length === 0) return null;

  const handleInvite = async (person: any) => {
    if (invitingId !== null || invitedIds[person.id]) return;
    setInvitingId(person.id);
    try {
      await circleAdvancedService.inviteUser(circleId, person.id);
      setInvitedIds((prev) => ({ ...prev, [person.id]: true }));
      toast.success(`Invited @${person.username}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to invite');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="mt-10 w-full">
      <h3 className="pact-mono text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pact-gold)' }}>
        People you might want to invite
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        {suggestions.map((person) => {
          const invited = Boolean(invitedIds[person.id]);
          const initial = String(person.username ?? 'U').charAt(0).toUpperCase();
          return (
            <div key={person.id} className="pact-surface flex items-center gap-3 rounded-2xl p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
                style={{ background: 'var(--pact-surface-raised)', color: 'var(--pact-text)' }}
              >
                {person.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--pact-text)]">
                  {person.full_name || person.username}
                </p>
                <p className="pact-mono mt-0.5 truncate text-xs text-[var(--pact-text-muted)]">@{person.username}</p>
              </span>
              <button
                type="button"
                onClick={() => handleInvite(person)}
                disabled={invitingId === person.id || invited}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
                style={
                  invited
                    ? { background: 'transparent', border: '1px solid var(--pact-hairline)', color: 'var(--pact-text-muted)' }
                    : { background: 'var(--pact-violet)', color: 'var(--pact-text)' }
                }
              >
                {invitingId === person.id ? '...' : invited ? 'Invited' : 'Invite'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
