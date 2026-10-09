'use client';

import { useState } from 'react';
import { Calendar, Camera, Check, Clock, Users } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { useCreatePact } from '@/hooks/usePactMutations';
import { useCircles } from '@/hooks/useCircles';
import { AUDIENCES } from '@/lib/createPactFlow/content';
import { generateDescription, generateTitle, resolveDurationDays } from '@/lib/createPactFlow/generate';
import { requiredDays } from '@/lib/createPactFlow/steps';
import { toCreatePactApiPayload } from '@/lib/createPactFlow/toApiPayload';
import { PrimaryButton, FieldLabel } from './Chip';
import CustomizePanel, { PROOF_METHOD_LABELS } from './CustomizePanel';
import PactFlowShell from './PactFlowShell';

type IconType = React.ComponentType<{ className?: string }>;

function SummaryRow({ icon: Icon, label, value, last }: { icon: IconType; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex h-14 items-center gap-3 ${last ? '' : 'border-b border-[var(--hairline)]'}`}>
      <Icon className="size-5 shrink-0 text-[var(--muted)]" />
      <div className="flex-1 text-sm font-semibold text-[var(--muted)]">{label}</div>
      <div className="text-right text-sm font-extrabold">{value}</div>
    </div>
  );
}

function CountsLine({ icon: Icon, children }: { icon: IconType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)]/10 text-[var(--navy)]">
        <Icon className="size-5" />
      </div>
      <div className="text-[15px] font-bold leading-5">{children}</div>
    </div>
  );
}

function formatStart(startDate?: string): string {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (!startDate || startDate === todayIso) return 'Today';
  return new Date(`${startDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ReviewStep({ onExit }: { onExit?: () => void }) {
  const { draft, activity, setIsSubmitting, isSubmitting, setCreatedPact, goToSuccess } = useCreatePactFlow();
  const { data: circles } = useCircles();
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
        circleId: draft.audience === 'My Circle' ? draft.circleId ?? null : null,
        createdBy: '',
        createdAt: new Date().toISOString(),
      });
      goToSuccess();
    } catch {
      // useCreatePact already toasts the error; keep a local message too so
      // the button re-enables and the user sees inline feedback.
      setSubmitError('Something went wrong creating your pact. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = resolveDurationDays(draft);
  const isMilestone = Boolean(activity?.milestone);
  const frequency = draft.proofFrequency;
  const method = draft.proofMethod ?? 'Moment';

  const audienceOption =
    AUDIENCES.find((a) => a.label === draft.audience) ?? AUDIENCES.find((a) => a.visibility === draft.visibility);
  const circleName =
    draft.audience === 'My Circle' && Array.isArray(circles)
      ? circles.find((c: any) => c.id === draft.circleId)?.name
      : undefined;
  const audienceValue = [circleName, audienceOption?.displayLabel].filter(Boolean).join(' \u00b7 ');

  // Line 1 matches the selected cadence; the backend's completion threshold
  // applies to every non-milestone pact regardless of proof frequency.
  const firstLine =
    frequency === 'Every day'
      ? 'Share a moment each day'
      : frequency === 'Every 2 days'
        ? 'Share a moment every 2 days'
        : frequency === 'Every week'
          ? 'Share a moment every week'
          : frequency === 'At the end of the Pact'
            ? 'Share one moment at the end of the pact'
            : 'Your activity syncs automatically';

  return (
    <PactFlowShell
      onExit={onExit}
      accent="when"
      eyebrow="Review your pact"
      footer={
        <>
          {submitError && (
            <p role="alert" className="text-sm font-semibold text-[var(--navy)]">
              {submitError}
            </p>
          )}
          <PrimaryButton onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create pact'}
          </PrimaryButton>
        </>
      }
    >
      <div className="rounded-3xl border border-[var(--hairline)] bg-[var(--card)] px-[18px] py-1.5">
        <SummaryRow icon={Calendar} label="Starts" value={formatStart(draft.startDate)} />
        <SummaryRow
          icon={Camera}
          label={frequency === 'Every day' ? 'Daily moment' : 'Proof'}
          value={PROOF_METHOD_LABELS[method]}
        />
        <SummaryRow icon={Users} label="Who's watching" value={audienceValue || 'Private'} last />
      </div>

      <div>
        <FieldLabel>How it counts</FieldLabel>
        <div className="flex flex-col gap-3.5">
          {isMilestone ? (
            <CountsLine icon={Camera}>Share one moment when you finish</CountsLine>
          ) : (
            <>
              <CountsLine icon={Camera}>{firstLine}</CountsLine>
              <CountsLine icon={Clock}>The day counts automatically at midnight</CountsLine>
              {total > 0 && (
                <CountsLine icon={Check}>
                  Show up on {requiredDays(total)} of {total} days to complete it
                </CountsLine>
              )}
            </>
          )}
        </div>
      </div>

      <CustomizePanel />
    </PactFlowShell>
  );
}
