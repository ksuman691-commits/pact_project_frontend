'use client';

import React from 'react';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { useAuthStore } from '@/store/auth';
import { useFollowing } from '@/hooks/useFollows';
import Avatar from '@/components/Avatar';

/**
 * Reuses the existing "who you follow" list as the invite pool rather than
 * building a dedicated people-recommendation service — same principle as
 * SuggestedPactsSection reusing /api/feed discover for Suggested Pacts.
 */
export default function InviteStep() {
  const { draft, toggleInvite, confirmInvites } = useCreateCircleFlow();
  const { user } = useAuthStore();
  const { data, isLoading } = useFollowing(user?.id);

  const people = Array.isArray(data?.data) ? data!.data : Array.isArray(data) ? data : [];

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Bring some people in.</h1>
      <p className="mt-1 text-sm">Optional — you can invite more later.</p>

      <div className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
        {isLoading && (
          <p className="text-sm" style={{ color: 'var(--pact-text-muted)' }}>
            Loading people you follow…
          </p>
        )}
        {!isLoading && people.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--pact-text-muted)' }}>
            You&apos;re not following anyone yet — you can invite people once the circle exists.
          </p>
        )}
        {people.map((person: any) => {
          const selected = draft.inviteUserIds.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => toggleInvite(person.id)}
              className={`pact-tile flex w-full items-center gap-3 rounded-2xl p-3 text-left ${selected ? 'selected' : ''}`}
            >
              <Avatar name={person.username || person.full_name} avatarUrl={person.avatar_url} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{person.full_name || person.username}</span>
                <span className="pact-mono block truncate text-xs" style={{ color: 'var(--pact-text-muted)' }}>
                  @{person.username}
                </span>
              </span>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                style={{
                  borderColor: selected ? 'var(--flow-accent)' : 'var(--pact-hairline)',
                  background: selected ? 'var(--flow-accent)' : 'transparent',
                  color: 'var(--pact-bg)',
                }}
              >
                {selected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={confirmInvites}
        className="mt-6 w-full rounded-full px-6 py-3.5 text-center text-sm font-semibold text-[var(--pact-bg)]"
        style={{ background: 'linear-gradient(135deg, var(--flow-accent), var(--flow-accent-2))' }}
      >
        {draft.inviteUserIds.length > 0 ? `Continue with ${draft.inviteUserIds.length} →` : 'Skip →'}
      </button>
    </div>
  );
}
