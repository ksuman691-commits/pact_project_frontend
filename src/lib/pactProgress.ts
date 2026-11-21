// Days done / missed / total for a pact. Used by the pact detail page, the classic pact card and the feed's fire mark.

/**
 * `proofs`, when passed, is the pact's own already-fetched proof list (each
 * item needs a `day` or `day_number` field — see the pact detail page's
 * `proofs` memo). Optional because most callers (e.g. FeedPactCard's own
 * duration-only ring — see getDurationProgress — doesn't even call this)
 * only ever have the raw pact object, not its full proof list.
 */
export function getPactProgress(pact: any, proofs?: Array<{ day?: number | null; day_number?: number | null }>) {
  const start = new Date(pact.start_date || pact.created_at)
  const end = new Date(pact.end_date || pact.deadline || Date.now())
  const today = new Date()
  // Fencepost fix: this used to be `Math.ceil(diff / 86400000) + 1`, which
  // over-counted by exactly one day for every pact — a 60-day pact's
  // end_date is 60 days after start_date, so `ceil(60) + 1 = 61` total
  // days, displayed as "0 of 61 Days" / "Day 0 of 8" (for a 7-day pact).
  // `Math.ceil` alone already gives the right day count (and handles
  // fractional/timezone drift in the stored timestamps), no "+ 1" needed.
  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  // "Elapsed" here means days that have fully PASSED, i.e. days that could
  // actually have been missed — it deliberately does NOT include today
  // (day 0 on creation, or whichever day is currently in progress), since
  // that day hasn't ended yet and can't be "missed" retroactively. A
  // brand-new pact created moments ago (today - start ~= 0ms) correctly
  // gets elapsed = 0, so it shows 0% complete with no red "missed" segment
  // until its first day is actually over.
  const elapsed = Math.min(total, Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000)))
  // proof_count is a raw COUNT(*) of proof rows, not distinct days — it
  // used to double as both because the app only allowed one proof per day.
  // Now that multiple proofs/day are allowed, proof_count over-counts
  // distinct days completed (e.g. 3 photos on day 1 alone reads as "3 of 3
  // days done, 0 missed"). Whenever the real per-day list is available,
  // count distinct days instead — genuinely accurate, no backend change
  // needed since day_number already comes back per-proof. Callers without
  // that list (the raw pact object only) prefer the backend's own
  // distinct-day count once it exists (see BACKEND_SPEC_DISTINCT_DAY_COUNT.md
  // — field name `completed_days` on PactResponse) and only fall back to
  // proof_count's raw-row approximation for pacts serialized before that
  // field ships. `completed_days` MUST be checked before `proof_count` here:
  // both will be present on the same response once the backend field
  // lands, and `??` stops at the first defined value, so checking
  // proof_count first would make completed_days permanently unreachable.
  const distinctDaysCompleted = proofs
    ? new Set(proofs.map((proof) => proof.day ?? proof.day_number).filter((day): day is number => typeof day === 'number')).size
    : null
  const completed = Math.min(
    elapsed,
    distinctDaysCompleted ?? Number(pact.completed_days ?? pact.proof_count ?? pact.proofs_count ?? (pact.status === 'completed' ? total : 0))
  )
  const missed = Math.max(0, elapsed - completed)
  return { total, completed, missed }
}
