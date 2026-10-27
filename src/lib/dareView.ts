import type { Dare, DarePerson, DareState } from '@/types'
import { isDareExpired, parseApiDate } from '@/lib/dareCountdown'

/**
 * One place that turns a dare + who's looking into what the screens show:
 * the status words, the deadline that matters, and the single next step.
 * The server sends `state`; the fallback below only covers older responses.
 */

export type DareRole = 'creator' | 'doer' | 'viewer'

export function dareRole(dare: Dare, viewerId?: number | null): DareRole {
  if (viewerId == null) return 'viewer'
  if (dare.creator_id === viewerId) return 'creator'
  if (dare.recipient?.user_id === viewerId || dare.my_recipient_status) return 'doer'
  return 'viewer'
}

export function dareState(dare: Dare): DareState {
  if (dare.state) return dare.state
  const mine = dare.my_recipient_status || dare.status
  if (dare.status === 'cancelled') return 'cancelled'
  if (mine === 'completed') return 'completed'
  if (mine === 'failed') return 'not_completed'
  if (mine === 'declined') return 'declined'
  if (isDareExpired(dare)) return 'expired'
  if (mine === 'accepted') return dare.proof_url ? 'awaiting_review' : 'in_progress'
  return 'awaiting_response'
}

export const STATE_LABEL: Record<DareState, string> = {
  awaiting_response: 'Awaiting response',
  in_progress: 'In progress',
  awaiting_review: 'Proof submitted',
  completed: 'Completed',
  not_completed: 'Not completed',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
  open: 'Open to claim',
}

/** A reward was promised for a finished dare and hasn't been confirmed as received. */
export function rewardOwed(dare: Dare): boolean {
  return dareState(dare) === 'completed' && Boolean(dare.reward_amount) && dare.reward?.status !== 'received'
}

export type DareNext =
  | 'respond' // person dared: accept or decline
  | 'post_proof' // person dared: on the clock
  | 'review' // creator: proof is in
  | 'pay' // creator: done, reward to send
  | 'add_upi' // person dared: done, needs a UPI ID to be paid
  | 'confirm_reward' // person dared: creator says they paid
  | 'claim' // an older public dare
  | null

export function nextStep(dare: Dare, role: DareRole): DareNext {
  const state = dareState(dare)
  if (state === 'open') return role === 'viewer' ? 'claim' : null
  if (role === 'doer') {
    if (state === 'awaiting_response') return 'respond'
    if (state === 'in_progress') return 'post_proof'
    if (rewardOwed(dare)) {
      if (dare.reward?.status === 'sent') return 'confirm_reward'
      if (dare.payee_upi_ready === false) return 'add_upi'
    }
    return null
  }
  if (role === 'creator') {
    if (state === 'awaiting_review') return 'review'
    if (rewardOwed(dare) && dare.payee_upi_ready && dare.reward?.status !== 'sent') return 'pay'
  }
  return null
}

/** Still going: on a clock, waiting on someone, or money still to settle. */
export function isActive(dare: Dare): boolean {
  const state = dareState(dare)
  return state === 'awaiting_response' || state === 'in_progress' || state === 'awaiting_review' || state === 'open' || rewardOwed(dare)
}

/** The deadline that matters right now, if any. */
export function activeDeadline(dare: Dare): { target: string; verb: 'respond' | 'complete' } | null {
  const state = dareState(dare)
  if (state === 'awaiting_response' || state === 'open') return { target: dare.respond_by, verb: 'respond' }
  if (state === 'in_progress') return { target: dare.complete_by, verb: 'complete' }
  return null
}

export interface DareFace {
  name: string
  username?: string | null
  avatarUrl?: string | null
}

const display = (person: { full_name?: string | null; username?: string | null } | null | undefined, fallback: string) =>
  person?.full_name || (person?.username ? `@${person.username}` : '') || fallback

export function creatorFace(dare: Dare): DareFace {
  return {
    name: display({ full_name: dare.creator_full_name, username: dare.creator_username }, 'Someone'),
    username: dare.creator_username,
    avatarUrl: dare.creator_avatar_url,
  }
}

export function recipientFace(dare: Dare): DareFace | null {
  const person: DarePerson | null | undefined = dare.recipient
  if (!person) return null
  return { name: display(person, 'Someone'), username: person.username, avatarUrl: person.avatar_url }
}

export const firstName = (name: string) => name.replace(/^@/, '').trim().split(/\s+/)[0] || name

/** "2h 14m", "45m", "1d 3h": precise enough to act on, short enough for a pill. */
export function timeLeft(target: string | null | undefined, now = Date.now()): string | null {
  if (!target) return null
  const hasZone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(target)
  const at = new Date(hasZone ? target : `${target}Z`).getTime()
  if (Number.isNaN(at)) return null
  const ms = at - now
  if (ms <= 0) return null
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

const HOUR = 3_600_000

/**
 * How much of the running clock is left, 0 to 1, for the ring on a dare card.
 * Waiting to be answered: from sent to the answer-by time. On the clock: from
 * the moment it was accepted to the finish-by time. Null when no clock runs.
 */
export function clockLeft(dare: Dare, now = Date.now()): number | null {
  const deadline = activeDeadline(dare)
  if (!deadline) return null
  const end = parseDate(deadline.target)
  if (end == null) return null
  const startRaw = deadline.verb === 'respond' ? dare.created_at : dare.accepted_at
  let start = parseDate(startRaw)
  if (start == null) {
    // Older response without accepted_at: the finish window is 24h or 48h.
    if (deadline.verb === 'complete') start = end - (end - now > 24 * HOUR ? 48 : 24) * HOUR
    else return null
  }
  const total = end - start
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, (end - now) / total))
}

function parseDate(raw?: string | null): number | null {
  const at = parseApiDate(raw)
  return at ? at.getTime() : null
}

/** "11h", "42m", "<1m": the short form that fits in the middle of the ring. */
export function compactLeft(target: string | null | undefined, now = Date.now()): string | null {
  const end = parseDate(target)
  if (end == null) return null
  const ms = end - now
  if (ms <= 0) return '0m'
  const hours = Math.floor(ms / HOUR)
  if (hours >= 48) return `${Math.floor(hours / 24)}d`
  if (hours >= 1) return `${hours}h`
  const minutes = Math.floor(ms / 60_000)
  return minutes < 1 ? '<1m' : `${minutes}m`
}
