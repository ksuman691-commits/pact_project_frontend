export interface DareRecipientPick {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string | null;
}

export interface DareDraft {
  title: string;
  description: string;
  respondByHours: number;
  completeByHours: number;
  visibility: 'public' | 'private';
  recipients: DareRecipientPick[];
  verificationMethod: 'photo' | 'video' | 'checklist';
  /**
   * Set when the flow was launched from a specific user's "Dare [Name]"
   * CTA (e.g. a shared-circle profile) — the recipient is already known,
   * so the visibility and recipient-picker questions must be skipped
   * entirely and that person shown as an already-attached recipient
   * instead of asking again. Mirrors PactDraft.audiencePreset.
   */
  recipientPreset?: boolean;
}

export function createEmptyDareDraft(): DareDraft {
  return {
    title: '',
    description: '',
    respondByHours: 12,
    completeByHours: 24,
    visibility: 'public',
    recipients: [],
    verificationMethod: 'photo',
  };
}

export type DareFlowStep =
  | 'title'
  | 'description'
  | 'timing'
  | 'visibility'
  | 'recipients'
  | 'verification'
  | 'review'
  | 'success';

export interface CreatedDare {
  id: number;
  title: string;
}
