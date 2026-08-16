export interface User {
  id?: number;
  user_uuid: string; // UUID for public API
  username: string;
  email: string;
  full_name: string;
  reputation_score: number;
  is_active?: boolean;
  created_at?: string;
  avatar_url?: string;
  bio?: string;
}

export interface Circle {
  id: number;
  circle_uuid?: string; // UUID for public API
  name: string;
  description?: string;
  owner_id: number;
  owner_username?: string;
  owner_avatar_url?: string;
  is_public?: boolean;
  visibility?: 'public' | 'private';
  member_count?: number;
  created_at: string;
  updated_at?: string;
  members?: User[];
}

export interface Pact {
  id: number;
  pact_uuid?: string; // UUID for public API
  creator_id: number;
  circle_id?: number;
  title: string;
  description: string;
  deadline?: string;
  end_date?: string;
  start_date?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  verification_type?: string;
  verification_method?: string;
  proof_url?: string;
  required_approvers?: number;
  is_public?: boolean; // NEW: Public or Private pact
  visibility?: 'public' | 'private' | 'circle_only';
  created_at: string;
  updated_at?: string;
  creator?: User | any;
  creator_username?: string;
  creator_full_name?: string;
  creator_avatar_url?: string;
  circle_name?: string;
  circle_icon_emoji?: string;
}

export interface PactParticipant {
  id: number;
  user_id: number;
  pact_id: number;
  circle_id: number;
  role: 'creator' | 'participant' | 'verifier';
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  joined_at: string;
  user?: User;
}

export interface PactJoinRequest {
  id: number;
  request_uuid: string;
  pact_id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  request_message?: string;
  requested_at: string;
  responded_at?: string;
  response_message?: string;
  user?: User;
  pact?: Pact;
}

export interface Verification {
  id: number;
  pact_id: number;
  verifier_id: number;
  q1_answer: string;
  q2_answer: string;
  q3_answer: string;
  q4_answer: string;
  confidence_score: number;
  created_at: string;
}

export interface Short {
  id: number;
  pact_id: number;
  video_url: string;
  view_count: number;
  support_count: number;
  challenge_count: number;
  confidence_score: number;
  created_at: string;
  pact?: Pact;
}

// The live API (GET /api/dares/{id}/recipients) returns username/avatar_url
// as flat fields on the recipient record, not a nested `user` object — this
// mirrors that actual response shape instead of a guessed/nested one.
export interface DareRecipient {
  id: number;
  user_id: number;
  username: string;
  avatar_url?: string | null;
  full_name?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'failed';
  responded_at?: string;
  completed_at?: string;
}

export interface DareProof {
  id: number;
  dare_id: number;
  user_id: number;
  proof_type: 'photo' | 'video' | 'checklist';
  proof_url?: string;
  caption?: string;
  uploaded_at: string;
  user?: User;
}

export interface DareVerification {
  id: number;
  dare_id: number;
  verifier_id: number;
  q1_answer: 'yes' | 'no';
  q2_answer: 'yes' | 'no';
  q3_answer: 'yes' | 'no';
  q4_answer: 'yes' | 'no';
  q1_reason?: string;
  q2_reason?: string;
  q3_reason?: string;
  q4_reason?: string;
  confidence_score: number;
  created_at: string;
  verifier?: User;
}

export interface Dare {
  id: number;
  dare_uuid?: string;
  creator_id: number;
  title: string;
  description: string;
  deadline?: string;
  // Real backend field names (confirmed against the live API — the
  // earlier `respond_by_date`/`complete_by_date` names never existed on
  // any dare response and were the root cause of the "Invalid Date" bug).
  respond_by: string;
  complete_by: string;
  // Server-provided absolute expiry used by the card countdown when present.
  expires_at?: string;
  recipients?: DareRecipient[];
  // Only 'pending' has been observed live; kept loose since the backend
  // doesn't document a closed enum here.
  status: string;
  // Real backend field is "audience", not "visibility" — the old
  // `dare.visibility === 'public'` check on the detail page never matched
  // anything, so the Claim flow was unreachable for public dares.
  audience: 'public' | 'individual' | string;
  circle_id?: number;
  verification_method?: string;
  verification_questions?: string[];
  proof_url?: string;
  proof_type?: string;
  created_at: string;
  updated_at?: string;
  creator?: User;
  creator_username?: string;
  creator_full_name?: string;
  creator_avatar_url?: string;
  circle_name?: string;
  // Real field from the backend — total recipients on the dare.
  recipient_count?: number;
  // Real field: the viewer's own recipient status on this dare, or null if
  // the viewer isn't a recipient (e.g. they're the creator, or it's a
  // public dare they haven't claimed). Drives Accept/Decline/Upload Proof
  // affordances — see mapDare's derived isPendingForMe/isAcceptedByMe/etc.
  my_recipient_status?: 'pending' | 'accepted' | 'declined' | 'completed' | 'failed' | null;
  // Derived client-side in mapDare from my_recipient_status, since the
  // backend has no is_accepted_by_me/is_completed_by_me fields.
  recipientCount?: number;
  isAcceptedByMe?: boolean;
  isCompletedByMe?: boolean;
  isPendingForMe?: boolean;
  isDeclinedByMe?: boolean;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user?: User;
}
