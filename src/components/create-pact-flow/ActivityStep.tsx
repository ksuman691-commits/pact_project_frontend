'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { ACTIVITIES } from '@/lib/createPactFlow/content';
import { validateCustomActivityLabel } from '@/lib/createPactFlow/steps';

export default function ActivityStep() {
  const { draft, pickActivity, submitCustomActivity } = useCreatePactFlow();
  const [customOpenIndex, setCustomOpenIndex] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!draft.vibeId) return null;
  const activities = ACTIVITIES[draft.vibeId];

  const handleCustomSubmit = (index: number) => {
    const result = validateCustomActivityLabel(customLabel);
    if (!result.valid) {
      setError(result.error ?? 'Enter a valid activity name.');
      return;
    }
    setError(null);
    submitCustomActivity(customLabel);
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">What are you committing to?</h1>
      <p className="mt-1 text-sm">One activity, one pact.</p>

      <div className="mt-6 flex flex-col gap-2">
        {activities.map((act, index) => {
          const selected = draft.activityIndex === index;
          const isCustomOpen = customOpenIndex === index;

          if (act.custom) {
            return (
              <div key={act.label} className="pact-tile rounded-2xl p-4">
                {isCustomOpen ? (
                  <div className="flex flex-col gap-2">
                    <input
                      autoFocus
                      value={customLabel}
                      onChange={(e) => {
                        setCustomLabel(e.target.value);
                        setError(null);
                      }}
                      placeholder="Name your activity"
                      maxLength={40}
                      className="w-full rounded-full px-4 py-2.5 text-sm outline-none"
                      style={{
                        background: 'var(--pact-surface-raised)',
                        color: 'var(--pact-text)',
                        border: '1px solid var(--pact-hairline)',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          handleCustomSubmit(index);
                        }
                      }}
                    />
                    {error && (
                      <span className="text-xs" style={{ color: 'var(--pact-pink)' }}>
                        {error}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCustomSubmit(index)}
                      className="self-start rounded-full px-5 py-2 text-sm font-semibold"
                      style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
                    >
                      Continue
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCustomOpenIndex(index)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-3 font-semibold">
                      <span className="text-xl">{act.emoji}</span>
                      {act.label}
                    </span>
                    <ChevronRight className="h-4 w-4" style={{ color: 'var(--pact-text-muted)' }} />
                  </button>
                )}
              </div>
            );
          }

          return (
            <button
              key={act.label}
              type="button"
              onClick={() => pickActivity(index)}
              className={`pact-tile flex items-center justify-between rounded-2xl p-4 text-left ${selected ? 'selected' : ''}`}
            >
              <span className="flex items-center gap-3 font-semibold">
                <span className="text-xl">{act.emoji}</span>
                {act.label}
              </span>
              {act.milestone && (
                <span className="pact-mono text-xs" style={{ color: 'var(--pact-gold)' }}>
                  · one-time
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
