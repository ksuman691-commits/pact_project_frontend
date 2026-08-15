'use client';

import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { detectsMultiDayLanguage } from '@/lib/createDareFlow/detectMultiDay';
import MultiDayNudge from './MultiDayNudge';

export default function TitleStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const showNudge = !nudgeDismissed && detectsMultiDayLanguage(draft.title);

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Dare someone</h1>
      <p className="mt-2 text-sm text-[var(--pact-text-dim)]">What&apos;s the challenge?</p>

      {/* Framing copy — visible before the user types anything, so they know
          up front what a Dare is versus a Pact. */}
      <div
        className="mt-4 flex items-start gap-2.5 rounded-2xl p-3"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        <Zap className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--pact-pink)' }} />
        <p className="text-xs leading-relaxed text-[var(--pact-text-dim)]">
          Dares are fast, one-time challenges — respond within up to 24h, complete within up to 48h. For anything
          spanning multiple days, use a Pact instead.
        </p>
      </div>

      <input
        autoFocus
        type="text"
        value={draft.title}
        onChange={(e) => {
          updateDraft({ title: e.target.value });
          if (nudgeDismissed) setNudgeDismissed(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) goNext();
        }}
        placeholder="e.g., Run 5k in under 30 minutes"
        className="mt-6 w-full rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] px-4 py-3 text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
      />

      {showNudge && <MultiDayNudge sourceText={draft.title} onDismiss={() => setNudgeDismissed(true)} />}

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
