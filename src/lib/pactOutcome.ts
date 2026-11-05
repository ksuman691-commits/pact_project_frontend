/** Did an ended pact count as finished? Completed, or at least 75% of its days posted, rest days included. */
export function isFinishedPact(pact: any): boolean {
  if (pact?.status === 'completed') return true
  const days = Math.max(1, Number(pact?.duration_days ?? 0))
  const rest = Array.isArray(pact?.rest_days) ? pact.rest_days.length : 0
  return Number(pact?.days_completed ?? 0) + rest >= Math.ceil(0.75 * days)
}
