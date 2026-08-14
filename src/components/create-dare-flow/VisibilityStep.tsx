'use client';

import React from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import type { DareDraft } from '@/types/createDareFlow';

const OPTIONS: { id: DareDraft['visibility']; label: string; desc: string }[] = [
  { id: 'public', label: 'Public', desc: 'Anyone can see and claim it' },
  { id: 'private', label: 'Private', desc: 'Only people you invite can see it' },
];

export default function VisibilityStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();

  const handleSelect = (id: DareDraft['visibility']) => {
    updateDraft({ visibility: id });
    // Public needs no follow-up screen — advance immediately. Private opens
    // a recipients screen next, so let the user tap Continue instead of
    // auto-advancing into a search field.
    if (id === 'public') goNext();
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Who&apos;s in?</h1>
      <p className="mt-2 text-sm text-[var(--pact-text-dim)]">Choose who can see this dare.</p>

      <div className="mt-6 space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            className={`pact-tile w-full rounded-[28px] p-4 text-left ${draft.visibility === opt.id ? 'selected' : ''}`}
          >
            <p className="font-semibold text-[var(--pact-text)]">{opt.label}</p>
            <p className="text-sm text-[var(--pact-text-dim)]">{opt.desc}</p>
          </button>
        ))}
      </div>

      {draft.visibility === 'private' && (
        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={goNext}
            className="pact-btn-glow w-full rounded-full py-3 font-bold"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
