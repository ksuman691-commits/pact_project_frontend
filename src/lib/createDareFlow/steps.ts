import type { DareDraft, DareFlowStep } from '@/types/createDareFlow';

/**
 * Recipients screen only appears for private dares. Visibility and
 * recipients are both skipped entirely when the flow was launched from a
 * specific user's "Dare [Name]" CTA (draft.recipientPreset) — that
 * question is already answered by context, same as Create Pact's
 * audiencePreset skipping its audience step.
 */
export function resolveDareSteps(draft: DareDraft): DareFlowStep[] {
  const steps: DareFlowStep[] = ['title', 'description', 'timing'];
  if (!draft.recipientPreset) {
    steps.push('visibility');
    if (draft.visibility === 'private') steps.push('recipients');
  }
  steps.push('verification', 'review', 'success');
  return steps;
}
