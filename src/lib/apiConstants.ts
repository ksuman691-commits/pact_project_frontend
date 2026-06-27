/**
 * API Constants and Error Messages
 */

export const API_ERRORS = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Your session has expired. Please login again.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User with this email already exists',
  },
  PACT: {
    NOT_FOUND: 'Pact not found',
    INSUFFICIENT_BALANCE: 'Insufficient wallet balance for staking',
    INVALID_STATUS: 'Invalid pact status',
    ALREADY_JOINED: 'You have already joined this pact',
    NOT_CREATOR: 'Only the pact creator can perform this action',
    CANNOT_JOIN_OWN_PACT: 'You cannot join your own pact',
  },
  CIRCLE: {
    NOT_FOUND: 'Circle not found',
    ALREADY_MEMBER: 'You are already a member of this circle',
    NOT_MEMBER: 'You are not a member of this circle',
    INVALID_ROLE: 'Invalid circle role',
    MIN_MEMBERS_REQUIRED: 'Circle requires at least 2 members',
  },
  WALLET: {
    INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
    INVALID_AMOUNT: 'Invalid amount',
    WITHDRAWAL_FAILED: 'Withdrawal failed',
    DEPOSIT_FAILED: 'Deposit failed',
    FUNDS_LOCKED: 'Some funds are locked in active pacts',
  },
  VERIFICATION: {
    NOT_FOUND: 'Verification not found',
    ALREADY_VERIFIED: 'You have already verified this pact',
    INVALID_ANSWERS: 'Invalid verification answers',
  },
  NETWORK: {
    TIMEOUT: 'Request timeout. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
  },
};

export const PACT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export const USER_ROLES = {
  CREATOR: 'creator',
  PARTICIPANT: 'participant',
  VERIFIER: 'verifier',
} as const;

export const VERIFICATION_CONFIDENCE = {
  LOW: 0.25,
  MEDIUM: 0.5,
  HIGH: 0.75,
  VERY_HIGH: 1.0,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

export const CACHE_TIMES = {
  INSTANT: 0,
  SHORT: 1000 * 60, // 1 minute
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 30, // 30 minutes
  VERY_LONG: 1000 * 60 * 60, // 1 hour
} as const;

export const VERIFICATION_QUESTIONS = [
  'Did you complete the pact task today?',
  'What evidence can you show?',
  'How confident are you about this?',
  'Any challenges faced?',
] as const;

export const NOTIFICATION_TYPES = {
  PACT_CREATED: 'pact_created',
  PACT_JOINED: 'pact_joined',
  PACT_VERIFIED: 'pact_verified',
  PACT_COMPLETED: 'pact_completed',
  PACT_FAILED: 'pact_failed',
  VERIFICATION_REQUEST: 'verification_request',
  CIRCLE_INVITE: 'circle_invite',
  CIRCLE_JOINED: 'circle_joined',
  COMMENT: 'comment',
  LIKE: 'like',
  FOLLOW: 'follow',
  WALLET_UPDATED: 'wallet_updated',
  WITHDRAWAL_PENDING: 'withdrawal_pending',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
} as const;

export const SOCIAL_PLATFORMS = {
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
} as const;

export const WITHDRAWAL_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  CRYPTO: 'crypto',
} as const;
