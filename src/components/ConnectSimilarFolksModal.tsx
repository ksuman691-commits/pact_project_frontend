'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader, Sparkles, Users, X } from 'lucide-react';
import { VIBES } from '@/lib/createPactFlow/content';
import { VIBE_TO_CATEGORY } from '@/lib/createPactFlow/toApiPayload';
import { useCategoryMatches } from '@/hooks/useCategoryMatches';
import Avatar from '@/components/Avatar';
import type { VibeId } from '@/types/createPactFlow';

interface ConnectSimilarFolksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Standalone entry point into the same mutual-goal matching signal that
 * previously only surfaced on an already-created pact's card
 * (GoalMatchStrip). No pact required — pick a category, see who (known or
 * unknown) is chasing it, and start a circle with them directly. Reuses
 * the existing /circles/create?inviteUserId= invite flow (single-id path
 * used elsewhere e.g. AddToCircleSheet) rather than inventing a new one.
 */
function ResultsStep({ vibeId, onBack, onClose }: { vibeId: VibeId; onBack: () => void; onClose: () => void }) {
  const router = useRouter();
  const vibe = VIBES.find((v) => v.id === vibeId)!;
  const category = VIBE_TO_CATEGORY[vibeId];
  const matchesQuery = useCategoryMatches(category);
  const matches = matchesQuery.data;
  const people = matches?.people ?? [];
  const known = people.filter((p) => p.known);
  const unknown = people.filter((p) => !p.known);

  const startCircleWith = (userId: number) => {
    onClose();
    router.push(`/circles/create?inviteUserId=${userId}&category=${encodeURIComponent(category)}`);
  };

  const startCircleWithAll = () => {
    onClose();
    const ids = people.map((p) => p.id).join(',');
    router.push(`/circles/create?inviteUserId=${ids}&category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-[var(--pact-hairline)] p-6 pb-4">
        <button onClick={onBack} className="text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text)]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[var(--pact-text)]">
            {vibe.emoji} {vibe.label}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--pact-text-faint)]">People chasing this goal right now</p>
        </div>
        <button onClick={onClose} className="text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text)]">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {matchesQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--pact-violet)' }} />
          </div>
        ) : people.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center" style={{ color: 'var(--pact-text-faint)' }}>
            <Users className="h-6 w-6" />
            <p className="text-sm">Nobody&apos;s chasing this goal publicly yet.</p>
            <p className="text-xs">Create a pact in this category and be the first.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {known.length > 0 && (
              <PersonGroup title="People you know" people={known} onStartCircle={startCircleWith} />
            )}
            {unknown.length > 0 && (
              <PersonGroup title="On the platform" people={unknown} onStartCircle={startCircleWith} />
            )}
          </div>
        )}
      </div>

      {people.length > 1 && (
        <div className="border-t border-[var(--pact-hairline)] p-4">
          <button
            type="button"
            onClick={startCircleWithAll}
            className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
          >
            <Users className="h-4 w-4" />
            Start a circle with all {people.length}
          </button>
        </div>
      )}
    </>
  );
}

function PersonGroup({
  title,
  people,
  onStartCircle,
}: {
  title: string;
  people: { id: number; username: string; fullName: string | null; avatarUrl: string | null }[];
  onStartCircle: (userId: number) => void;
}) {
  return (
    <div>
      <p className="px-1 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">{title}</p>
      <div className="flex flex-col gap-2">
        {people.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-3 rounded-2xl p-3"
            style={{ background: 'var(--pact-surface-2)' }}
          >
            <Avatar name={person.fullName || person.username} avatarUrl={person.avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--pact-text)]">{person.fullName || person.username}</p>
              {person.username && <p className="truncate text-xs text-[var(--pact-text-faint)]">@{person.username}</p>}
            </div>
            <button
              type="button"
              onClick={() => onStartCircle(person.id)}
              className="shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
            >
              Start a circle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryPickerStep({ onPick, onClose }: { onPick: (vibeId: VibeId) => void; onClose: () => void }) {
  return (
    <>
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--pact-text)]">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--pact-gold)' }} />
            Connect with similar folks
          </h2>
          <p className="mt-0.5 text-xs text-[var(--pact-text-faint)]">Pick a goal category to see who else is on it</p>
        </div>
        <button onClick={onClose} className="shrink-0 text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text)]">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 pt-0">
        {VIBES.map((vibe) => (
          <button
            key={vibe.id}
            type="button"
            onClick={() => onPick(vibe.id)}
            className="pact-tile flex flex-col items-start gap-1 rounded-2xl p-4 text-left"
          >
            <span className="text-xl">{vibe.emoji}</span>
            <span className="font-semibold text-[var(--pact-text)]">{vibe.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function ConnectSimilarFolksModal({ isOpen, onClose }: ConnectSimilarFolksModalProps) {
  const [selectedVibe, setSelectedVibe] = useState<VibeId | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedVibe(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={handleClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[28px] md:rounded-[28px]"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
        onClick={(event) => event.stopPropagation()}
      >
        {selectedVibe ? (
          <ResultsStep vibeId={selectedVibe} onBack={() => setSelectedVibe(null)} onClose={handleClose} />
        ) : (
          <CategoryPickerStep onPick={setSelectedVibe} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}
