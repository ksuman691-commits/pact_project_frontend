import type { DareDraft } from '@/types/createDareFlow';

export const DARE_LIVE_TITLE_PLACEHOLDER = "Dare someone to do something…";

/** Builds the live-updating summary shown in the title strip as the user taps through. */
export function generateDareSummary(draft: DareDraft): string {
  if (!draft.title.trim()) return '';

  let summary = `"${draft.title.trim()}"`;

  if (draft.recipients.length > 0) summary += ` for @${draft.recipients[0].username}`;
  if (draft.rewardAmount) summary += ` · ₹${draft.rewardAmount} reward`;
  summary += `. ${draft.respondByHours}h to accept, then ${draft.completeByHours}h to do it.`;

  return summary;
}
