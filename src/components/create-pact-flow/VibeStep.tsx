'use client';

import React from 'react';
import { Shuffle } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { VIBES } from '@/lib/createPactFlow/content';
import { VIBE_TO_CATEGORY } from '@/lib/createPactFlow/toApiPayload';
import { useCategoryMatches } from '@/hooks/useCategoryMatches';
import Avatar from '@/components/Avatar';
import type { Vibe } from '@/types/createPactFlow';

/**
 * Redesigned goal card — the emoji used to be the dominant visual element
 * (a large decorative glyph with a name underneath). Real social proof
 * converts better than decoration, so the emoji shrinks to a small
 * corner-badge marker (just enough for quick category recognition) and
 * the freed space leads with an avatar stack + a live, specific count of
 * real people pursuing this category — known circle/follow connections
 * first, falling back to the wider platform total. See
 * useCategoryMatches for how that count is derived.
 */
function VibeCard({ vibe, selected, onSelect }: { vibe: Vibe; selected: boolean; onSelect: () => void }) {
  const category = VIBE_TO_CATEGORY[vibe.id];
  const matchesQuery = useCategoryMatches(category);
  const matches = matchesQuery.data;
  const hasKnown = (matches?.knownCount ?? 0) > 0;
  const displayPeople = matches?.people ?? [];
  const displayCount = hasKnown ? matches!.knownCount : matches?.totalCount ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`pact-tile relative flex flex-col items-start gap-2 rounded-2xl p-4 text-left ${selected ? 'selected' : ''}`}
    >
      <span
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-sm"
        style={{ background: 'var(--pact-surface-2)' }}
        aria-hidden="true"
      >
        {vibe.emoji}
      </span>

      {matchesQuery.isLoading ? (
        <div className="h-[26px] w-20 animate-pulse rounded-full" style={{ background: 'var(--pact-surface-2)' }} />
      ) : displayPeople.length > 0 ? (
        <div className="flex -space-x-2">
          {displayPeople.slice(0, 3).map((person) => (
            <div key={person.id} className="rounded-full ring-2" style={{ boxShadow: '0 0 0 2px var(--pact-surface)' }}>
              <Avatar name={person.fullName || person.username} avatarUrl={person.avatarUrl} size={26} />
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-xs font-bold">
        {displayCount > 0 ? (
          <>
            <span style={{ color: 'var(--pact-gold)' }}>{displayCount}</span>{' '}
            <span style={{ color: 'var(--pact-text-muted)' }}>
              {hasKnown ? `${displayCount === 1 ? 'person' : 'people'} you know` : 'people worldwide'}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--pact-text-faint)' }}>Be the first</span>
        )}
      </p>

      <span className="font-semibold">{vibe.label}</span>
      <span className="text-xs" style={{ color: 'var(--pact-text-muted)' }}>
        {vibe.tagline}
      </span>
    </button>
  );
}

export default function VibeStep() {
  const { draft, pickVibe, surpriseMe } = useCreatePactFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">What&apos;s your goal?</h1>
      <p className="mt-1 text-sm">Pick what this pact is working toward.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {VIBES.map((vibe) => (
          <VibeCard key={vibe.id} vibe={vibe} selected={draft.vibeId === vibe.id} onSelect={() => pickVibe(vibe.id)} />
        ))}
      </div>

      <button
        type="button"
        onClick={surpriseMe}
        className="pact-tile mt-3 flex w-full items-center justify-center gap-2 rounded-2xl p-4 font-semibold"
        style={{ color: 'var(--pact-gold)' }}
      >
        <Shuffle className="h-4 w-4" />
        🎲 Surprise Me
      </button>
    </div>
  );
}
