import type { DareDraft } from '@/types/createDareFlow';

export const REWARD_MAX = 500;

/**
 * complete_by is respond_by plus the completion window. The server treats the
 * gap between the two as "time to do it" and restarts that clock the moment
 * the dare is accepted, so someone who accepts late still gets the full window.
 */
export function dareDraftToApiPayload(draft: DareDraft) {
  const respondAt = Date.now() + draft.respondByHours * 60 * 60 * 1000;
  const payload: Record<string, unknown> = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    respond_by: new Date(respondAt).toISOString(),
    complete_by: new Date(respondAt + draft.completeByHours * 60 * 60 * 1000).toISOString(),
    verification_method: draft.verificationMethod,
    audience: 'individual',
    recipient_user_ids: draft.recipients.slice(0, 1).map((r) => r.id),
  };
  if (draft.rewardAmount && draft.rewardAmount > 0) payload.reward_amount = Math.min(REWARD_MAX, Math.round(draft.rewardAmount));
  return payload;
}
