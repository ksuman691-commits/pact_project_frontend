'use client';

import React, { useState } from 'react';
import { Plus, Shuffle } from 'lucide-react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { detectsMultiDayLanguage } from '@/lib/createDareFlow/detectMultiDay';
import { FlowFooter } from '@/components/flow/FlowHero';
import MultiDayNudge from './MultiDayNudge';

const IDEAS = ['Cold shower before 8am', 'No sugar till tomorrow night', 'Phone off at 10pm tonight', '10,000 steps today', 'Run 5k in under 30 minutes', 'Cold shower for 2 minutes', 'Do 30 push-ups before lunch', 'Call an old friend today', 'Cook dinner for your family'];

/**
 * Step 1, What. The dare in one line, with the details folded away: most
 * dares say it all in the title, so the old required "Add the details"
 * screen is now an optional line here.
 */
export default function TitleStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(draft.description.trim()));
  const shuffle = () => {
    updateDraft({ title: IDEAS[ideaIndex % IDEAS.length] });
    setIdeaIndex((i) => i + 1);
  };

  const showNudge = !nudgeDismissed && detectsMultiDayLanguage(`${draft.title} ${draft.description}`);

  return (
    <>
      <div className="pact-step-enter flex flex-1 flex-col px-5 pt-6">
        <h2 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink)]">What&apos;s the dare?</h2>
        <p className="mt-1.5 text-[14.5px] text-[var(--muted)]">One thing, done within a day or two.</p>

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
          className="mt-4 w-full resize-none rounded-[18px] bg-[var(--card)] px-4 py-3 text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] shadow-[inset_0_0_0_1.5px_var(--line)] outline-none placeholder:font-semibold placeholder:text-[#B9B09C] focus:shadow-[inset_0_0_0_2px_var(--ink)] focus-visible:outline-none"
        />
        <div className="mt-1 text-right text-[12px] tabular-nums text-[var(--muted)]">{draft.title.length}/80</div>

        {detailsOpen ? (
          <textarea
            autoFocus
            rows={3}
            value={draft.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            placeholder="What counts as done? e.g. a photo at the finish line with the time showing"
            aria-label="Details (optional)"
            className="mt-2 w-full resize-none rounded-[18px] bg-[var(--card)] px-4 py-3 text-[15px] leading-[1.4] text-[var(--ink)] shadow-[inset_0_0_0_1.5px_var(--line)] outline-none placeholder:text-[#9A9282] focus:shadow-[inset_0_0_0_2px_var(--ink)] focus-visible:outline-none"
          />
        ) : (
          <button type="button" onClick={() => setDetailsOpen(true)} className="mt-1 flex h-11 items-center gap-1.5 self-start text-[14px] font-bold text-[var(--ink)] underline decoration-[var(--line)] decoration-2 underline-offset-4">
            <Plus className="size-4" strokeWidth={2.6} aria-hidden="true" />
            Add details (optional)
          </button>
        )}

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
                className="min-h-11 rounded-full bg-[var(--card)] px-4 text-[14px] font-semibold text-[var(--ink)] active:scale-95"
                style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}
              >
                {idea}
              </button>
            ))}
        </div>
      </div>

      <FlowFooter>
        <button
          type="button"
          onClick={goNext}
          disabled={!draft.title.trim()}
          className="h-[54px] w-full rounded-full bg-[var(--ink)] text-[16px] font-bold text-[var(--dare)] transition active:scale-[0.98] disabled:opacity-40"
        >
          {draft.recipientPreset ? 'Next: set the terms' : 'Next: who'}
        </button>
      </FlowFooter>
    </>
  );
}
