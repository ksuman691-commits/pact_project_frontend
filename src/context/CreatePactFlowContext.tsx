'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
import { categoryToVibe } from '@/lib/createPactFlow/toApiPayload';
import { createEmptyDraft } from '@/types/createPactFlow';
import { pactService } from '@/services/api';

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
  goNext: () => void;
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
  initialDescription,
  initialParticipantId,
  initialCategory,
  initialPactId,
}: {
  children: React.ReactNode;
  /**
   * Pre-attaches a circle (e.g. a Circle's "Start a Pact for this Circle"
   * CTA) and pre-selects "My Circle" as the default audience — but does NOT
   * skip the audience question. Public and Only-me must both stay reachable
   * here: Public should keep this circle_id (so the pact can appear on the
   * circle's public Wall, see selectAudience), and a user should still be
   * able to opt out to solo tracking.
   */
  initialCircleId?: number | null;
  /**
   * Carries over free text typed elsewhere (e.g. the Dare flow's "switch to
   * a Pact" nudge) so it isn't lost when bridging flows. Seeds
   * descriptionOverride, which generate.ts already prefers over the
   * auto-generated description.
   */
  initialDescription?: string | null;
  /**
   * Pre-attached participant — arriving from a specific user's "Create a
   * Pact with [Name]" CTA. The target user context is already known, so the
   * audience question must be skipped entirely (never shown a generic
   * profile-picker) and that person shown as an already-added participant.
   */
  initialParticipantId?: number | null;
  /**
   * Carried over from a goal-match's "Create a matching pact" CTA (see
   * SuccessStep). Seeds vibeId via categoryToVibe and skips the Vibe step.
   * Title/target/activity are intentionally NOT prefilled from this — the
   * originating pact's generated title can't be reliably reverse-mapped
   * back to a specific catalog activity + target, so those stay normal
   * user choices (now correctly scoped to the right vibe).
   */
  initialCategory?: string | null;
  /**
   * The originating pact's id from the same CTA — used only as a
   * best-effort duration prefill (fetched once on mount; silently ignored
   * on failure, same degrade-gracefully pattern as
   * circleAdvancedService.inviteUser).
   */
  initialPactId?: number | null;
}) {
  const [draft, setDraft] = useState<PactDraft>(() => {
    let base = createEmptyDraft();
    // A known target user fully answers the audience question (that pact is
    // tied to that person) — skip it entirely. A known circle only supplies
    // a *default* answer ("My Circle"); the question must still be shown so
    // the user can switch to Public (keeping this circle_id, see
    // selectAudience) or Only me (solo, no circle) instead.
    if (initialParticipantId != null) {
      base = { ...base, audiencePreset: true };
    }
    if (initialCircleId != null) {
      base = {
        ...base,
        audience: 'My Circle',
        visibility: 'My Circle',
        circleId: initialCircleId,
      };
    }
    if (initialParticipantId != null) {
      base = { ...base, taggedParticipantId: initialParticipantId };
    }
    if (initialDescription?.trim()) {
      base = { ...base, descriptionOverride: initialDescription.trim() };
    }
    const seededVibeId = categoryToVibe(initialCategory);
    if (seededVibeId) {
      base = { ...base, vibeId: seededVibeId, vibePreset: true };
    }
    return base;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPact, setCreatedPact] = useState<CreatedPact | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);
  // Best-effort duration prefill from the originating pact (goal-match
  // "Create a matching pact" CTA only — initialPactId is unset otherwise).
  // start_date/end_date are plain dates, so diffing them into days is a
  // trivial, lossless number worth carrying over even though title/target
  // can't be. Degrades silently on any failure — never blocks the flow.
  useEffect(() => {
    if (initialPactId == null) return;
    let cancelled = false;
    pactService
      .getById(initialPactId)
      .then(({ data }) => {
        if (cancelled || !data?.start_date || !data?.end_date) return;
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (Number.isFinite(days) && days > 0) {
          setDraft((prev) => (prev.durationDays == null ? { ...prev, durationDays: days } : prev));
        }
      })
      .catch(() => {
        // Ignored — worst case the user just picks a duration themselves.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPactId]);

  const activity: Activity | null = useMemo(() => {
    if (!draft.vibeId || draft.activityIndex == null) return null;
    return ACTIVITIES[draft.vibeId][draft.activityIndex] ?? null;
  }, [draft.vibeId, draft.activityIndex]);

  const resolvedSteps = useMemo(() => resolveSteps(draft, activity), [draft, activity]);
  const currentStep = resolvedSteps[stepIndex] ?? 'what';

  const updateDraft = useCallback((patch: Partial<PactDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const pickVibe = useCallback((vibeId: VibeId) => {
    // Changing vibe resets activity/target (downstream fields invalidated).
    setDraft((prev) =>
      prev.vibeId === vibeId
        ? prev
        : { ...prev, vibeId, activityIndex: null, customActivityLabel: undefined, target: null },
    );
  }, []);

  const pickActivity = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev.vibeId) return prev;
      const chosen = ACTIVITIES[prev.vibeId][index];
      return {
        ...prev,
        activityIndex: index,
        customActivityLabel: undefined,
        target: chosen?.milestone ? null : (chosen?.defaultTarget ?? prev.target),
      };
    });
  }, []);

  const submitCustomActivity = useCallback((label: string) => {
    setDraft((prev) => {
      if (!prev.vibeId) return prev;
      const customIdx = ACTIVITIES[prev.vibeId].findIndex((a) => a.custom);
      return {
        ...prev,
        activityIndex: customIdx,
        customActivityLabel: label.trim(),
        target: CUSTOM_ACTIVITY_DEFAULTS.defaultTarget,
      };
    });
  }, []);

  const surpriseMe = useCallback(() => {
    const vibeIds = Object.keys(ACTIVITIES) as VibeId[];
    const vibeId = vibeIds[Math.floor(Math.random() * vibeIds.length)];
    const nonCustom = ACTIVITIES[vibeId].map((a, i) => ({ a, i })).filter(({ a }) => !a.custom);
    const pick = nonCustom[Math.floor(Math.random() * nonCustom.length)];
    setDraft((prev) => ({
      ...prev,
      vibeId,
      activityIndex: pick.i,
      customActivityLabel: undefined,
      target: pick.a.milestone ? null : pick.a.defaultTarget ?? null,
    }));
  }, []);

  const selectTarget = useCallback((value: number) => {
    setDraft((prev) => ({ ...prev, target: value }));
  }, []);

  const selectDurationPreset = useCallback((days: number) => {
    setDraft((prev) => ({ ...prev, durationDays: days, customEndDate: undefined }));
  }, []);

  const selectCustomEndDate = useCallback((iso: string) => {
    setDraft((prev) => ({ ...prev, customEndDate: iso, durationDays: null }));
  }, []);

  const selectProofMethod = useCallback((method: ProofMethod) => {
    setDraft((prev) => ({
      ...prev,
      proofMethod: method,
      // Activity data syncs automatically, so it has no frequency.
      proofFrequency: method === 'Activity data' ? null : prev.proofFrequency ?? 'Every day',
    }));
  }, []);

  const selectProofFrequency = useCallback((frequency: ProofFrequency) => {
    setDraft((prev) => ({ ...prev, proofFrequency: frequency }));
  }, []);

  const selectAudience = useCallback((label: AudienceLabel, circleId?: number | null) => {
    const preset = AUDIENCES.find((a) => a.label === label);
    setDraft((prev) => ({
      ...prev,
      audience: label,
      visibility: preset?.visibility ?? prev.visibility,
      // "Just me" is solo tracking and clears any circle. "My Circle" and
      // "Everyone" keep the known circle so a public pact can still appear
      // on that circle's Wall.
      circleId: label === 'Just me' ? null : circleId ?? prev.circleId ?? null,
    }));
  }, []);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, resolvedSteps.length - 1));
  }, [resolvedSteps]);

  const goToReview = useCallback(() => {
    setStepIndex((i) => {
      const reviewIdx = resolvedSteps.indexOf('review');
      return reviewIdx >= 0 ? reviewIdx : i;
    });
  }, [resolvedSteps]);

  // Called after the create-pact API call succeeds so the flow actually
  // transitions to the SuccessStep screen. 'success' is always the last
  // resolved step (see resolveSteps).
  const goToSuccess = useCallback(() => {
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
    goNext,
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
