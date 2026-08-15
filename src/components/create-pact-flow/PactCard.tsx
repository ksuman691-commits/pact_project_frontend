'use client';

import React from 'react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { generateDescription, generateTitle, resolveDurationDays } from '@/lib/createPactFlow/generate';

export default function PactCard() {
  const { draft, activity } = useCreatePactFlow();
  const title = generateTitle(draft, activity);
  const description = generateDescription(draft);
  const durationDays = resolveDurationDays(draft);

  return (
    <div className="pact-surface rounded-3xl p-6">
      <span
        className="pact-mono text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--pact-gold)' }}
      >
        Your Pact
      </span>
      <h2 className="mt-2 text-2xl font-bold leading-snug">{title}</h2>
      <p className="mt-2 text-sm italic">&ldquo;{description}&rdquo;</p>

      <div className="mt-5 flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--pact-hairline)' }}>
        <MetaRow label="Duration" value={`${durationDays} Days`} />
        <MetaRow
          label="Proof"
          value={
            draft.proofMethod === 'Activity data'
              ? 'Activity data · Synced automatically'
              : `${draft.proofMethod ?? '—'} · ${draft.proofFrequency ?? '—'}`
          }
        />
        <MetaRow label="Audience" value={`${draft.audience ?? '—'} · ${draft.visibility}`} />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--pact-text-muted)' }}>{label}</span>
      <span className="pact-mono font-medium">{value}</span>
    </div>
  );
}
