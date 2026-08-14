'use client';

import React from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';

export default function TitleStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Dare someone</h1>
      <p className="mt-2 text-sm text-[var(--pact-text-dim)]">What&apos;s the challenge?</p>

      <input
        autoFocus
        type="text"
        value={draft.title}
        onChange={(e) => updateDraft({ title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) goNext();
        }}
        placeholder="e.g., Run 5k in under 30 minutes"
        className="mt-6 w-full rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] px-4 py-3 text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
      />

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={!draft.title.trim()}
          className="pact-btn-glow w-full rounded-full py-3 font-bold disabled:opacity-40"
          style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
