'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { PROOF_FREQUENCIES } from '@/lib/createPactFlow/content';
import { generateDescription } from '@/lib/createPactFlow/generate';
import type { ProofMethod } from '@/types/createPactFlow';
import Chip, { FieldLabel } from './Chip';

export const PROOF_METHOD_LABELS: Record<ProofMethod, string> = {
  Moment: 'Photo or video',
  Photo: 'Photo',
  Video: 'Video',
  'Check-in': 'Check-in',
  'Activity data': 'Activity data',
};

const PROOF_METHOD_LIST: ProofMethod[] = ['Moment', 'Photo', 'Video', 'Check-in', 'Activity data'];

const FIELD_CLASS =
  'mt-2 w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] focus:border-[var(--navy)] focus:outline-none';

/**
 * "Customize pact" — collapsed by default. Holds the proof method and
 * frequency (defaults: a daily photo or video moment), plus description,
 * start date and reminders.
 */
export default function CustomizePanel() {
  const { draft, activity, updateDraft, selectProofMethod, selectProofFrequency } = useCreatePactFlow();
  const [open, setOpen] = useState(false);

  const generatedDescription = generateDescription({ ...draft, descriptionOverride: undefined });
  const todayIso = new Date().toISOString().slice(0, 10);
  // Milestone pacts take a single proof regardless, so frequency is moot.
  const showFrequency = draft.proofMethod !== 'Activity data' && !activity?.milestone;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm font-bold text-[var(--muted)]"
      >
        Customize pact
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-5 rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] p-4">
          <div>
            <FieldLabel>Proof method</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PROOF_METHOD_LIST.map((method) => (
                <Chip key={method} selected={draft.proofMethod === method} onClick={() => selectProofMethod(method)}>
                  {PROOF_METHOD_LABELS[method]}
                </Chip>
              ))}
            </div>
          </div>

          {showFrequency && (
            <div>
              <FieldLabel>How often</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {PROOF_FREQUENCIES.map((freq) => (
                  <Chip key={freq} selected={draft.proofFrequency === freq} onClick={() => selectProofFrequency(freq)}>
                    {freq}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="pact-description" className="text-[13px] font-bold text-[var(--muted)]">
              Description
            </label>
            <textarea
              id="pact-description"
              rows={2}
              value={draft.descriptionOverride ?? ''}
              onChange={(e) => updateDraft({ descriptionOverride: e.target.value })}
              placeholder={generatedDescription}
              maxLength={140}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="pact-start-date" className="text-[13px] font-bold text-[var(--muted)]">
              Start date
            </label>
            <input
              id="pact-start-date"
              type="date"
              min={todayIso}
              value={draft.startDate ?? todayIso}
              onChange={(e) => updateDraft({ startDate: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Reminders</span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.remindersEnabled}
              aria-label="Reminders"
              onClick={() => updateDraft({ remindersEnabled: !draft.remindersEnabled })}
              className={`relative h-6 w-11 rounded-full transition-colors ${draft.remindersEnabled ? 'bg-[var(--navy)]' : 'bg-[var(--hairline)]'}`}
            >
              <span
                className="absolute top-0.5 size-5 rounded-full bg-[var(--card)] transition-transform"
                style={{ transform: draft.remindersEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
