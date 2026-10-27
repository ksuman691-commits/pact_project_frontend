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
  /** Dares are one-to-one: this holds exactly one person once picked. */
  recipients: DareRecipientPick[];
  verificationMethod: 'photo' | 'video';
  /** Optional reward in rupees (1 to 500), paid by you over UPI after you mark it done. */
  rewardAmount: number | null;
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
    recipients: [],
    verificationMethod: 'photo',
    rewardAmount: null,
  };
}

export type DareFlowStep =
  | 'title'
  | 'description'
  | 'timing'
  | 'recipients'
  | 'reward'
  | 'verification'
  | 'review'
  | 'success';

export interface CreatedDare {
  id: number;
  title: string;
}
