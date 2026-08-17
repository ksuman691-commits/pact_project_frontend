'use client';

import React from 'react';
import { CreateDareFlowProvider, useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { generateDareSummary, DARE_LIVE_TITLE_PLACEHOLDER } from '@/lib/createDareFlow/generate';
import FlowShell from '@/components/create-pact-flow/FlowShell';
import TaggedParticipantBanner from '@/components/create-pact-flow/TaggedParticipantBanner';
import TitleStep from './TitleStep';
import DescriptionStep from './DescriptionStep';
import TimingStep from './TimingStep';
import VisibilityStep from './VisibilityStep';
import RecipientsStep from './RecipientsStep';
import VerificationStep from './VerificationStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';

interface CreateDareFlowProps {
  onExit: () => void;
  /** Pre-attached recipient (arriving from a specific user's "Dare [Name]" CTA) — skips the visibility/recipient-picker steps and shows them as already-added. */
  initialRecipientId?: number | null;
}

function StepRouter({ onExit }: { onExit: () => void }) {
  const { currentStep, draft, stepIndex, resolvedSteps, canGoBack, goBack } = useCreateDareFlow();

  return (
    <FlowShell
      onExit={onExit}
      stepIndex={stepIndex}
      totalSteps={resolvedSteps.length - 1}
      canGoBack={canGoBack}
      onBack={goBack}
      showChrome={currentStep !== 'success'}
      titleStripText={generateDareSummary(draft)}
      titleStripPlaceholder={DARE_LIVE_TITLE_PLACEHOLDER}
      banner={
        draft.recipientPreset && draft.recipients[0] ? (
          <TaggedParticipantBanner userId={draft.recipients[0].id} label="Daring" />
        ) : null
      }
    >
      {currentStep === 'title' && <TitleStep />}
      {currentStep === 'description' && <DescriptionStep />}
      {currentStep === 'timing' && <TimingStep />}
      {currentStep === 'visibility' && <VisibilityStep />}
      {currentStep === 'recipients' && <RecipientsStep />}
      {currentStep === 'verification' && <VerificationStep />}
      {currentStep === 'review' && <ReviewStep />}
      {currentStep === 'success' && <SuccessStep onDone={onExit} />}
    </FlowShell>
  );
}

export default function CreateDareFlow({ onExit, initialRecipientId }: CreateDareFlowProps) {
  return (
    <CreateDareFlowProvider initialRecipientId={initialRecipientId}>
      <StepRouter onExit={onExit} />
    </CreateDareFlowProvider>
  );
}
