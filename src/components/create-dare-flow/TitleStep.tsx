'use client';

import React, { useState } from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { detectsMultiDayLanguage } from '@/lib/createDareFlow/detectMultiDay';
import MultiDayNudge from './MultiDayNudge';

const IDEAS = ['Run 5k in under 30 minutes', 'Cold shower for 2 minutes', 'Do 30 push-ups before lunch', 'Call an old friend today', 'Cook dinner for your family'];

export default function TitleStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const showNudge = !nudgeDismissed && detectsMultiDayLanguage(draft.title);

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-[32px] font-extrabold leading-[1.04] tracking-[-0.035em] text-[var(--pact-text)] text-balance">What&apos;s the dare?</h1>
      <p className="mt-2 text-[15px] text-[var(--pact-text-dim)]">One challenge, one person, done within a day or two.</p>

      <textarea
        autoFocus
        rows={2}
        maxLength={80}
        value={draft.title}
        onChange={(e) => {
          updateDraft({ title: e.target.value.replace(/\n/g, ' ') });
          if (nudgeDismissed) setNudgeDismissed(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            if (draft.title.trim()) goNext();
          }
        }}
        placeholder="Run 5k in under 30 minutes"
        aria-label="Your dare"
        className="mt-6 w-full resize-none border-0 border-b-2 border-[var(--pact-hairline)] bg-transparent px-0 pb-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--pact-text)] placeholder:text-[#C2BAA7] focus:border-[var(--navy)] focus:outline-none"
      />

      {showNudge && <MultiDayNudge sourceText={draft.title} onDismiss={() => setNudgeDismissed(true)} />}

      {!draft.title.trim() && (
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Ideas">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => updateDraft({ title: idea })}
              className="min-h-11 rounded-full border border-[var(--pact-hairline)] px-4 text-[14px] font-semibold text-[var(--pact-text)] active:scale-95"
              style={{ background: 'var(--pact-surface)' }}
            >
              {idea}
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={!draft.title.trim()}
          className="h-[52px] w-full rounded-full bg-[var(--navy)] text-[16px] font-extrabold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
