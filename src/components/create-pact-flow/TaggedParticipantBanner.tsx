'use client';

import React from 'react';
import Avatar from '@/components/Avatar';
import { useUser } from '@/hooks/useUserQueries';

/**
 * Persistent context banner shown across every step of the Create Pact flow
 * when it was launched from a specific user's "Create a Pact with [Name]"
 * CTA (e.g. from a shared-circle profile). Confirms that person is already
 * attached to this pact so the flow never needs to re-ask a generic
 * "who's watching"-style audience question.
 */
export default function TaggedParticipantBanner({ userId }: { userId: number }) {
  const { data, isLoading } = useUser(userId);
  const user = data?.data;

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
        style={{ background: 'var(--pact-surface)' }}
      >
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full" style={{ background: 'var(--pact-hairline)' }} />
        <div className="h-3 w-32 animate-pulse rounded" style={{ background: 'var(--pact-hairline)' }} />
      </div>
    );
  }

  if (!user) return null;

  const name = user.full_name || user.username || 'this person';

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ background: 'var(--pact-surface)' }}
    >
      <Avatar name={name} avatarUrl={user.avatar_url} size={32} />
      <p className="text-sm">
        Creating pact with <span className="font-semibold">{name}</span>
      </p>
    </div>
  );
}
