import type { DareDraft, DareFlowStep } from '@/types/createDareFlow';

/**
 * Three steps: What (the dare, details optional), Who (skipped when the flow
 * was opened from someone's profile, "Dare [Name]"), and Send: the clock,
 * proof and reward on one screen with the slide to send. These used to be
 * seven screens; the live ticket at the top replaced the review list.
 */
export function resolveDareSteps(draft: DareDraft): DareFlowStep[] {
  const steps: DareFlowStep[] = ['title'];
  if (!draft.recipientPreset) steps.push('recipients');
  steps.push('terms', 'success');
  return steps;
}

export const DARE_STEP_LABEL: Record<Exclude<DareFlowStep, 'success'>, string> = {
  title: 'What',
  recipients: 'Who',
  terms: 'Send',
};
