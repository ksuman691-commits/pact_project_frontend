// Live-building summary line for the Circle flow's title strip.

import type { CircleDraft } from '@/types/createCircleFlow';
import { VIBES } from '@/lib/createPactFlow/content';

export const LIVE_SUMMARY_PLACEHOLDER = "Let's build your circle 👯";

export function generateCircleSummary(draft: CircleDraft): string {
  const vibe = draft.vibeId ? VIBES.find((v) => v.id === draft.vibeId) : null;
  const parts: string[] = [];
  if (vibe) parts.push(`${draft.emoji || vibe.emoji} ${vibe.label}`);
  if (draft.name.trim()) parts.push(draft.name.trim());
  if (draft.privacy === 'open') parts.push('Open');
  else if (draft.privacy === 'approval') parts.push('Approval required');
  else if (draft.privacy === 'invite_only') parts.push('Invite only');
  return parts.join(' · ');
}
