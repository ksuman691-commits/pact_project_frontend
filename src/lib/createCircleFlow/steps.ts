import type { CircleFlowStep } from '@/types/createCircleFlow';

/**
 * Fixed order: Vibe → Identity → Privacy → Invite → Review → Success.
 * `skipVibe` omits the Vibe step entirely — used when the circle already
 * has a vibe seeded from context (e.g. a goal-match's category), so the
 * user isn't asked to re-pick something we already know.
 */
export function resolveCircleSteps(skipVibe = false): CircleFlowStep[] {
  const steps: CircleFlowStep[] = ['vibe', 'identity', 'privacy', 'invite', 'review', 'success'];
  return skipVibe ? steps.filter((step) => step !== 'vibe') : steps;
}

export function validateCircleName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return { valid: false, error: 'Use 2-40 characters.' };
  }
  return { valid: true };
}
