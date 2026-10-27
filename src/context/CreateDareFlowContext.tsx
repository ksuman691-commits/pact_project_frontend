'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateDare } from '@/hooks/useDareMutations';
import { useUser } from '@/hooks/useUserQueries';
import { resolveDareSteps } from '@/lib/createDareFlow/steps';
import { dareDraftToApiPayload } from '@/lib/createDareFlow/toApiPayload';
import { createEmptyDareDraft, type CreatedDare, type DareDraft, type DareFlowStep } from '@/types/createDareFlow';

interface CreateDareFlowContextValue {
  draft: DareDraft;
  updateDraft: (patch: Partial<DareDraft>) => void;
  currentStep: DareFlowStep;
  stepIndex: number;
  resolvedSteps: DareFlowStep[];
  canGoBack: boolean;
  goNext: () => void;
  goBack: () => void;
  isSubmitting: boolean;
  submit: () => Promise<void>;
  createdDare: CreatedDare | null;
  reset: () => void;
}

const CreateDareFlowContext = createContext<CreateDareFlowContextValue | null>(null);

export function CreateDareFlowProvider({
  children,
  initialRecipientId,
}: {
  children: React.ReactNode;
  /**
   * Pre-attached recipient — arriving from a specific user's "Dare
   * [Name]" CTA (e.g. a shared-circle profile). The target user context
   * is already known, so the visibility and recipient-picker questions
   * must be skipped entirely (never shown a generic recipient search) and
   * that person shown as an already-added recipient.
   */
  initialRecipientId?: number | null;
}) {
  const [draft, setDraft] = useState<DareDraft>(() => {
    let base = createEmptyDareDraft();
    if (initialRecipientId != null) {
      base = { ...base, recipientPreset: true };
    }
    return base;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [createdDare, setCreatedDare] = useState<CreatedDare | null>(null);
  const createDareMutation = useCreateDare();
  const { data: presetUserData } = useUser(initialRecipientId ?? 0);

  // The recipients array needs the full user object (username, full_name,
  // avatar_url) for the review screen and API payload — only the id is
  // known synchronously from the CTA, so seed it once the profile loads.
  useEffect(() => {
    const user = presetUserData?.data;
    if (!user || draft.recipients.some((r) => r.id === user.id)) return;
    setDraft((prev) => ({
      ...prev,
      recipients: [
        { id: user.id, username: user.username, full_name: user.full_name, avatar_url: user.avatar_url },
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetUserData]);

  const resolvedSteps = useMemo(() => resolveDareSteps(draft), [draft]);
  // Clamp in case a draft change removes a step ahead of the current position.
  const safeIndex = Math.min(stepIndex, resolvedSteps.length - 1);
  const currentStep = resolvedSteps[safeIndex];

  const updateDraft = (patch: Partial<DareDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const goNext = () => {
    if (currentStep === 'title' && !draft.title.trim()) {
      toast.error('Give the dare a title first');
      return;
    }
    if (currentStep === 'description' && !draft.description.trim()) {
      toast.error('Add a description so they know what to do');
      return;
    }
    if (currentStep === 'recipients' && draft.recipients.length === 0) {
      toast.error('Pick who you are daring');
      return;
    }
    if (currentStep === 'reward' && draft.rewardAmount != null && (draft.rewardAmount < 1 || draft.rewardAmount > 500 || !Number.isInteger(draft.rewardAmount))) {
      toast.error('A reward is a whole amount from ₹1 to ₹500');
      return;
    }
    setStepIndex((i) => Math.min(resolvedSteps.length - 1, i + 1));
  };

  const submit = async () => {
    try {
      // One dare per person, each with its own clock, proof and reward.
      const picks = draft.recipients;
      const results = await Promise.allSettled(picks.map((r) => createDareMutation.mutateAsync(dareDraftToApiPayload(draft, r.id))));
      const nameOf = (r: (typeof picks)[number]) => (r.full_name || r.username).split(' ')[0];
      const sent = results.flatMap((res, i) => (res.status === 'fulfilled' ? [{ id: res.value.data.id as number, name: nameOf(picks[i]) }] : []));
      const failed = results.flatMap((res, i) => (res.status === 'rejected' ? [nameOf(picks[i])] : []));
      if (sent.length === 0) return;
      setCreatedDare({ id: sent[0].id, title: draft.title.trim(), sentTo: sent.map((s) => s.name), failedFor: failed });
      setStepIndex(resolvedSteps.length - 1);
    } catch {
      // Error toast already handled by useCreateDare's onError.
    }
  };

  // "Create another" on the success screen — start a fresh dare draft
  // without closing the surrounding modal/page.
  const reset = () => {
    setDraft(createEmptyDareDraft());
    setStepIndex(0);
    setCreatedDare(null);
  };

  const value: CreateDareFlowContextValue = {
    draft,
    updateDraft,
    currentStep,
    stepIndex: safeIndex,
    resolvedSteps,
    canGoBack: safeIndex > 0 && currentStep !== 'success',
    goNext,
    goBack,
    isSubmitting: createDareMutation.isPending,
    submit,
    createdDare,
    reset,
  };

  return <CreateDareFlowContext.Provider value={value}>{children}</CreateDareFlowContext.Provider>;
}

export function useCreateDareFlow() {
  const ctx = useContext(CreateDareFlowContext);
  if (!ctx) throw new Error('useCreateDareFlow must be used within CreateDareFlowProvider');
  return ctx;
}
