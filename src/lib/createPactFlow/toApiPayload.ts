// Bridges the spec's vocabulary (vibe/activity/target/proofMethod/audience)
// onto the existing, unchanged backend pact fields. No backend changes needed.

import type { Activity, PactDraft, VibeId } from '@/types/createPactFlow';
import { generateDescription, generateTitle, resolveDurationDays } from './generate';

// Nearest existing category id per vibe (categories are backend-agnostic
// strings: fitness/coding/study/startup/habits/creator/social).
const VIBE_TO_CATEGORY: Record<VibeId, string> = {
  glowup: 'fitness',
  money: 'startup',
  dare: 'habits',
  adventure: 'social',
  love: 'social',
  social: 'social',
  create: 'creator',
  build: 'startup',
  levelup: 'study',
  wellbeing: 'fitness',
};

// Backend verification_method only supports these three; "Activity data" has
// no dedicated backend proof type yet, so it maps to the closest analogue
// (a self-reported check-in) — see plan notes for the bridging rationale.
function mapProofMethod(proofMethod: PactDraft['proofMethod']): 'photo' | 'video' | 'checklist' {
  switch (proofMethod) {
    case 'Photo':
      return 'photo';
    case 'Video':
      return 'video';
    case 'Check-in':
    case 'Activity data':
    default:
      return 'checklist';
  }
}

// Backend proof_submission_frequency only supports 'daily' | 'weekly'.
function mapProofFrequency(proofFrequency: PactDraft['proofFrequency']): 'daily' | 'weekly' {
  if (proofFrequency === 'Every day') return 'daily';
  return 'weekly'; // "Every 2 days" and "Every week" both round to weekly
}

function mapVisibility(visibility: PactDraft['visibility']): 'public' | 'private' | 'circle_only' {
  if (visibility === 'My Circle') return 'circle_only';
  if (visibility === 'Only me') return 'private';
  return 'public';
}

function computeMaxProofUploads(durationDays: number, frequency: 'daily' | 'weekly', isMilestone: boolean): number {
  if (isMilestone) return 1;
  if (frequency === 'daily') return Math.max(1, durationDays);
  return Math.max(1, Math.ceil(durationDays / 7));
}

function computeParticipantRange(audience: PactDraft['audience']): { min: number; max: number } {
  if (audience === 'Just me') return { min: 1, max: 1 };
  if (audience === 'Everyone') return { min: 1, max: 50 };
  return { min: 1, max: 10 }; // My Circle
}

export interface CreatePactApiPayload {
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  deadline: string;
  verification_method: 'photo' | 'video' | 'checklist';
  proof_submission_frequency: 'daily' | 'weekly';
  max_proof_uploads: number;
  min_participants: number;
  max_participants: number;
  visibility: 'public' | 'private' | 'circle_only';
  circle_id: number | null;
}

export function toCreatePactApiPayload(draft: PactDraft, activity: Activity): CreatePactApiPayload {
  const durationDays = resolveDurationDays(draft);
  const startDate = draft.startDate ? new Date(draft.startDate) : new Date();
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const proofFrequency = mapProofFrequency(draft.proofFrequency);
  const { min, max } = computeParticipantRange(draft.audience);
  const visibility = mapVisibility(draft.visibility);

  return {
    title: generateTitle(draft, activity),
    description: generateDescription(draft),
    category: draft.vibeId ? VIBE_TO_CATEGORY[draft.vibeId] : 'habits',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    deadline: endDate.toISOString(),
    verification_method: mapProofMethod(draft.proofMethod),
    proof_submission_frequency: proofFrequency,
    max_proof_uploads: computeMaxProofUploads(durationDays, proofFrequency, Boolean(activity.milestone)),
    min_participants: min,
    max_participants: max,
    visibility,
    circle_id: visibility === 'circle_only' ? draft.circleId ?? null : null,
  };
}
