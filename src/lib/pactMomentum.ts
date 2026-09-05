import { getPactProgress } from '@/components/PactProgressRing'

// "Real momentum right now" for the fused fire dot — deliberately narrower
// than just "this pact is active". Three ways in, all genuinely
// recent/live signals rather than lifetime totals:
//   1. A proof landed today (latest_proof_upload_date is today's date) —
//      someone just did the thing.
//   2. A clean, ongoing streak: at least one full day has elapsed, proof
//      was logged for every elapsed day (missed === 0), and it hasn't been
//      completed/archived yet. A pact that's active but has already missed
//      a day, or hasn't started accruing days yet, doesn't get the flame.
//   3. Someone cheered it recently. `active_cheer_count` (see
//      _active_cheer_count_for_pact in the backend) is already scoped to
//      cheers whose `expires_at` hasn't passed yet — cheers expire, so this
//      count is inherently a recency window, not a lifetime total. There's
//      no equivalent recency signal available for comments: the list/detail
//      pact payload has no comment timestamp and doesn't even serialize a
//      live comment_count (see the comment on liveCommentCount in
//      FeedPactCard.tsx), so comment activity can't feed this without a
//      backend addition — flagged as a gap, not silently ignored.
/**
 * Whether *any* proof landed today, per latest_proof_upload_date. Extracted
 * out of hasPactMomentum so FeedPactCard can reuse the exact same check to
 * decide whether to still offer a "+ Add today" carousel slide alongside
 * already-uploaded photos.
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

  if (Number(pact.active_cheer_count ?? 0) > 0) return true

  const { completed, missed } = getPactProgress(pact)
  return completed > 0 && missed === 0
}
