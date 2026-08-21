// Live-building summary line for the Circle flow's title strip.

import type { CircleDraft } from '@/types/createCircleFlow';
import { VIBES } from '@/lib/createPactFlow/content';

export const LIVE_SUMMARY_PLACEHOLDER = "Let's build your circle 👯";

// Human-readable label per backend category string — used only for the
// tagline suggestion below (matches the categories accepted by
// verification_method's sibling field; see toApiPayload.ts VIBE_TO_CATEGORY
// for the full closed enum this is drawn from).
const CATEGORY_LABELS: Record<string, string> = {
  fitness: 'fitness',
  startup: 'startup',
  coding: 'coding',
  study: 'study',
  habits: 'habit',
  creator: 'creator',
  social: 'social',
};

/**
 * Suggested tagline for a circle started from a goal-match CTA — editable,
 * never locked. Purely a starting point so the field doesn't sit empty when
 * we already know exactly why these people were grouped together.
 */
export function generateMatchTagline(category: string): string {
  const label = CATEGORY_LABELS[category] ?? category;
  return `Chasing ${label} goals together`;
}

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
