'use client';

import React from 'react';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { PRIVACY_OPTIONS } from '@/lib/createCircleFlow/content';

export default function PrivacyStep() {
  const { draft, pickPrivacy } = useCreateCircleFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Who can join?</h1>
      <p className="mt-1 text-sm">You can change this later from circle settings.</p>

      <div className="mt-6 flex flex-col gap-2">
        {PRIVACY_OPTIONS.map((option) => {
          const selected = draft.privacy === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => pickPrivacy(option.id)}
              className={`pact-tile flex w-full items-center gap-3 rounded-2xl p-4 text-left ${selected ? 'selected' : ''}`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="flex flex-col">
                <span className="font-semibold">{option.label}</span>
                <span className="text-xs" style={{ color: 'var(--pact-text-muted)' }}>
                  {option.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
