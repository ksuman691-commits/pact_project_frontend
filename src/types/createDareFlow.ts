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
