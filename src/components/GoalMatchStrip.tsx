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
 *
 * Self-labels with a "Discover" heading + violet-tinted card treatment
 * (rather than relying on callers to add distinguishing chrome) so this
 * never gets visually confused with an actual pact-participants list —
 * these are OTHER people on similar goals, not members of this pact. On
 * the pact detail page in particular this strip sits right next to the
 * real "Participants" count, which uses plain neutral styling with no
 * heading, so without an explicit label of its own a skimming user could
 * easily misread these avatars as additional participants.
 */
export default function GoalMatchStrip({ matches, totalCount, category, variant, onStartCircle }: GoalMatchStripProps) {
  if (matches.length === 0) return null;

  const categoryLabel = category ? CATEGORY_LABELS[category] || category : 'same';

  const label = (
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--pact-violet)]">
      <Users className="h-3 w-3" />
      Discover · not participants
    </p>
  );

  if (variant === 'feed') {
    return (
      <div className="mt-3 space-y-1.5">
        {label}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStartCircle();
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--pact-violet)]/30 bg-[var(--pact-violet)]/8 px-3 py-2.5 text-left transition hover:border-[var(--pact-violet)]/60"
        >
          <AvatarStack matches={matches} />
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--pact-text-dim)]">
            <span className="text-[var(--pact-text)]">{totalCount}</span> other{totalCount === 1 ? '' : 's'} on the same{' '}
            {categoryLabel} goal right now
          </p>
        </button>
      </div>
    );
  }

  const firstNames = matches
    .slice(0, 3)
    .map((match) => (match.full_name || match.username || '').split(' ')[0])
    .filter(Boolean);

  return (
    <div className="mx-4 mt-3 w-[calc(100%-2rem)] space-y-1.5">
      {label}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onStartCircle();
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-[var(--pact-violet)]/30 bg-[var(--pact-violet)]/8 px-3 py-2.5 text-left transition hover:border-[var(--pact-violet)]/60"
      >
        <AvatarStack matches={matches} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--pact-text-dim)]">
          <span className="text-[var(--pact-text)]">Same goal</span>
          <span className="mx-1 text-[var(--pact-text-faint)]">·</span>
          {firstNames.join(', ')}{totalCount > firstNames.length ? ` +${totalCount - firstNames.length}` : ''} on {categoryLabel} goals
        </span>
        <span className="shrink-0 text-xs font-bold text-[var(--pact-violet)]">Start circle</span>
      </button>
    </div>
  );
}
