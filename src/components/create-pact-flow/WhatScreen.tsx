'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { ACTIVITIES, CUSTOM_ACTIVITY_DEFAULTS, VIBES } from '@/lib/createPactFlow/content';
import { formatTarget } from '@/lib/createPactFlow/generate';
import { validateCustomActivityLabel, validateCustomTarget } from '@/lib/createPactFlow/steps';
import { VIBE_TO_CATEGORY } from '@/lib/createPactFlow/toApiPayload';
import { useCategoryMatches } from '@/hooks/useCategoryMatches';
import Avatar from '@/components/Avatar';
import Chip, { FieldLabel, PrimaryButton } from './Chip';
import PactFlowShell from './PactFlowShell';

const INPUT_CLASS =
  'h-11 w-full rounded-full border border-[var(--hairline)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--navy)]';

function ChasingLine({ category }: { category: string }) {
  const { data } = useCategoryMatches(category);
  if (!data) return null;
  const known = data.knownCount > 0;
  const count = known ? data.knownCount : data.totalCount;
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--muted)]">
      <div className="flex">
        {data.people.slice(0, 3).map((person, i) => (
          <div key={person.id} className={`rounded-full border-2 border-[var(--paper)] ${i ? '-ml-2' : ''}`}>
            <Avatar name={person.fullName || person.username} avatarUrl={person.avatarUrl} size={24} />
          </div>
        ))}
      </div>
      {count} {count === 1 ? 'person' : 'people'} {known ? 'you know' : ''}
      {known ? ' ' : ''}
      {count === 1 ? 'is' : 'are'} chasing this
    </div>
  );
}

export default function WhatScreen({ onExit }: { onExit?: () => void }) {
  const { draft, activity, pickVibe, pickActivity, submitCustomActivity, selectTarget, goNext } = useCreatePactFlow();
  const [customActivityOpen, setCustomActivityOpen] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [activityError, setActivityError] = useState<string | null>(null);
  const [customTargetOpen, setCustomTargetOpen] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const [targetMessage, setTargetMessage] = useState<{ text: string; error: boolean } | null>(null);

  const activities = draft.vibeId ? ACTIVITIES[draft.vibeId] : [];
  const unit = activity?.unit ?? CUSTOM_ACTIVITY_DEFAULTS.unit;
  const quickTargets = activity?.quickTargets ?? CUSTOM_ACTIVITY_DEFAULTS.quickTargets;
  const showTarget = Boolean(activity && !activity.milestone);
  const customTargetValue = draft.target != null && !quickTargets.includes(draft.target) ? draft.target : null;
  const canContinue = Boolean(activity && (activity.milestone || draft.target != null));

  const submitActivity = () => {
    const result = validateCustomActivityLabel(customActivity);
    if (!result.valid) {
      setActivityError(result.error ?? 'Enter a valid activity name.');
      return;
    }
    setActivityError(null);
    submitCustomActivity(customActivity);
    setCustomActivityOpen(false);
  };

  const submitTarget = () => {
    const result = validateCustomTarget(Number(customTarget));
    if (!result.valid) {
      setTargetMessage({ text: result.error ?? 'Enter a valid number.', error: true });
      return;
    }
    setTargetMessage(result.warning ? { text: result.warning, error: false } : null);
    selectTarget(Number(customTarget));
    setCustomTargetOpen(false);
  };

  return (
    <PactFlowShell
      onExit={onExit}
      accent="what"
      footer={
        <>
          {draft.vibeId && <ChasingLine category={VIBE_TO_CATEGORY[draft.vibeId]} />}
          <PrimaryButton onClick={goNext} disabled={!canContinue}>
            Next
            <ArrowRight className="size-5" />
          </PrimaryButton>
        </>
      }
    >
      {!draft.vibePreset && (
        <div>
          <FieldLabel>Goal</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((vibe) => (
              <Chip
                key={vibe.id}
                selected={draft.vibeId === vibe.id}
                onClick={() => {
                  pickVibe(vibe.id);
                  setCustomActivityOpen(false);
                  setCustomTargetOpen(false);
                }}
              >
                {vibe.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {draft.vibeId && (
        <div>
          <FieldLabel>Activity</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {activities.map((act, index) =>
              act.custom ? (
                <Chip
                  key={act.label}
                  dashed={draft.activityIndex !== index}
                  selected={draft.activityIndex === index && !customActivityOpen}
                  onClick={() => setCustomActivityOpen(true)}
                >
                  {draft.activityIndex === index && draft.customActivityLabel ? draft.customActivityLabel : act.label}
                </Chip>
              ) : (
                <Chip
                  key={act.label}
                  selected={draft.activityIndex === index}
                  onClick={() => {
                    pickActivity(index);
                    setCustomActivityOpen(false);
                  }}
                >
                  {act.label}
                </Chip>
              ),
            )}
          </div>
          {customActivityOpen && (
            <div className="mt-2.5 flex flex-col gap-2">
              <input
                autoFocus
                value={customActivity}
                onChange={(e) => {
                  setCustomActivity(e.target.value);
                  setActivityError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitActivity();
                }}
                placeholder="Name your activity"
                maxLength={40}
                className={INPUT_CLASS}
              />
              {activityError && <span className="text-xs font-semibold text-[var(--navy)]">{activityError}</span>}
              <Chip selected onClick={submitActivity} className="self-start">
                Set activity
              </Chip>
            </div>
          )}
        </div>
      )}

      {showTarget && (
        <div>
          <FieldLabel>How much</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {quickTargets.map((value) => (
              <Chip
                key={value}
                selected={draft.target === value}
                onClick={() => {
                  selectTarget(value);
                  setCustomTargetOpen(false);
                  setTargetMessage(null);
                }}
              >
                {formatTarget(value, unit)}
              </Chip>
            ))}
            <Chip
              selected={customTargetValue != null && !customTargetOpen}
              dashed={customTargetValue == null || customTargetOpen}
              onClick={() => setCustomTargetOpen(true)}
            >
              {customTargetValue != null ? formatTarget(customTargetValue, unit) : 'Custom'}
            </Chip>
          </div>
          {customTargetOpen && (
            <div className="mt-2.5 flex flex-col gap-2">
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                value={customTarget}
                onChange={(e) => {
                  setCustomTarget(e.target.value);
                  setTargetMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitTarget();
                }}
                placeholder={`Custom ${unit}`}
                className={INPUT_CLASS}
              />
              <Chip selected onClick={submitTarget} className="self-start">
                Set target
              </Chip>
            </div>
          )}
          {targetMessage && (
            <span className={`mt-2 block text-xs font-semibold ${targetMessage.error ? 'text-[var(--navy)]' : 'text-[var(--muted)]'}`}>
              {targetMessage.text}
            </span>
          )}
        </div>
      )}
    </PactFlowShell>
  );
}
