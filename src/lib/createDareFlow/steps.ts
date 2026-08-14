import type { DareDraft, DareFlowStep } from '@/types/createDareFlow';

/** Recipients screen only appears for private dares. */
export function resolveDareSteps(draft: DareDraft): DareFlowStep[] {
  const steps: DareFlowStep[] = ['title', 'description', 'timing', 'visibility'];
  if (draft.visibility === 'private') steps.push('recipients');
  steps.push('verification', 'review', 'success');
  return steps;
}
