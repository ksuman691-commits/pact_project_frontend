'use client';

import React, { useState } from 'react';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { CIRCLE_EMOJIS, NAME_TEMPLATES } from '@/lib/createCircleFlow/content';
import { validateCircleName } from '@/lib/createCircleFlow/steps';

export default function IdentityStep() {
  const { draft, setEmoji, setName, setTagline, confirmIdentity } = useCreateCircleFlow();
  const [error, setError] = useState<string | null>(null);

  const suggestions = draft.vibeId ? NAME_TEMPLATES[draft.vibeId] : [];

  const handleContinue = () => {
    const result = validateCircleName(draft.name);
    if (!result.valid) {
      setError(result.error ?? 'Enter a name.');
      return;
    }
    setError(null);
    confirmIdentity();
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Give it a face.</h1>
      <p className="mt-1 text-sm">An emoji, a name, and a one-line tagline.</p>

      <div className="mt-6 grid grid-cols-5 gap-2">
        {CIRCLE_EMOJIS.map((emoji) => {
          const selected = draft.emoji === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => setEmoji(emoji)}
              aria-label={`Choose ${emoji}`}
              className={`pact-tile rounded-2xl px-0 py-3 text-xl ${selected ? 'selected' : ''}`}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <label className="pact-mono block text-xs uppercase tracking-wide" style={{ color: 'var(--pact-text-muted)' }}>
          Circle name
        </label>
        <input
          autoFocus
          type="text"
          value={draft.name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="e.g. Early Morning Runners"
          maxLength={40}
          className="mt-2 w-full rounded-full px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--pact-surface-raised)',
            color: 'var(--pact-text)',
            border: '1px solid var(--pact-hairline)',
          }}
        />
        {error && (
          <span className="mt-1.5 block text-xs" style={{ color: 'var(--flow-accent)' }}>
            {error}
          </span>
        )}

        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setName(suggestion);
                  setError(null);
                }}
                className="pact-tile rounded-full px-3.5 py-1.5 text-xs font-semibold"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="pact-mono block text-xs uppercase tracking-wide" style={{ color: 'var(--pact-text-muted)' }}>
          Tagline <span style={{ color: 'var(--pact-text-faint)' }}>(optional)</span>
        </label>
        <input
          type="text"
          value={draft.tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="What's this circle about?"
          maxLength={80}
          className="mt-2 w-full rounded-full px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--pact-surface-raised)',
            color: 'var(--pact-text)',
            border: '1px solid var(--pact-hairline)',
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleContinue}
        className="mt-8 w-full rounded-full px-6 py-3.5 text-center text-sm font-semibold text-[var(--pact-bg)]"
        style={{ background: 'linear-gradient(135deg, var(--flow-accent), var(--flow-accent-2))' }}
      >
        Continue →
      </button>
    </div>
  );
}
