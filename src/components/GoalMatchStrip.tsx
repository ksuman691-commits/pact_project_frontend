'use client';

import React from 'react';
import { Users } from 'lucide-react';
import Avatar from './Avatar';
import type { PactMatch } from '@/types';

// Mirrors VIBE_TO_CATEGORY's reverse mapping loosely — just a display label,
// not used for any matching logic (matching itself is exact-enum equality
// on the raw category string, done server-side).
const CATEGORY_LABELS: Record<string, string> = {
  fitness: 'fitness',
  startup: 'startup',
  coding: 'coding',
  creator: 'creator',
  study: 'study',
  habits: 'habits',
  social: 'social',
};

function AvatarStack({ matches }: { matches: PactMatch[] }) {
  return (
    <div className="flex -space-x-2">
      {matches.slice(0, 4).map((match) => (
        <div key={match.user_id} className="rounded-full ring-2 ring-[var(--pact-surface)]">
          <Avatar name={match.full_name || match.username} avatarUrl={match.avatar_url} size={28} />
        </div>
      ))}
    </div>
  );
}

interface GoalMatchStripProps {
  matches: PactMatch[];
  totalCount: number;
  category?: string;
  variant: 'feed' | 'discover';
  onStartCircle: () => void;
}

/**
 * Shared "someone else is on the same goal" surface for the Feed strip
 * (the viewer's own pact) and the Discover banner (a public pact being
 * browsed/swiped). Renders null whenever there are no matches — covers both
 * the not-yet-live-backend graceful fallback and the genuine "nobody else
 * yet" case, so callers never need to branch on that themselves.
 */
export default function GoalMatchStrip({ matches, totalCount, category, variant, onStartCircle }: GoalMatchStripProps) {
  if (matches.length === 0) return null;

  const categoryLabel = category ? CATEGORY_LABELS[category] || category : 'same';

  if (variant === 'feed') {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onStartCircle();
        }}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] px-3 py-2.5 text-left transition hover:border-[var(--pact-violet)]/60"
      >
        <AvatarStack matches={matches} />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--pact-text-dim)]">
          <span className="text-[var(--pact-text)]">{totalCount}</span> other{totalCount === 1 ? '' : 's'} on the same{' '}
          {categoryLabel} goal right now
        </p>
      </button>
    );
  }

  const firstNames = matches
    .slice(0, 3)
    .map((match) => (match.full_name || match.username || '').split(' ')[0])
    .filter(Boolean);

  return (
    <div
      className="mx-4 mt-3 rounded-2xl border px-4 py-3"
      style={{ borderColor: 'var(--pact-violet)', background: 'linear-gradient(135deg, rgba(255,79,135,0.08), rgba(157,92,255,0.08))' }}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[var(--pact-violet)]">
        <Users className="h-3.5 w-3.5" />
        Same goal, different circle
      </p>
      <div className="mt-2 flex items-center gap-3">
        <AvatarStack matches={matches} />
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-[var(--pact-text-dim)]">
          {firstNames.join(', ')}
          {totalCount > firstNames.length ? ` +${totalCount - firstNames.length} more` : ''} {totalCount === 1 ? 'is' : 'are'} also working on {categoryLabel} goals.
        </p>
      </div>
      <button
        type="button"
        onClick={onStartCircle}
        className="pact-btn-glow mt-3 w-full rounded-full px-4 py-2 text-xs font-bold text-[var(--pact-text)]"
        style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
      >
        + Start a circle with them
      </button>
    </div>
  );
}
