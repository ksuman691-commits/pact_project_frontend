// Data model for the "Create a Circle" tap-flow.
// Mirrors src/types/createPactFlow.ts so Pact/Circle/Dare share one vocabulary.

import type { VibeId } from './createPactFlow';

// Backend Circle.visibility is currently a binary 'public' | 'private'
// (see src/services/api.ts circleService.create / src/types/index.ts).
// The product spec calls for a 3-state privacy model (open / approval
// required / invite only). Until the backend grows a real third state,
// "Approval required" and "Invite only" both map to visibility: 'private'
// — the only functional difference today is whether the circle is
// listed for public join-requests, which the join-request endpoints
// (circleJoinRequestService) already support for private circles.
// See lib/createCircleFlow/toApiPayload.ts for the exact mapping and a
// flagged TODO for the backend change this would need to be fully honest.
export type PrivacyLevel = 'open' | 'approval' | 'invite_only';

export interface PrivacyOption {
  id: PrivacyLevel;
  emoji: string;
  label: string;
  desc: string;
}

export interface CircleDraft {
  vibeId: VibeId | null;
  emoji: string;
  name: string;
  tagline: string;
  privacy: PrivacyLevel | null;
  inviteUserIds: number[];
}

export interface CreatedCircle {
  id: number;
  name: string;
  emoji: string;
  tagline: string;
  vibeId: VibeId | null;
  privacy: PrivacyLevel;
  memberCount: number;
}

export type CircleFlowStep = 'vibe' | 'identity' | 'privacy' | 'invite' | 'review' | 'success';

export function createEmptyCircleDraft(): CircleDraft {
  return {
    vibeId: null,
    emoji: '🚀',
    name: '',
    tagline: '',
    privacy: null,
    inviteUserIds: [],
  };
}
