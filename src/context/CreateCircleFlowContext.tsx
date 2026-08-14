'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import type { CircleDraft, CircleFlowStep, CreatedCircle, PrivacyLevel } from '@/types/createCircleFlow';
import type { VibeId } from '@/types/createPactFlow';
import { createEmptyCircleDraft } from '@/types/createCircleFlow';
import { resolveCircleSteps } from '@/lib/createCircleFlow/steps';

const AUTO_ADVANCE_DELAY_MS = 150;

interface CreateCircleFlowContextValue {
  draft: CircleDraft;
  updateDraft: (patch: Partial<CircleDraft>) => void;
  resolvedSteps: CircleFlowStep[];
  stepIndex: number;
  currentStep: CircleFlowStep;
  goBack: () => void;
  canGoBack: boolean;

  pickVibe: (vibeId: VibeId) => void;
  setEmoji: (emoji: string) => void;
  setName: (name: string) => void;
  setTagline: (tagline: string) => void;
  confirmIdentity: () => void;
  pickPrivacy: (privacy: PrivacyLevel) => void;
  toggleInvite: (userId: number) => void;
  confirmInvites: () => void;
  goToReview: () => void;

  reset: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  createdCircle: CreatedCircle | null;
  setCreatedCircle: (c: CreatedCircle | null) => void;
}

const CreateCircleFlowContext = createContext<CreateCircleFlowContextValue | null>(null);

export function CreateCircleFlowProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<CircleDraft>(createEmptyCircleDraft());
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCircle, setCreatedCircle] = useState<CreatedCircle | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resolvedSteps = useMemo(() => resolveCircleSteps(), []);
  const currentStep = resolvedSteps[stepIndex] ?? 'vibe';

  const updateDraft = useCallback((patch: Partial<CircleDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  /** Update the draft immediately (tap registers visually), then advance
   * one step after a short delay — matches Create Pact's auto-advance feel. */
  const commitAndAdvance = useCallback((updater: (prev: CircleDraft) => CircleDraft) => {
    setDraft(updater);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, AUTO_ADVANCE_DELAY_MS);
  }, []);

  const pickVibe = useCallback(
    (vibeId: VibeId) => {
      commitAndAdvance((prev) => ({ ...prev, vibeId }));
    },
    [commitAndAdvance],
  );

  const setEmoji = useCallback((emoji: string) => updateDraft({ emoji }), [updateDraft]);
  const setName = useCallback((name: string) => updateDraft({ name }), [updateDraft]);
  const setTagline = useCallback((tagline: string) => updateDraft({ tagline }), [updateDraft]);

  // Identity requires typing → explicit Continue action, not auto-advance.
  const confirmIdentity = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex((i) => i + 1);
  }, []);

  const pickPrivacy = useCallback(
    (privacy: PrivacyLevel) => {
      commitAndAdvance((prev) => ({ ...prev, privacy }));
    },
    [commitAndAdvance],
  );

  const toggleInvite = useCallback((userId: number) => {
    setDraft((prev) => {
      const has = prev.inviteUserIds.includes(userId);
      return {
        ...prev,
        inviteUserIds: has ? prev.inviteUserIds.filter((id) => id !== userId) : [...prev.inviteUserIds, userId],
      };
    });
  }, []);

  // Invite is multi-select → explicit Continue/Skip action, not auto-advance.
  const confirmInvites = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex((i) => i + 1);
  }, []);

  const goToReview = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex(resolvedSteps.indexOf('review'));
  }, [resolvedSteps]);

  const reset = useCallback(() => {
    setDraft(createEmptyCircleDraft());
    setStepIndex(0);
    setCreatedCircle(null);
  }, []);

  const value: CreateCircleFlowContextValue = {
    draft,
    updateDraft,
    resolvedSteps,
    stepIndex,
    currentStep,
    goBack,
    canGoBack: stepIndex > 0 && currentStep !== 'success',
    pickVibe,
    setEmoji,
    setName,
    setTagline,
    confirmIdentity,
    pickPrivacy,
    toggleInvite,
    confirmInvites,
    goToReview,
    reset,
    isSubmitting,
    setIsSubmitting,
    createdCircle,
    setCreatedCircle,
  };

  return <CreateCircleFlowContext.Provider value={value}>{children}</CreateCircleFlowContext.Provider>;
}

export function useCreateCircleFlow() {
  const ctx = useContext(CreateCircleFlowContext);
  if (!ctx) throw new Error('useCreateCircleFlow must be used within CreateCircleFlowProvider');
  return ctx;
}
