'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { CreateCircleFlowProvider, useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { generateCircleSummary, LIVE_SUMMARY_PLACEHOLDER } from '@/lib/createCircleFlow/generate';
import FlowShell from '@/components/create-pact-flow/FlowShell';
import VibeStep from './VibeStep';
import IdentityStep from './IdentityStep';
import PrivacyStep from './PrivacyStep';
import InviteStep from './InviteStep';
import ReviewStep from './ReviewStep';
import SuccessStep from './SuccessStep';

interface CreateCircleFlowProps {
  /** Called when the user taps the close (X) button. Omit to hide the close button (e.g. full-page route). */
  onExit?: () => void;
  initialInviteUserId?: number | null;
}

function StepRouter({ onExit }: CreateCircleFlowProps) {
  const { currentStep, draft, stepIndex, resolvedSteps, canGoBack, goBack } = useCreateCircleFlow();

  return (
    <FlowShell
      onExit={onExit}
      stepIndex={stepIndex}
      totalSteps={resolvedSteps.length - 1}
      canGoBack={canGoBack}
      onBack={goBack}
      showChrome={currentStep !== 'success'}
      titleStripText={generateCircleSummary(draft)}
      titleStripPlaceholder={LIVE_SUMMARY_PLACEHOLDER}
      accent="circle"
      titleStripIcon={Users}
    >
      {currentStep === 'vibe' && <VibeStep />}
      {currentStep === 'identity' && <IdentityStep />}
      {currentStep === 'privacy' && <PrivacyStep />}
      {currentStep === 'invite' && <InviteStep />}
      {currentStep === 'review' && <ReviewStep />}
      {currentStep === 'success' && <SuccessStep />}
    </FlowShell>
  );
}

/**
 * Entry point for the "Create a Circle" immersive tap-flow. Shares its
 * shell/motion language with CreatePactFlow via the generic FlowShell.
 */
export default function CreateCircleFlow({ onExit, initialInviteUserId }: CreateCircleFlowProps) {
  return (
    <CreateCircleFlowProvider initialInviteUserId={initialInviteUserId}>
      <StepRouter onExit={onExit} />
    </CreateCircleFlowProvider>
  );
}
