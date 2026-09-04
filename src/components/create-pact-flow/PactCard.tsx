'use client';

import React from 'react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { generateDescription, generateTitle, resolveDurationDays } from '@/lib/createPactFlow/generate';
import { useCircles } from '@/hooks/useCircles';

export default function PactCard() {
  const { draft, activity } = useCreatePactFlow();
  const { data: circles } = useCircles();
  const title = generateTitle(draft, activity);
  const description = generateDescription(draft);
  const durationDays = resolveDurationDays(draft);

  // draft.audience is the generic AUDIENCES category label ('Just me' /
  // 'My Circle' / 'Everyone'), and the 'My Circle' preset's own visibility
  // is also literally the string 'My Circle' — so naively rendering
  // `${draft.audience} · ${draft.visibility}` always showed the doubled
  // placeholder "My Circle · My Circle" and never surfaced which circle was
  // actually selected (that's only tracked separately via draft.circleId).
  // Resolve the real circle name here so users can confirm exactly where
  // the pact is going before committing.
  const selectedCircleName =
    draft.audience === 'My Circle' && draft.circleId != null
      ? Array.isArray(circles)
        ? circles.find((c: any) => c.id === draft.circleId)?.name
        : undefined
      : undefined;
  // Defensive fallback: AudienceStep should never leave audience === 'My
  // Circle' with no resolvable circleId (see its hasNoCircles handling),
  // but if it ever did, fall back to a generic "Circle" label instead of
  // re-doubling draft.audience against draft.visibility below (both are
  // literally the string 'My Circle' for this preset).
  const audienceLabel = selectedCircleName ?? (draft.audience === 'My Circle' ? 'Circle' : draft.audience) ?? '—';

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
        <MetaRow label="Audience" value={`${audienceLabel} · ${draft.visibility}`} />
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
