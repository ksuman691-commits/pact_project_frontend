'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';

const RESPOND_BY_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
];

const COMPLETE_BY_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
];

export default function TimingStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-[32px] font-extrabold leading-[1.04] tracking-[-0.035em] text-[var(--pact-text)] text-balance">Set the clock</h1>
      <p className="mt-2 text-sm text-[var(--pact-text-dim)]">Dares are quick. Anything longer is a pact.</p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs text-[var(--pact-text-dim)]">
            <Clock className="h-4 w-4" />
            Time to accept
          </label>
          <div className="flex flex-wrap gap-2">
            {RESPOND_BY_OPTIONS.map((option) => (
              <button
                key={option.hours}
                type="button"
                onClick={() => updateDraft({ respondByHours: option.hours })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  draft.respondByHours === option.hours ? '' : 'bg-[var(--pact-surface)] text-[var(--pact-text-dim)] hover:bg-[var(--pact-surface-2)]'
                }`}
                style={draft.respondByHours === option.hours ? { background: 'var(--pact-pink)', color: 'var(--pact-bg)' } : undefined}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--pact-text-faint)]">They have {draft.respondByHours} {draft.respondByHours === 1 ? 'hour' : 'hours'} to say yes or no</p>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-xs text-[var(--pact-text-dim)]">
            <Clock className="h-4 w-4" />
            Time to do it
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPLETE_BY_OPTIONS.map((option) => (
              <button
                key={option.hours}
                type="button"
                onClick={() => updateDraft({ completeByHours: option.hours })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  draft.completeByHours === option.hours ? '' : 'bg-[var(--pact-surface)] text-[var(--pact-text-dim)] hover:bg-[var(--pact-surface-2)]'
                }`}
                style={draft.completeByHours === option.hours ? { background: 'var(--pact-pink)', color: 'var(--pact-bg)' } : undefined}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--pact-text-faint)]">Their clock starts when they accept, so they always get {draft.completeByHours} hours</p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          className=" w-full rounded-full py-3 font-bold"
          style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
