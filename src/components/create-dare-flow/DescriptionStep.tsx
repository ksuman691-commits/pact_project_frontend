'use client';

import React, { useState } from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { detectsMultiDayLanguage } from '@/lib/createDareFlow/detectMultiDay';
import MultiDayNudge from './MultiDayNudge';

export default function DescriptionStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const showNudge = !nudgeDismissed && detectsMultiDayLanguage(draft.description);

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Add the details</h1>
      <p className="mt-2 text-sm text-[var(--pact-text-dim)]">Tell them exactly what counts as done.</p>

      <textarea
        autoFocus
        value={draft.description}
        onChange={(e) => {
          updateDraft({ description: e.target.value });
          if (nudgeDismissed) setNudgeDismissed(false);
        }}
        placeholder="Tell them more about the dare..."
        rows={6}
        className="mt-6 w-full resize-none rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] px-4 py-3 text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
      />

      {showNudge && <MultiDayNudge sourceText={draft.description} onDismiss={() => setNudgeDismissed(true)} />}

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={!draft.description.trim()}
          className="pact-btn-glow w-full rounded-full py-3 font-bold disabled:opacity-40"
          style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
