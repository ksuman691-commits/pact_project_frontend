'use client';

import { useState } from 'react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { useCreatePact } from '@/hooks/usePactMutations';
import { toCreatePactApiPayload } from '@/lib/createPactFlow/toApiPayload';
import { generateDescription, generateTitle, resolveDurationDays } from '@/lib/createPactFlow/generate';
import PactCard from './PactCard';
import CustomizePanel from './CustomizePanel';

export default function ReviewStep() {
  const { draft, activity, setIsSubmitting, isSubmitting, setCreatedPact, goToSuccess } = useCreatePactFlow();
  const createPact = useCreatePact();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isSubmitting || !activity) return; // double-tap guard
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = toCreatePactApiPayload(draft, activity);
      const response = await createPact.mutateAsync(payload);
      const created = response?.data ?? payload;

      setCreatedPact({
        id: String(created?.id ?? created?.pact_id ?? Date.now()),
        title: generateTitle(draft, activity),
        description: generateDescription(draft),
        startDate: payload.start_date,
        endDate: payload.end_date,
        vibeId: draft.vibeId!,
        activityLabel: activity.custom ? draft.customActivityLabel?.trim() || activity.label : activity.label,
        target: draft.target,
        unit: activity.unit ?? null,
        proofMethod: draft.proofMethod ?? '',
        proofFrequency: draft.proofFrequency,
        audience: draft.audience ?? '',
        visibility: draft.visibility,
        createdBy: '',
        createdAt: new Date().toISOString(),
      });
      // Transition the flow to the real success step (stamp + title +
      // suggestions). Without this the draft is created but the user is
      // left staring at this same review screen with no visible change.
      goToSuccess();
    } catch (error) {
      // useCreatePact already toasts the error; keep a local message too so
      // the button re-enables and the user sees inline feedback.
      setSubmitError('Something went wrong creating your pact. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationDays = resolveDurationDays(draft);

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Review your pact</h1>
      <p className="mt-1 text-sm">{durationDays} days of showing up. Ready?</p>

      <div className="mt-6">
        <PactCard />
      </div>

      <CustomizePanel />

      {submitError && (
        <p role="alert" className="mt-4 text-sm" style={{ color: 'var(--pact-pink)' }}>
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={isSubmitting}
        className="mt-8 w-full rounded-full px-6 py-4 text-center text-base font-semibold text-[var(--pact-bg)] transition-opacity disabled:opacity-60"
        style={{ background: 'var(--pact-pink)' }}
      >
        {isSubmitting ? 'Creating…' : '🔥 Create Pact →'}
      </button>
    </div>
  );
}
