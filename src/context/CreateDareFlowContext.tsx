'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateDare } from '@/hooks/useDareMutations';
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

export function CreateDareFlowProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<DareDraft>(createEmptyDareDraft());
  const [stepIndex, setStepIndex] = useState(0);
  const [createdDare, setCreatedDare] = useState<CreatedDare | null>(null);
  const createDareMutation = useCreateDare();

  const resolvedSteps = useMemo(() => resolveDareSteps(draft), [draft]);
  // Clamp in case a draft change (e.g. switching visibility away from
  // private) removes a step ahead of the current position.
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
    if (currentStep === 'recipients' && draft.visibility === 'private' && draft.recipients.length === 0) {
      toast.error('Add at least one recipient, or switch to public');
      return;
    }
    setStepIndex((i) => Math.min(resolvedSteps.length - 1, i + 1));
  };

  const submit = async () => {
    try {
      const response = await createDareMutation.mutateAsync(dareDraftToApiPayload(draft));
      setCreatedDare({ id: response.data.id, title: draft.title.trim() });
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
