'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { DURATION_PRESETS } from '@/lib/createPactFlow/content';
import { validateCustomEndDate } from '@/lib/createPactFlow/steps';

export default function DurationStep() {
  const { draft, selectDurationPreset, selectCustomEndDate } = useCreatePactFlow();
  const [customOpen, setCustomOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCustomSubmit = () => {
    if (!customDate) {
      setError('Pick a date.');
      return;
    }
    const result = validateCustomEndDate(customDate);
    if (!result.valid) {
      setError(result.error ?? 'Pick a date after today.');
      return;
    }
    setError(null);
    selectCustomEndDate(customDate);
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">How long?</h1>
      <p className="mt-1 text-sm">Give yourself a deadline.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {DURATION_PRESETS.map((days) => {
          const selected = draft.durationDays === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => selectDurationPreset(days)}
              className={`pact-tile pact-mono rounded-2xl p-4 text-center font-semibold ${selected ? 'selected' : ''}`}
            >
              {days} Days
            </button>
          );
        })}
      </div>

      {customOpen ? (
        <div className="pact-tile mt-3 flex flex-col gap-2 rounded-2xl p-4">
          <input
            autoFocus
            type="date"
            value={customDate}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setError(null);
            }}
            className="w-full rounded-full px-4 py-2.5 text-sm outline-none"
            style={{
              background: 'var(--pact-surface-raised)',
              color: 'var(--pact-text)',
              border: '1px solid var(--pact-hairline)',
            }}
          />
          {error && (
            <span className="text-xs" style={{ color: 'var(--pact-pink)' }}>
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="self-start rounded-full px-5 py-2 text-sm font-semibold"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
          >
            Set end date
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className="pact-tile mt-3 flex w-full items-center justify-center gap-2 rounded-2xl p-4 font-semibold"
          style={{ color: 'var(--pact-violet)' }}
        >
          <Calendar className="h-4 w-4" />
          Pick my own date
        </button>
      )}
    </div>
  );
}
