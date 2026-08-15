import type { DareDraft } from '@/types/createDareFlow';

export const DARE_LIVE_TITLE_PLACEHOLDER = "Dare someone to do something…";

/** Builds the live-updating summary shown in the title strip as the user taps through. */
export function generateDareSummary(draft: DareDraft): string {
  if (!draft.title.trim()) return '';

  let summary = `"${draft.title.trim()}"`;

  if (draft.visibility === 'private' && draft.recipients.length > 0) {
    const names = draft.recipients.map((r) => `@${r.username}`).join(', ');
    summary += ` — dared to ${names}`;
  } else if (draft.visibility === 'public') {
    summary += ' — open for anyone to claim';
  }

  summary += `. Respond within ${draft.respondByHours}h, complete within ${draft.completeByHours}h.`;

  return summary;
}
