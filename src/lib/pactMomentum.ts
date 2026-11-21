import { getPactProgress } from '@/lib/pactProgress'

// "Momentum right now" for the feed's flame: a proof landed today, or a clean
// streak (at least one full day, none missed) on an active pact.
/**
 * Whether *any* proof landed today, per latest_proof_upload_date. Feeds the
 * "momentum" flame signal below — a proof today counts as live activity
 * regardless of how many others also landed today (multiple proofs per day
 * are allowed; this has never been a "has today's one proof been used up"
 * check, only "did something happen today").
 */
export function wasProofSubmittedToday(pact: any): boolean {
  const latestProofDate = pact.latest_proof_upload_date ?? pact.latestProofUploadDate
  if (!latestProofDate) return false

  const proofDay = new Date(latestProofDate)
  const today = new Date()
  return (
    proofDay.getFullYear() === today.getFullYear() &&
    proofDay.getMonth() === today.getMonth() &&
    proofDay.getDate() === today.getDate()
  )
}

export function hasPactMomentum(pact: any): boolean {
  if (!pact || pact.status !== 'active') return false

  if (wasProofSubmittedToday(pact)) return true

  const { completed, missed } = getPactProgress(pact)
  return completed > 0 && missed === 0
}
