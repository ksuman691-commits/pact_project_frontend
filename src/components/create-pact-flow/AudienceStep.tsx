'use client';

import React from 'react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { AUDIENCES } from '@/lib/createPactFlow/content';
import { useCircles } from '@/hooks/useCircles';

export default function AudienceStep() {
  const { draft, updateDraft, selectAudience } = useCreatePactFlow();
  const { data: circles } = useCircles();

  const hasMultipleCircles = Array.isArray(circles) && circles.length > 1;
  const showCirclePicker = draft.audience === 'My Circle' && hasMultipleCircles;

  const handlePickAudience = (label: (typeof AUDIENCES)[number]['label']) => {
    if (label === 'My Circle' && hasMultipleCircles) {
      // Don't auto-advance yet — wait for the specific circle to be picked below.
      const preset = AUDIENCES.find((a) => a.label === label);
      updateDraft({ audience: label, visibility: preset?.visibility ?? draft.visibility, circleId: null });
      return;
    }
    selectAudience(label, label === 'My Circle' ? circles?.[0]?.id ?? null : null);
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Who&apos;s watching?</h1>
      <p className="mt-1 text-sm">Choose who can see this pact.</p>

      <div className="mt-6 flex flex-col gap-2">
        {AUDIENCES.map((option) => {
          const selected = draft.audience === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handlePickAudience(option.label)}
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

      {/* Bridging addition beyond the spec: the backend needs a specific
          circle_id, so if the user belongs to more than one circle, let them
          pick which one right here rather than defaulting silently. */}
      {showCirclePicker && (
        <div className="pact-step-enter mt-6">
          <p className="text-sm font-semibold">Which circle?</p>
          <div className="mt-3 flex flex-col gap-2">
            {circles!.map((circle: any) => {
              const selected = draft.circleId === circle.id;
              return (
                <button
                  key={circle.id}
                  type="button"
                  onClick={() => selectAudience('My Circle', circle.id)}
                  className={`pact-tile rounded-2xl p-3 text-left text-sm font-semibold ${selected ? 'selected' : ''}`}
                >
                  {circle.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
