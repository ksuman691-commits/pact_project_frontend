// Bridges the Circle flow's 3-state privacy vocabulary onto the existing,
// unchanged backend Circle fields. No backend schema change made here.

import type { CircleDraft } from '@/types/createCircleFlow';
import { CIRCLE_VIBE_TAGLINES } from './content';

export interface CreateCircleApiPayload {
  name: string;
  description: string;
  visibility: 'public' | 'private';
  icon_emoji: string;
}

// FLAGGED LIMITATION (see types/createCircleFlow.ts for detail): the
// backend Circle model only has a binary visibility field. "Approval
// required" and "Invite only" are functionally identical to the backend
// today — both become 'private' — because there is no field to tell them
// apart. A true 3-state model needs a backend column (e.g.
// `join_policy: 'open' | 'approval' | 'invite_only'`) before this can be
// fully honest; until then, both non-open choices behave like a private
// circle that currently supports join-requests via circleJoinRequestService.
export function mapPrivacyToVisibility(privacy: CircleDraft['privacy']): 'public' | 'private' {
  return privacy === 'open' ? 'public' : 'private';
}

export function toCreateCircleApiPayload(draft: CircleDraft): CreateCircleApiPayload {
  const description = draft.tagline.trim() || (draft.vibeId ? CIRCLE_VIBE_TAGLINES[draft.vibeId] : '');
  return {
    name: draft.name.trim(),
    description,
    visibility: mapPrivacyToVisibility(draft.privacy),
    icon_emoji: draft.emoji,
  };
}
