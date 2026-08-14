import type { DareDraft } from '@/types/createDareFlow';

export function dareDraftToApiPayload(draft: DareDraft) {
  const now = Date.now();
  const respond_by = new Date(now + draft.respondByHours * 60 * 60 * 1000).toISOString();
  const complete_by = new Date(now + draft.completeByHours * 60 * 60 * 1000).toISOString();

  // Backend has no "circle" audience option surfaced in this UI yet, so
  // private dares map to "individual" (recipient-based) audience.
  const audience: 'public' | 'individual' = draft.visibility === 'public' ? 'public' : 'individual';

  const payload: Record<string, unknown> = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    respond_by,
    complete_by,
    verification_method: draft.verificationMethod,
    audience,
  };

  if (draft.recipients.length > 0) {
    payload.recipient_user_ids = draft.recipients.map((r) => r.id);
  }

  return payload;
}
