'use client';

import React from 'react';
import { Shuffle } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { VIBES } from '@/lib/createPactFlow/content';

export default function VibeStep() {
  const { draft, pickVibe, surpriseMe } = useCreatePactFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">What&apos;s the vibe?</h1>
      <p className="mt-1 text-sm">Pick the energy behind this pact.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {VIBES.map((vibe) => {
          const selected = draft.vibeId === vibe.id;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => pickVibe(vibe.id)}
              className={`pact-tile flex flex-col items-start gap-1 rounded-2xl p-4 text-left ${selected ? 'selected' : ''}`}
            >
              <span className="text-2xl">{vibe.emoji}</span>
              <span className="font-semibold">{vibe.label}</span>
              <span className="text-xs" style={{ color: 'var(--pact-text-muted)' }}>
                {vibe.tagline}
              </span>
            </button>
          );
        })}
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
