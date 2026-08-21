'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import type { CircleDraft, CircleFlowStep, CreatedCircle, PrivacyLevel } from '@/types/createCircleFlow';
import type { VibeId } from '@/types/createPactFlow';
import { createEmptyCircleDraft } from '@/types/createCircleFlow';
import { resolveCircleSteps } from '@/lib/createCircleFlow/steps';
import { generateMatchTagline } from '@/lib/createCircleFlow/generate';
import { categoryToVibe } from '@/lib/createPactFlow/toApiPayload';

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
  setPhoto: (file: File) => void;
  clearPhoto: () => void;
  confirmIdentity: () => void;
  pickPrivacy: (privacy: PrivacyLevel) => void;
  toggleInvite: (userId: number) => void;
  confirmInvites: () => void;
  goToReview: () => void;
  advanceToSuccess: () => void;

  reset: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  createdCircle: CreatedCircle | null;
  setCreatedCircle: (c: CreatedCircle | null) => void;
}

const CreateCircleFlowContext = createContext<CreateCircleFlowContextValue | null>(null);

export function CreateCircleFlowProvider({
  children,
  initialInviteUserId,
  initialCategory,
  initialPactId,
}: {
  children: React.ReactNode;
  /** A single id (existing single-invite deep links) or multiple ids at once
   * (e.g. "start a circle with everyone on the same goal" — see
   * GoalMatchStrip). */
  initialInviteUserId?: number | number[] | null;
  /**
   * Carried over from a goal-match "Start a circle with them" CTA (see
   * FeedPactCard/GoalMatchStrip). Seeds vibeId via categoryToVibe (skipping
   * the Vibe step entirely) and a suggested tagline, and is stashed on the
   * draft as matchCategory so SuccessStep can offer to create a matching
   * pact once the circle exists.
   */
  initialCategory?: string | null;
  /** The originating pact's id — stashed as matchPactId so the eventual
   * matching-pact CTA can look up its duration as a bonus prefill. */
  initialPactId?: number | null;
}) {
  const seededVibeId = categoryToVibe(initialCategory);
  const [draft, setDraft] = useState<CircleDraft>(() => ({
    ...createEmptyCircleDraft(),
    inviteUserIds: Array.isArray(initialInviteUserId)
      ? initialInviteUserId
      : initialInviteUserId
        ? [initialInviteUserId]
        : [],
    ...(seededVibeId ? { vibeId: seededVibeId } : {}),
    ...(initialCategory ? { tagline: generateMatchTagline(initialCategory) } : {}),
    matchCategory: initialCategory ?? null,
    matchPactId: initialPactId ?? null,
  }));
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCircle, setCreatedCircle] = useState<CreatedCircle | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Fixed at init (not recomputed if vibeId later changes) — this only ever
  // reflects whether a vibe was seeded from context on mount.
  const resolvedSteps = useMemo(() => resolveCircleSteps(seededVibeId != null), [seededVibeId]);
  const currentStep = resolvedSteps[stepIndex] ?? resolvedSteps[0];

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

  const setPhoto = useCallback(
    (file: File) => {
      setDraft((prev) => {
        // Revoke the previous preview URL before replacing it so we don't
        // leak object URLs if the user swaps photos multiple times.
        if (prev.photoPreviewUrl) URL.revokeObjectURL(prev.photoPreviewUrl);
        return { ...prev, photoFile: file, photoPreviewUrl: URL.createObjectURL(file) };
      });
    },
    [],
  );

  const clearPhoto = useCallback(() => {
    setDraft((prev) => {
      if (prev.photoPreviewUrl) URL.revokeObjectURL(prev.photoPreviewUrl);
      return { ...prev, photoFile: null, photoPreviewUrl: null };
    });
  }, []);

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

  // Called by ReviewStep once the circle has actually been created — moves
  // the index-driven router to the 'success' step.
  const advanceToSuccess = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex(resolvedSteps.indexOf('success'));
  }, [resolvedSteps]);

  const reset = useCallback(() => {
    setDraft((prev) => {
      if (prev.photoPreviewUrl) URL.revokeObjectURL(prev.photoPreviewUrl);
      return createEmptyCircleDraft();
    });
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
    setPhoto,
    clearPhoto,
    confirmIdentity,
    pickPrivacy,
    toggleInvite,
    confirmInvites,
    goToReview,
    advanceToSuccess,
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
