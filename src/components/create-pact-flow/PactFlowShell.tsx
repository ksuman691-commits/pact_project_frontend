'use client';

import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { generateSentenceParts } from '@/lib/createPactFlow/generate';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import TaggedParticipantBanner from './TaggedParticipantBanner';

interface PactFlowShellProps {
  children: React.ReactNode;
  onExit?: () => void;
  /** Which part of the sentence is accented: the goal on screen 1, the duration after. */
  accent: 'what' | 'when';
  /** Label above the sentence ("I will" / "Review your pact"). */
  eyebrow?: string;
  /** Pinned bottom action (Next / Review / Create pact). */
  footer: React.ReactNode;
}

const SEGMENTS = 3;

export default function PactFlowShell({ children, onExit, accent, eyebrow = 'I will', footer }: PactFlowShellProps) {
  const { draft, activity, stepIndex, canGoBack, goBack } = useCreatePactFlow();
  const { what, when } = generateSentenceParts(draft, activity);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-[22px] bg-[var(--paper)] px-5 pb-6 pt-5 text-[var(--ink)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Back"
          className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-0"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={SEGMENTS} aria-valuenow={stepIndex + 1}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-[2px] ${i <= stepIndex ? 'bg-[var(--navy)]' : 'bg-[var(--hairline)]'}`}
            />
          ))}
        </div>
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            aria-label="Close"
            className="-mr-2.5 flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <X className="size-[22px]" />
          </button>
        ) : (
          <span className="-mr-2.5 size-11 shrink-0" aria-hidden="true" />
        )}
      </div>

      <div>
        <div className="text-[13px] font-bold text-[var(--muted)]">{eyebrow}</div>
        <h1 className="mt-0.5 text-[32px] font-extrabold leading-[38px] tracking-[-0.8px]">
          {what ? (
            <>
              <span className={accent === 'what' ? 'text-[var(--navy)]' : 'text-[var(--ink)]'}>{what}</span>
              {when ? (
                <span className={accent === 'when' ? 'text-[var(--navy)]' : 'text-[var(--ink)]'}> {when}</span>
              ) : (
                <span className="text-[var(--hairline)]"> in ...</span>
              )}
            </>
          ) : (
            <span className="text-[var(--hairline)]">...</span>
          )}
        </h1>
      </div>

      {draft.taggedParticipantId ? <TaggedParticipantBanner userId={draft.taggedParticipantId} /> : null}

      <div className="flex flex-1 flex-col gap-[22px]">{children}</div>

      <div className="flex flex-col gap-3">{footer}</div>
    </div>
  );
}
