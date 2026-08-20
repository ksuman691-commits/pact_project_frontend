'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, PartyPopper, X } from 'lucide-react';
import { dismissProfileChecklist } from '@/lib/onboarding';
import type { ProfileChecklistItem, ProfileChecklistItemId } from '@/hooks/useProfileCompletion';

interface ProfileCompletionCardProps {
  percent: number;
  checklist: ProfileChecklistItem[];
  onDismiss: () => void;
}

const STEP_COPY: Partial<Record<ProfileChecklistItemId, { description: string; cta: string; href: string }>> = {
  photo: { description: 'Add a photo so your Circle knows it\u2019s really you.', cta: 'Add photo', href: '/profile/edit' },
  circle: { description: 'Join a Circle to start holding people (and yourself) accountable.', cta: 'Browse Circles', href: '/circles' },
  pact: { description: 'Create your first Pact to put a stake behind a goal.', cta: 'Create a Pact', href: '/pacts/create' },
};

/**
 * New-user variant of the profile-completion nudge (see useProfileCompletion).
 * Guided one-step-at-a-time flow rather than a flat checklist: shows the
 * single next incomplete step with a "Skip" option, and a positive closing
 * message once every step is done or skipped through. Skipping only moves a
 * step out of the way for this viewing — it isn't persisted per-item, so it
 * can resurface next time the flow is shown (see the 7-day suppression
 * stamped below, which covers the whole flow rather than individual steps).
 */
export default function ProfileCompletionCard({ percent, checklist, onDismiss }: ProfileCompletionCardProps) {
  const router = useRouter();
  const [skippedIds, setSkippedIds] = useState<Set<ProfileChecklistItemId>>(new Set());

  // Being shown at all counts as "seen" for the 7-day frequency rule, so
  // stamp it once on mount rather than only on explicit dismissal — closing
  // the tab mid-flow shouldn't reset the clock.
  useEffect(() => {
    dismissProfileChecklist();
  }, []);

  const pendingSteps = useMemo(
    () => checklist.filter((item) => item.id !== 'account' && !item.done && !skippedIds.has(item.id)),
    [checklist, skippedIds],
  );
  const currentStep = pendingSteps[0] ?? null;
  const isFlowComplete = !currentStep;

  const handleClose = () => {
    dismissProfileChecklist();
    onDismiss();
  };

  const handleSkip = () => {
    if (!currentStep) return;
    setSkippedIds((prev) => new Set(prev).add(currentStep.id));
  };

  const handleAction = () => {
    if (!currentStep) return;
    const copy = STEP_COPY[currentStep.id];
    if (copy) router.push(copy.href);
  };

  const ringStyle = {
    background: `conic-gradient(var(--pact-pink) ${percent}%, var(--pact-surface-2) ${percent}% 100%)`,
  };

  return (
    <div className="pact-card relative rounded-[28px] px-4 py-4">
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[var(--pact-text-faint)] transition hover:bg-[var(--pact-surface-2)] hover:text-[var(--pact-text)]"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>

      {isFlowComplete ? (
        <div className="flex items-center gap-4 pr-6">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
          >
            <PartyPopper className="h-6 w-6" style={{ color: 'var(--pact-bg)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--pact-text)]">All set!</p>
            <p className="mt-0.5 text-xs text-[var(--pact-text-faint)]">You&apos;re ready to get the most out of CirclePact.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 pr-6">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={ringStyle}>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--pact-bg)', color: 'var(--pact-text)' }}
              >
                {percent}%
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--pact-text)]">{currentStep.label}</p>
              <p className="mt-0.5 text-xs text-[var(--pact-text-faint)]">{STEP_COPY[currentStep.id]?.description}</p>
            </div>
          </div>

          {/* Compact progress dots for the other steps, so it still reads as a multi-step flow rather than an isolated card. */}
          <div className="mt-3 flex items-center gap-1.5 pl-[72px]">
            {checklist
              .filter((item) => item.id !== 'account')
              .map((item) => (
                <span
                  key={item.id}
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={
                    item.done
                      ? { background: 'var(--pact-mint)' }
                      : item.id === currentStep.id
                        ? { border: '1.5px solid var(--pact-pink)', background: 'transparent' }
                        : { border: '1.5px solid var(--pact-hairline)', background: 'transparent' }
                  }
                >
                  {item.done && <Check className="h-3 w-3" strokeWidth={3} style={{ color: 'var(--pact-bg)' }} />}
                </span>
              ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAction}
              className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-[var(--pact-bg)] transition"
              style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
            >
              {STEP_COPY[currentStep.id]?.cta}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--pact-text-faint)] transition hover:bg-[var(--pact-surface-2)] hover:text-[var(--pact-text)]"
            >
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
