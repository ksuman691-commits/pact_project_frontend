'use client';

import React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MultiDayNudgeProps {
  /** The raw text that triggered the detection — carried over to the Pact flow. */
  sourceText: string;
  onDismiss: () => void;
}

/**
 * Non-blocking inline suggestion shown when the title/description free-text
 * fields sound like a multi-day/recurring commitment. Dismissible — this is
 * a suggestion, not a validation error, since keyword matching has false
 * positives (e.g. "practice guitar every day this week" can still be a
 * legitimate single-day Dare for some users).
 */
export default function MultiDayNudge({ sourceText, onDismiss }: MultiDayNudgeProps) {
  const router = useRouter();

  return (
    <div
      className="pact-step-enter mt-3 flex items-start gap-3 rounded-2xl p-3.5"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      role="status"
    >
      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--pact-gold)' }} />
      <div className="flex-1">
        <p className="text-sm text-[var(--pact-text)]">
          This sounds like it might span multiple days — Dares are single-day challenges. Want to create a Pact
          instead?
        </p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/pacts/create?note=${encodeURIComponent(sourceText.trim())}`)}
            className="text-sm font-semibold"
            style={{ color: 'var(--pact-pink)' }}
          >
            Switch to Create Pact
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm font-medium text-[var(--pact-text-dim)] hover:text-[var(--pact-text)]"
          >
            Keep as Dare
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-[var(--pact-text-faint)] hover:text-[var(--pact-text-dim)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
