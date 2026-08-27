'use client';

import React from 'react';
import Image from 'next/image';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { AUDIENCES } from '@/lib/createPactFlow/content';
import { useCircles } from '@/hooks/useCircles';
import type { AudienceLabel } from '@/types/createPactFlow';

export default function AudienceStep() {
  const { draft, updateDraft, selectAudience } = useCreatePactFlow();
  const { data: circles } = useCircles();

  const hasMultipleCircles = Array.isArray(circles) && circles.length > 1;
  // Private ("My Circle") is the default posture until the user taps
  // something else, so treat an unset draft.audience as Private for both
  // the tile highlight and whether the circle sub-picker should be showing.
  const effectiveAudience: AudienceLabel = draft.audience ?? 'My Circle';
  const showCirclePicker = effectiveAudience === 'My Circle' && hasMultipleCircles;

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
          const selected = effectiveAudience === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handlePickAudience(option.label)}
              className={`pact-tile flex w-full items-center gap-3 rounded-2xl p-4 text-left ${selected ? 'selected' : ''}`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="flex flex-col">
                <span className="font-semibold">{option.displayLabel}</span>
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
          pick which one right here rather than defaulting silently. Reuses
          the same photo/emoji-avatar + name + member-count treatment as the
          circle list on the Circles page, rather than a plain text list. */}
      {showCirclePicker && (
        <div className="pact-step-enter mt-6">
          <p className="text-sm font-semibold">Which circle?</p>
          <div className="mt-3 flex flex-col gap-2">
            {circles!.map((circle: any) => {
              const selected = draft.circleId === circle.id;
              const memberCount = circle.member_count || 0;
              return (
                <button
                  key={circle.id}
                  type="button"
                  onClick={() => selectAudience('My Circle', circle.id)}
                  className={`pact-tile flex w-full items-center gap-3 rounded-2xl p-3 text-left ${selected ? 'selected' : ''}`}
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--pact-violet)]/40 bg-[var(--pact-surface-2)] text-lg">
                    {circle.photo_url ? (
                      <Image src={circle.photo_url} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      circle.emoji || circle.icon_emoji || '◌'
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{circle.name}</span>
                    <span className="block text-xs" style={{ color: 'var(--pact-text-muted)' }}>
                      {memberCount} member{memberCount === 1 ? '' : 's'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
