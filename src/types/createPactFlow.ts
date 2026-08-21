// Data model for the "Create a Pact" tap-flow.
// Matches circlepact_create_pact_spec.md §2 exactly.

export type VibeId =
  | 'glowup'
  | 'money'
  | 'dare'
  | 'adventure'
  | 'love'
  | 'social'
  | 'create'
  | 'build'
  | 'levelup'
  | 'wellbeing';

export interface Vibe {
  id: VibeId;
  emoji: string;
  label: string;
  tagline: string;
}

export interface Activity {
  emoji: string;
  label: string;
  unit?: string; // omitted when milestone === true
  defaultTarget?: number;
  quickTargets?: number[]; // exactly 4 preset chip values
  milestone?: boolean; // true = no numeric target, single pass/fail goal
  custom?: boolean; // true = "Something else" — user types the label
}

export type ProofMethod = 'Photo' | 'Video' | 'Check-in' | 'Activity data';
export type ProofFrequency = 'Every day' | 'Every 2 days' | 'Every week' | 'At the end of the Pact';
export type AudienceLabel = 'Just me' | 'My Circle' | 'Everyone';
export type VisibilityLabel = 'Only me' | 'My Circle' | 'Everyone';

export interface PactDraft {
  vibeId: VibeId | null;
  // true when vibeId was seeded from context (e.g. a goal-match's category)
  // rather than picked by the user — skips the Vibe step entirely, same
  // pattern as audiencePreset below.
  vibePreset?: boolean;
  activityIndex: number | null;
  customActivityLabel?: string; // only if activity.custom
  target: number | null; // null when milestone
  durationDays: number | null; // null if customEndDate set instead
  customEndDate?: string; // ISO date, alternative to durationDays
  proofMethod: ProofMethod | null;
  proofFrequency: ProofFrequency | null; // null for Activity data
  audience: AudienceLabel | null;
  visibility: VisibilityLabel; // auto-derived, editable only in Customize
  circleId?: number | null; // bridging field: which circle when audience === 'My Circle'
  audiencePreset?: boolean; // true when arriving from a Circle's "Start a Pact" CTA — skips the audience step
  taggedParticipantId?: number | null; // set when arriving from a specific user's "Create a Pact with [Name]" CTA — shown as an already-attached participant, never re-prompted for
  descriptionOverride?: string; // set only if user edits generated description
  remindersEnabled: boolean; // default true
  startDate?: string; // ISO, editable only in Customize
}

export interface CreatedPact {
  id: string;
  title: string; // generated, stored (not recomputed at render time)
  description: string;
  startDate: string; // ISO, defaults to creation time
  endDate: string; // ISO, computed from durationDays or customEndDate
  vibeId: VibeId;
  activityLabel: string;
  target: number | null;
  unit: string | null;
  proofMethod: string;
  proofFrequency: string | null;
  audience: string;
  visibility: string;
  circleId?: number | null; // set when the pact was created within a specific circle's audience
  createdBy: string; // user id
  createdAt: string;
}

export type FlowStep =
  | 'vibe'
  | 'activity'
  | 'target'
  | 'duration'
  | 'proof'
  | 'audience'
  | 'review'
  | 'success';

export function createEmptyDraft(): PactDraft {
  return {
    vibeId: null,
    activityIndex: null,
    target: null,
    durationDays: null,
    proofMethod: null,
    proofFrequency: null,
    audience: null,
    visibility: 'Only me',
    taggedParticipantId: null,
    remindersEnabled: true,
  };
}
