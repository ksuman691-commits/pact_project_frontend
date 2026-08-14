'use client';

import { useState } from 'react';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { useCreateCircle } from '@/hooks/useCircleMutations';
import { circleAdvancedService } from '@/services/api';
import { toCreateCircleApiPayload } from '@/lib/createCircleFlow/toApiPayload';
import CircleCard from './CircleCard';

export default function ReviewStep() {
  const { draft, setIsSubmitting, isSubmitting, setCreatedCircle, advanceToSuccess } = useCreateCircleFlow();
  const createCircle = useCreateCircle();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isSubmitting) return; // double-tap guard
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = toCreateCircleApiPayload(draft);
      const response = await createCircle.mutateAsync(payload);
      const created = response?.data ?? payload;

      // Invites are sent as a best-effort follow-up — a failure here
      // shouldn't block the circle itself from being reported as created.
      if (draft.inviteUserIds.length > 0 && created?.id) {
        await Promise.allSettled(
          draft.inviteUserIds.map((userId) => circleAdvancedService.inviteUser(created.id, userId)),
        );
      }

      setCreatedCircle({
        id: created?.id ?? Date.now(),
        name: payload.name,
        emoji: draft.emoji,
        tagline: payload.description,
        vibeId: draft.vibeId,
        privacy: draft.privacy ?? 'open',
        memberCount: created?.memberCount ?? 1,
      });
      advanceToSuccess();
    } catch (error) {
      setSubmitError('Something went wrong creating your circle. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Review your circle</h1>
      <p className="mt-1 text-sm">This is what it&apos;ll look like.</p>

      <div className="mt-6">
        <CircleCard />
      </div>

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
        {isSubmitting ? 'Creating…' : '👯 Create Circle →'}
      </button>
    </div>
  );
}
