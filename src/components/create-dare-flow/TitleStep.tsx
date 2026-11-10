'use client';

import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { detectsMultiDayLanguage } from '@/lib/createDareFlow/detectMultiDay';
import MultiDayNudge from './MultiDayNudge';

const IDEAS = ['Cold shower before 8am', 'No sugar till tomorrow night', 'Phone off at 10pm tonight', '10,000 steps today', 'Run 5k in under 30 minutes', 'Cold shower for 2 minutes', 'Do 30 push-ups before lunch', 'Call an old friend today', 'Cook dinner for your family'];

export default function TitleStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(0);
  // Shuffle drops a ready-made dare straight into the card above; type over it or shuffle again.
  const shuffle = () => {
    updateDraft({ title: IDEAS[ideaIndex % IDEAS.length] });
    setIdeaIndex((i) => i + 1);
  };

  const showNudge = !nudgeDismissed && detectsMultiDayLanguage(draft.title);

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-[32px] font-extrabold leading-[1.04] tracking-[-0.035em] text-[var(--pact-text)] text-balance">What&apos;s the dare?</h1>
      <p className="mt-2 text-[15px] text-[var(--pact-text-dim)]">One challenge, done within a day or two.</p>

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
        className="mt-6 w-full resize-none border-0 border-b-2 border-[var(--pact-hairline)] bg-transparent px-0 pb-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--pact-text)] placeholder:text-[#C2BAA7] focus:border-[var(--ink)] focus:outline-none"
      />

      {showNudge && <MultiDayNudge sourceText={draft.title} onDismiss={() => setNudgeDismissed(true)} />}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={shuffle} className="flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 text-[14px] font-bold text-[var(--dare)] active:scale-95">
          <Shuffle className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          {draft.title.trim() ? 'Shuffle again' : 'Shuffle a dare'}
        </button>
        {!draft.title.trim() &&
          IDEAS.slice(0, 3).map((idea) => (
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

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={!draft.title.trim()}
          className="h-[52px] w-full rounded-full bg-[var(--ink)] text-[16px] font-bold text-[var(--dare)] disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
