'use client';

import React, { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { CreateDareFlowProvider, useCreateDareFlow } from '@/context/CreateDareFlowContext';
import FlowHero from '@/components/flow/FlowHero';
import TaggedParticipantBanner from '@/components/create-pact-flow/TaggedParticipantBanner';
import { DARE_STEP_LABEL } from '@/lib/createDareFlow/steps';
import DarePreviewTile from './DarePreviewTile';
import TitleStep from './TitleStep';
import RecipientsStep from './RecipientsStep';
import TermsStep from './TermsStep';
import SuccessStep from './SuccessStep';

interface CreateDareFlowProps {
  onExit: () => void;
  /** Pre-attached recipient (arriving from a specific user's "Dare [Name]" CTA) — skips the visibility/recipient-picker steps and shows them as already-added. */
  initialRecipientId?: number | null;
}

function StepRouter({ onExit }: { onExit: () => void }) {
  const { currentStep, draft, stepIndex, resolvedSteps, canGoBack, goBack } = useCreateDareFlow();
  const [confirmExit, setConfirmExit] = useState(false);
  // Closing with typed details used to throw them away silently. Ask first when there is something to lose.
  const typedSomething =
    currentStep !== 'success' &&
    Boolean(draft.title?.trim() || draft.description?.trim() || (!draft.recipientPreset && draft.recipients?.length));
  const requestExit = () => (typedSomething ? setConfirmExit(true) : onExit());

  return (
    <>
    {currentStep === 'success' ? (
      <SuccessStep onDone={onExit} />
    ) : (
      <div className="fixed inset-0 z-10 flex flex-col overflow-y-auto bg-[var(--paper)] text-[var(--ink)]">
        <FlowHero
          tone="dare"
          steps={resolvedSteps.filter((s) => s !== 'success').map((s) => DARE_STEP_LABEL[s as keyof typeof DARE_STEP_LABEL])}
          current={stepIndex}
          onBack={canGoBack ? goBack : undefined}
          onExit={requestExit}
        >
          <DarePreviewTile draft={draft} />
        </FlowHero>
        {draft.recipientPreset && draft.recipients[0] && (
          <div className="px-5 pt-4">
            <TaggedParticipantBanner userId={draft.recipients[0].id} label="Daring" />
          </div>
        )}
        <div key={currentStep} className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {currentStep === 'title' && <TitleStep />}
          {currentStep === 'recipients' && <RecipientsStep />}
          {currentStep === 'terms' && <TermsStep />}
        </div>
      </div>
    )}
    <ConfirmModal
      isOpen={confirmExit}
      onClose={() => setConfirmExit(false)}
      onConfirm={() => {
        setConfirmExit(false);
        onExit();
      }}
      title="Discard this dare?"
      description="What you've typed will be lost."
      confirmLabel="Discard"
      cancelLabel="Keep editing"
      destructive
    />
    </>
  );
}

export default function CreateDareFlow({ onExit, initialRecipientId }: CreateDareFlowProps) {
  return (
    <CreateDareFlowProvider initialRecipientId={initialRecipientId}>
      <StepRouter onExit={onExit} />
    </CreateDareFlowProvider>
  );
}
