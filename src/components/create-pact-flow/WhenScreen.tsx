'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Check, Globe, User, Users } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { AUDIENCES, DURATION_PRESETS } from '@/lib/createPactFlow/content';
import { validateCustomEndDate } from '@/lib/createPactFlow/steps';
import { useCircles } from '@/hooks/useCircles';
import type { AudienceLabel } from '@/types/createPactFlow';
import Chip, { FieldLabel, PrimaryButton } from './Chip';
import PactFlowShell from './PactFlowShell';

const AUDIENCE_ICONS: Record<AudienceLabel, React.ComponentType<{ className?: string }>> = {
  'My Circle': Users,
  Everyone: Globe,
  'Just me': User,
};

export default function WhenScreen({ onExit }: { onExit?: () => void }) {
  const { draft, selectDurationPreset, selectCustomEndDate, selectAudience, goNext } = useCreatePactFlow();
  const { data: circles } = useCircles();
  const [customOpen, setCustomOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const circlesLoaded = Array.isArray(circles);
  const hasNoCircles = circlesLoaded && circles.length === 0;
  const hasMultipleCircles = circlesLoaded && circles.length > 1;
  // A user with no circles can't resolve "My Circle" to a circle_id (the
  // backend rejects that), so solo is the only honest default for them.
  const effectiveAudience: AudienceLabel = draft.audience ?? (hasNoCircles ? 'Just me' : 'My Circle');
  const showAudience = !draft.audiencePreset;
  const showCirclePicker = showAudience && effectiveAudience === 'My Circle' && hasMultipleCircles;

  // Seed the default answer so Next never submits an unanswered audience.
  useEffect(() => {
    if (!showAudience || draft.audience != null || !circlesLoaded) return;
    if (hasNoCircles) selectAudience('Just me', null);
    else selectAudience('My Circle', draft.circleId ?? circles[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAudience, draft.audience, circlesLoaded, hasNoCircles, hasMultipleCircles]);

  const pickAudience = (label: AudienceLabel) => {
    if (label === 'My Circle' && hasNoCircles) {
      selectAudience('Just me', null);
      return;
    }
    // Single circle resolves automatically; with several, keep the known one or default to the first.
    const nextCircleId =
      label === 'My Circle' ? draft.circleId ?? circles?.[0]?.id ?? null : label === 'Just me' ? null : draft.circleId ?? null;
    selectAudience(label, nextCircleId);
  };

  const submitDate = () => {
    if (!customDate) {
      setDateError('Pick a date.');
      return;
    }
    const result = validateCustomEndDate(customDate);
    if (!result.valid) {
      setDateError(result.error ?? 'Pick a date after today.');
      return;
    }
    setDateError(null);
    selectCustomEndDate(customDate);
    setCustomOpen(false);
  };

  const hasDuration = draft.durationDays != null || Boolean(draft.customEndDate);
  const audienceReady =
    !showAudience || (draft.audience != null && (draft.audience !== 'My Circle' || draft.circleId != null));

  return (
    <PactFlowShell
      onExit={onExit}
      accent="when"
      footer={
        <PrimaryButton onClick={goNext} disabled={!hasDuration || !audienceReady}>
          Review
          <ArrowRight className="size-5" />
        </PrimaryButton>
      }
    >
      <div>
        <FieldLabel>How long</FieldLabel>
        <div className="flex gap-2">
          {DURATION_PRESETS.map((days) => (
            <Chip
              key={days}
              selected={draft.durationDays === days}
              onClick={() => {
                selectDurationPreset(days);
                setCustomOpen(false);
              }}
              className="h-11 flex-1 px-0"
            >
              {days} days
            </Chip>
          ))}
        </div>
        <div className="mt-2">
          <Chip
            dashed={!draft.customEndDate || customOpen}
            selected={Boolean(draft.customEndDate) && !customOpen}
            onClick={() => setCustomOpen(true)}
          >
            <Calendar className="size-4" />
            {draft.customEndDate && !customOpen ? `Until ${draft.customEndDate}` : 'Pick my own date'}
          </Chip>
        </div>
        {customOpen && (
          <div className="mt-2.5 flex flex-col gap-2">
            <input
              autoFocus
              type="date"
              value={customDate}
              min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateError(null);
              }}
              aria-label="End date"
              className="h-11 w-full rounded-full border border-[var(--hairline)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--navy)]"
            />
            {dateError && <span className="text-xs font-semibold text-[var(--navy)]">{dateError}</span>}
            <Chip selected onClick={submitDate} className="self-start">
              Set end date
            </Chip>
          </div>
        )}
      </div>

      {showAudience && (
        <div>
          <FieldLabel>Who&apos;s watching</FieldLabel>
          <div className="flex flex-col gap-2">
            {AUDIENCES.map((option) => {
              const selected = effectiveAudience === option.label;
              const Icon = AUDIENCE_ICONS[option.label];
              const desc =
                option.label === 'My Circle' && hasNoCircles ? 'Create a circle first. Tracked solo for now.' : option.desc;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => pickAudience(option.label)}
                  aria-pressed={selected}
                  className={`flex min-h-16 items-center gap-3 rounded-[20px] bg-[var(--card)] px-4 py-2.5 text-left ${
                    selected ? 'border-2 border-[var(--navy)]' : 'border border-[var(--hairline)]'
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--navy)]">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold">{option.displayLabel}</span>
                    <span className="block text-xs font-semibold text-[var(--muted)]">{desc}</span>
                  </span>
                  {selected && (
                    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-white">
                      <Check className="size-3.5" strokeWidth={3.2} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showCirclePicker && (
        <div>
          <FieldLabel>Which circle</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {circles!.map((circle: any) => (
              <Chip key={circle.id} selected={draft.circleId === circle.id} onClick={() => selectAudience('My Circle', circle.id)}>
                {circle.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </PactFlowShell>
  );
}
