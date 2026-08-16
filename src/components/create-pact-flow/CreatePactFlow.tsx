'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { CreatePactFlowProvider, useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { generateTitle, LIVE_TITLE_PLACEHOLDER } from '@/lib/createPactFlow/generate';
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
  /** Pre-set circle audience (arriving from a Circle's "Start a Pact for this Circle" CTA) — skips the audience step. */
  initialCircleId?: number | null;
  /** Free text carried over from another flow (e.g. Dare's "switch to a Pact" nudge). */
  initialDescription?: string | null;
}

function StepRouter({ onExit }: CreatePactFlowProps) {
  const { currentStep, draft, activity, stepIndex, resolvedSteps, canGoBack, goBack } = useCreatePactFlow();

  return (
    <FlowShell
      onExit={onExit}
      stepIndex={stepIndex}
      totalSteps={resolvedSteps.length - 1}
      canGoBack={canGoBack}
      onBack={goBack}
      showChrome={currentStep !== 'success'}
      titleStripText={generateTitle(draft, activity)}
      titleStripPlaceholder={LIVE_TITLE_PLACEHOLDER}
      titleStripIcon={Target}
    >
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
export default function CreatePactFlow({ onExit, initialCircleId, initialDescription }: CreatePactFlowProps) {
  return (
    <CreatePactFlowProvider initialCircleId={initialCircleId} initialDescription={initialDescription}>
      <StepRouter onExit={onExit} />
    </CreatePactFlowProvider>
  );
}
