'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Activity,
  AudienceLabel,
  CreatedPact,
  FlowStep,
  PactDraft,
  ProofFrequency,
  ProofMethod,
  VibeId,
} from '@/types/createPactFlow';
import { ACTIVITIES, AUDIENCES, CUSTOM_ACTIVITY_DEFAULTS } from '@/lib/createPactFlow/content';
import { resolveSteps } from '@/lib/createPactFlow/steps';
import { createEmptyDraft } from '@/types/createPactFlow';

const AUTO_ADVANCE_DELAY_MS = 150;

interface CreatePactFlowContextValue {
  draft: PactDraft;
  updateDraft: (patch: Partial<PactDraft>) => void;
  activity: Activity | null;
  resolvedSteps: FlowStep[];
  stepIndex: number;
  currentStep: FlowStep;
  goBack: () => void;
  canGoBack: boolean;

  pickVibe: (vibeId: VibeId) => void;
  pickActivity: (index: number) => void;
  submitCustomActivity: (label: string) => void;
  surpriseMe: () => void;
  selectTarget: (value: number) => void;
  selectDurationPreset: (days: number) => void;
  selectCustomEndDate: (iso: string) => void;
  selectProofMethod: (method: ProofMethod) => void;
  selectProofFrequency: (frequency: ProofFrequency) => void;
  selectAudience: (label: AudienceLabel, circleId?: number | null) => void;
  goToReview: () => void;
  goToSuccess: () => void;

  reset: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  createdPact: CreatedPact | null;
  setCreatedPact: (p: CreatedPact | null) => void;
  idempotencyKey: string;
}

const CreatePactFlowContext = createContext<CreatePactFlowContextValue | null>(null);

function makeIdempotencyKey() {
  return `pact-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CreatePactFlowProvider({
  children,
  initialCircleId,
}: {
  children: React.ReactNode;
  /** Pre-set circle audience — skips the audience question entirely. */
  initialCircleId?: number | null;
}) {
  const [draft, setDraft] = useState<PactDraft>(() => {
    const base = createEmptyDraft();
    if (initialCircleId != null) {
      return {
        ...base,
        audience: 'My Circle',
        visibility: 'My Circle',
        circleId: initialCircleId,
        audiencePreset: true,
      };
    }
    return base;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPact, setCreatedPact] = useState<CreatedPact | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const activity: Activity | null = useMemo(() => {
    if (!draft.vibeId || draft.activityIndex == null) return null;
    return ACTIVITIES[draft.vibeId][draft.activityIndex] ?? null;
  }, [draft.vibeId, draft.activityIndex]);

  const resolvedSteps = useMemo(() => resolveSteps(draft, activity), [draft, activity]);
  const currentStep = resolvedSteps[stepIndex] ?? 'vibe';

  const updateDraft = useCallback((patch: Partial<PactDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  /** Update the draft immediately (so the tap registers visually), then
   * advance one step after a short delay — never instant/jarring. */
  const commitAndAdvance = useCallback(
    (updater: (prev: PactDraft) => PactDraft, jumpToIndex?: (steps: FlowStep[]) => number) => {
      let nextDraft: PactDraft;
      setDraft((prev) => {
        nextDraft = updater(prev);
        return nextDraft;
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (jumpToIndex) {
          const nextActivity =
            nextDraft.vibeId && nextDraft.activityIndex != null
              ? ACTIVITIES[nextDraft.vibeId][nextDraft.activityIndex] ?? null
              : null;
          const steps = resolveSteps(nextDraft, nextActivity);
          setStepIndex(Math.max(jumpToIndex(steps), 0));
        } else {
          setStepIndex((i) => i + 1);
        }
      }, AUTO_ADVANCE_DELAY_MS);
    },
    [],
  );

  const pickVibe = useCallback(
    (vibeId: VibeId) => {
      // Changing vibe resets activity/target (downstream fields invalidated).
      commitAndAdvance((prev) => ({
        ...prev,
        vibeId,
        activityIndex: null,
        customActivityLabel: undefined,
        target: null,
      }));
    },
    [commitAndAdvance],
  );

  const pickActivity = useCallback(
    (index: number) => {
      commitAndAdvance((prev) => {
        if (!prev.vibeId) return prev;
        const chosen = ACTIVITIES[prev.vibeId][index];
        return {
          ...prev,
          activityIndex: index,
          customActivityLabel: undefined,
          target: chosen?.milestone ? null : (chosen?.defaultTarget ?? prev.target),
        };
      });
    },
    [commitAndAdvance],
  );

  const submitCustomActivity = useCallback(
    (label: string) => {
      commitAndAdvance((prev) => {
        if (!prev.vibeId) return prev;
        const customIdx = ACTIVITIES[prev.vibeId].findIndex((a) => a.custom);
        return {
          ...prev,
          activityIndex: customIdx,
          customActivityLabel: label.trim(),
          target: CUSTOM_ACTIVITY_DEFAULTS.defaultTarget,
        };
      });
    },
    [commitAndAdvance],
  );

  const surpriseMe = useCallback(() => {
    const vibeIds = Object.keys(ACTIVITIES) as VibeId[];
    const vibeId = vibeIds[Math.floor(Math.random() * vibeIds.length)];
    const nonCustom = ACTIVITIES[vibeId].map((a, i) => ({ a, i })).filter(({ a }) => !a.custom);
    const pick = nonCustom[Math.floor(Math.random() * nonCustom.length)];

    commitAndAdvance(
      (prev) => ({
        ...prev,
        vibeId,
        activityIndex: pick.i,
        customActivityLabel: undefined,
        target: pick.a.milestone ? null : pick.a.defaultTarget ?? null,
      }),
      (steps) => {
        const idx = pick.a.milestone ? steps.indexOf('duration') : steps.indexOf('target');
        return idx >= 0 ? idx : 0;
      },
    );
  }, [commitAndAdvance]);

  const selectTarget = useCallback(
    (value: number) => {
      commitAndAdvance((prev) => ({ ...prev, target: value }));
    },
    [commitAndAdvance],
  );

  const selectDurationPreset = useCallback(
    (days: number) => {
      commitAndAdvance((prev) => ({ ...prev, durationDays: days, customEndDate: undefined }));
    },
    [commitAndAdvance],
  );

  const selectCustomEndDate = useCallback(
    (iso: string) => {
      commitAndAdvance((prev) => ({ ...prev, customEndDate: iso, durationDays: null }));
    },
    [commitAndAdvance],
  );

  const selectProofMethod = useCallback(
    (method: ProofMethod) => {
      if (method === 'Activity data') {
        // Auto-advance immediately — no frequency needed.
        commitAndAdvance((prev) => ({ ...prev, proofMethod: method, proofFrequency: null }));
      } else {
        // Stay on this screen — frequency chips appear below; don't advance yet.
        updateDraft({ proofMethod: method });
      }
    },
    [commitAndAdvance, updateDraft],
  );

  const selectProofFrequency = useCallback(
    (frequency: ProofFrequency) => {
      commitAndAdvance((prev) => ({ ...prev, proofFrequency: frequency }));
    },
    [commitAndAdvance],
  );

  const selectAudience = useCallback(
    (label: AudienceLabel, circleId?: number | null) => {
      const preset = AUDIENCES.find((a) => a.label === label);
      commitAndAdvance((prev) => ({
        ...prev,
        audience: label,
        visibility: preset?.visibility ?? prev.visibility,
        circleId: label === 'My Circle' ? circleId ?? prev.circleId ?? null : null,
      }));
    },
    [commitAndAdvance],
  );

  const goToReview = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex((i) => {
      const reviewIdx = resolvedSteps.indexOf('review');
      return reviewIdx >= 0 ? reviewIdx : i;
    });
  }, [resolvedSteps]);

  // Called after the create-pact API call succeeds so the flow actually
  // transitions to the SuccessStep screen. 'success' is always the last
  // resolved step (see resolveSteps).
  const goToSuccess = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex(resolvedSteps.length - 1);
  }, [resolvedSteps]);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft());
    setStepIndex(0);
    setCreatedPact(null);
    setIdempotencyKey(makeIdempotencyKey());
  }, []);

  const value: CreatePactFlowContextValue = {
    draft,
    updateDraft,
    activity,
    resolvedSteps,
    stepIndex,
    currentStep,
    goBack,
    canGoBack: stepIndex > 0 && currentStep !== 'success',
    pickVibe,
    pickActivity,
    submitCustomActivity,
    surpriseMe,
    selectTarget,
    selectDurationPreset,
    selectCustomEndDate,
    selectProofMethod,
    selectProofFrequency,
    selectAudience,
    goToReview,
    goToSuccess,
    reset,
    isSubmitting,
    setIsSubmitting,
    createdPact,
    setCreatedPact,
    idempotencyKey,
  };

  return <CreatePactFlowContext.Provider value={value}>{children}</CreatePactFlowContext.Provider>;
}

export function useCreatePactFlow() {
  const ctx = useContext(CreatePactFlowContext);
  if (!ctx) throw new Error('useCreatePactFlow must be used within CreatePactFlowProvider');
  return ctx;
}
