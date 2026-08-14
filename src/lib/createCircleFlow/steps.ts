import type { CircleFlowStep } from '@/types/createCircleFlow';

/** Fixed order: Vibe → Identity → Privacy → Invite → Review → Success. */
export function resolveCircleSteps(): CircleFlowStep[] {
  return ['vibe', 'identity', 'privacy', 'invite', 'review', 'success'];
}

export function validateCircleName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return { valid: false, error: 'Use 2-40 characters.' };
  }
  return { valid: true };
}
