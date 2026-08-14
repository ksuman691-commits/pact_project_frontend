'use client';

import { useMemo, useState } from 'react';
import type { SuggestedPact, VibeId } from '@/types/createPactFlow';
import { getSuggestedPacts, getSocialProofLine } from '@/lib/createPactFlow/suggestedPacts';

interface SuggestedPactsSectionProps {
  justPickedVibeId: VibeId | null;
  justCreatedActivityLabel: string | null;
}

/**
 * Mock-data social-proof tray shown on the Success screen — spec §9.
 * No real ranking backend for v1; client-side scoring lives in
 * lib/createPactFlow/suggestedPacts.ts.
 */
export default function SuggestedPactsSection({
  justPickedVibeId,
  justCreatedActivityLabel,
}: SuggestedPactsSectionProps) {
  const suggestions = useMemo(
    () => getSuggestedPacts(justPickedVibeId, justCreatedActivityLabel),
    [justPickedVibeId, justCreatedActivityLabel],
  );
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-10 w-full">
      <h3 className="pact-mono text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pact-gold)' }}>
        Suggested for you
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        {suggestions.map((pact) => (
          <SuggestedPactCard
            key={pact.pactId}
            pact={pact}
            joined={Boolean(joined[pact.pactId])}
            onToggle={() =>
              setJoined((prev) => ({ ...prev, [pact.pactId]: !prev[pact.pactId] }))
            }
          />
        ))}
      </div>
    </div>
  );
}

function SuggestedPactCard({
  pact,
  joined,
  onToggle,
}: {
  pact: SuggestedPact;
  joined: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pact-surface flex items-center gap-3 rounded-2xl p-4">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ background: 'var(--pact-surface-raised)' }}
      >
        {pact.creator.avatarEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--pact-text)]">{pact.title}</p>
        <p className="pact-mono mt-0.5 text-xs text-[var(--pact-text-muted)]">
          {getSocialProofLine(pact)}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={joined}
        className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
        style={
          joined
            ? { background: 'transparent', border: '1px solid var(--pact-hairline)', color: 'var(--pact-text-muted)' }
            : { background: 'var(--pact-violet)', color: 'var(--pact-text)' }
        }
      >
        {joined ? 'Undo' : 'Join'}
      </button>
    </div>
  );
}
