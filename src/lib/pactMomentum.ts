import { getPactProgress } from '@/components/PactProgressRing'

// "Real momentum right now" for the animated fire ring — deliberately
// narrower than just "this pact is active". Two ways in:
//   1. A proof landed today (latest_proof_upload_date is today's date) —
//      someone just did the thing.
//   2. A clean, ongoing streak: at least one full day has elapsed, proof
//      was logged for every elapsed day (missed === 0), and it hasn't been
//      completed/archived yet. A pact that's active but has already missed
//      a day, or hasn't started accruing days yet, doesn't get the flame.
export function hasPactMomentum(pact: any): boolean {
  if (!pact || pact.status !== 'active') return false

  const latestProofDate = pact.latest_proof_upload_date ?? pact.latestProofUploadDate
  if (latestProofDate) {
    const proofDay = new Date(latestProofDate)
    const today = new Date()
    if (
      proofDay.getFullYear() === today.getFullYear() &&
      proofDay.getMonth() === today.getMonth() &&
      proofDay.getDate() === today.getDate()
    ) {
      return true
    }
  }

  const { completed, missed } = getPactProgress(pact)
  return completed > 0 && missed === 0
}
