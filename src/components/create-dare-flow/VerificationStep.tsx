'use client';

import React from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import type { DareDraft } from '@/types/createDareFlow';

const METHODS: { id: DareDraft['verificationMethod']; label: string; description: string }[] = [
  { id: 'photo', label: 'Photo', description: 'They post a photo to the dare' },
  { id: 'video', label: 'Video', description: 'They post a short video to the dare' },
];

export default function VerificationStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">How should they prove it?</h1>
      <p className="mt-2 text-sm text-[var(--pact-text-dim)]">You&apos;ll see it and mark the dare done or not done.</p>

      <div className="mt-6 space-y-2">
        {METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => {
              updateDraft({ verificationMethod: method.id });
              goNext();
            }}
            className={`pact-tile w-full rounded-[28px] p-4 text-left ${draft.verificationMethod === method.id ? 'selected' : ''}`}
          >
            <p className="font-semibold text-[var(--pact-text)]">{method.label}</p>
            <p className="text-sm text-[var(--pact-text-dim)]">{method.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
