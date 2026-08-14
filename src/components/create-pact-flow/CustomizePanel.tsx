'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { generateDescription } from '@/lib/createPactFlow/generate';

/**
 * "Customize pact" — collapsed by default (Quick Pact is the default path,
 * Custom Pact is opt-in). A text toggle, not a button. Expands to a
 * description textarea, start date, and reminders toggle. Spec §7.
 */
export default function CustomizePanel() {
  const { draft, updateDraft } = useCreatePactFlow();
  const [open, setOpen] = useState(false);

  const generatedDescription = generateDescription({ ...draft, descriptionOverride: undefined });
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--pact-text-muted)] hover:text-[var(--pact-text)]"
      >
        Customize pact
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="pact-step-enter mt-4 space-y-4 rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-4">
          <div>
            <label htmlFor="pact-description" className="pact-mono text-xs uppercase tracking-wide text-[var(--pact-text-muted)]">
              Description
            </label>
            <textarea
              id="pact-description"
              rows={2}
              value={draft.descriptionOverride ?? ''}
              onChange={(e) => updateDraft({ descriptionOverride: e.target.value })}
              placeholder={generatedDescription}
              maxLength={140}
              className="mt-2 w-full resize-none rounded-xl border border-[var(--pact-hairline)] bg-[var(--pact-bg)] px-3 py-2.5 text-sm text-[var(--pact-text)] placeholder:text-[var(--pact-text-muted)]/70 focus:border-[var(--pact-pink)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="pact-start-date" className="pact-mono text-xs uppercase tracking-wide text-[var(--pact-text-muted)]">
              Start date
            </label>
            <input
              id="pact-start-date"
              type="date"
              min={todayIso}
              value={draft.startDate ?? todayIso}
              onChange={(e) => updateDraft({ startDate: e.target.value })}
              className="pact-mono mt-2 w-full rounded-xl border border-[var(--pact-hairline)] bg-[var(--pact-bg)] px-3 py-2.5 text-sm text-[var(--pact-text)] focus:border-[var(--pact-pink)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Reminders</span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.remindersEnabled}
              onClick={() => updateDraft({ remindersEnabled: !draft.remindersEnabled })}
              className="relative h-6 w-11 rounded-full transition-colors"
              style={{ background: draft.remindersEnabled ? 'var(--pact-pink)' : 'var(--pact-hairline)' }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                style={{ transform: draft.remindersEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
