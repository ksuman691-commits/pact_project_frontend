import type { DareDraft, DareFlowStep } from '@/types/createDareFlow';

/**
 * Dares are one-to-one, so there's no audience question: you pick the one
 * person you're daring, unless the flow was opened from their profile
 * ("Dare [Name]"), in which case they're already attached.
 */
export function resolveDareSteps(draft: DareDraft): DareFlowStep[] {
  const steps: DareFlowStep[] = ['title', 'description', 'timing'];
  if (!draft.recipientPreset) steps.push('recipients');
  steps.push('reward', 'verification', 'review', 'success');
  return steps;
}
