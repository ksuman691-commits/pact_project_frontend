'use client';

import React, { useState } from 'react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { formatTarget } from '@/lib/createPactFlow/generate';
import { validateCustomTarget } from '@/lib/createPactFlow/steps';
import { CUSTOM_ACTIVITY_DEFAULTS } from '@/lib/createPactFlow/content';

export default function TargetStep() {
  const { draft, activity, selectTarget } = useCreatePactFlow();
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (!activity) return null;
  const unit = activity.unit ?? CUSTOM_ACTIVITY_DEFAULTS.unit;
  const quickTargets = activity.quickTargets ?? CUSTOM_ACTIVITY_DEFAULTS.quickTargets;

  const handleCustomSubmit = () => {
    const num = Number(customValue);
    const result = validateCustomTarget(num);
    if (!result.valid) {
      setError(result.error ?? 'Enter a valid number.');
      setWarning(null);
      return;
    }
    setError(null);
    setWarning(result.warning ?? null);
    selectTarget(num);
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">How much?</h1>
      <p className="mt-1 text-sm">Set the number you&apos;re aiming for.</p>

      <div className="mt-8 flex flex-1 items-center justify-center">
        <span className="pact-mono text-5xl font-semibold" style={{ color: 'var(--pact-pink)' }}>
          {draft.target != null ? formatTarget(draft.target, unit) : `— ${unit}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickTargets.map((value) => {
          const selected = draft.target === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => selectTarget(value)}
              className={`pact-tile pact-mono rounded-2xl p-4 text-center font-semibold ${selected ? 'selected' : ''}`}
            >
              {formatTarget(value, unit)}
            </button>
          );
        })}

        {customOpen ? (
          <div className="pact-tile col-span-2 flex flex-col gap-2 rounded-2xl p-4">
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setError(null);
              }}
              placeholder={`Custom ${unit}`}
              className="pact-mono w-full rounded-full px-4 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--pact-surface-raised)',
                color: 'var(--pact-text)',
                border: '1px solid var(--pact-hairline)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleCustomSubmit();
              }}
            />
            {error && (
              <span className="text-xs" style={{ color: 'var(--pact-pink)' }}>
                {error}
              </span>
            )}
            {warning && !error && (
              <span className="text-xs" style={{ color: 'var(--pact-gold)' }}>
                {warning}
              </span>
            )}
            <button
              type="button"
              onClick={handleCustomSubmit}
              className="self-start rounded-full px-5 py-2 text-sm font-semibold"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              Set target
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="pact-tile col-span-2 rounded-2xl p-4 text-center font-semibold"
            style={{ color: 'var(--pact-violet)' }}
          >
            Custom
          </button>
        )}
      </div>
    </div>
  );
}
