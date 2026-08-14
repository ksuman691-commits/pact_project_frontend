'use client';

import React from 'react';
import { CreatePactFlowProvider, useCreatePactFlow } from '@/context/CreatePactFlowContext';
import FlowShell from './FlowShell';
import VibeStep from './VibeStep';
import ActivityStep from './ActivityStep';
import TargetStep from './TargetStep';
import DurationStep from './DurationStep';
import ProofStep from './ProofStep';
import AudienceStep from './AudienceStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';

interface CreatePactFlowProps {
  /** Called when the user taps the close (X) button. Omit to hide the close button (e.g. full-page route). */
  onExit?: () => void;
}

function StepRouter({ onExit }: CreatePactFlowProps) {
  const { currentStep } = useCreatePactFlow();

  return (
    <FlowShell onExit={onExit}>
      {currentStep === 'vibe' && <VibeStep />}
      {currentStep === 'activity' && <ActivityStep />}
      {currentStep === 'target' && <TargetStep />}
      {currentStep === 'duration' && <DurationStep />}
      {currentStep === 'proof' && <ProofStep />}
      {currentStep === 'audience' && <AudienceStep />}
      {currentStep === 'review' && <ReviewStep />}
      {currentStep === 'success' && <SuccessStep />}
    </FlowShell>
  );
}

/**
 * Entry point for the "Create a Pact" immersive tap-flow.
 * Wrap in the flow's own provider so each mount starts a fresh draft.
 */
export default function CreatePactFlow({ onExit }: CreatePactFlowProps) {
  return (
    <CreatePactFlowProvider>
      <StepRouter onExit={onExit} />
    </CreatePactFlowProvider>
  );
}
