export interface User {
  id: number;
  user_uuid: string; // UUID for public API
  username: string;
  email: string;
  full_name: string;
  reputation_score: number;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
  bio?: string;
}

export interface Circle {
  id: number;
  circle_uuid: string; // UUID for public API
  name: string;
  description?: string;
  owner_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  members?: User[];
}

export interface Pact {
  id: number;
  pact_uuid: string; // UUID for public API
  creator_id: number;
  circle_id: number;
  title: string;
  description: string;
  stake_amount: number;
  deadline: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  verification_type: string;
  proof_url?: string;
  required_approvers: number;
  is_public: boolean; // NEW: Public or Private pact
  created_at: string;
  updated_at: string;
  creator?: User;
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

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  escrow_locked: number;
  rewards_earned: number;
  total_transactions: number;
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

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}
