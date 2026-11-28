/**
 * Did an ended pact count as finished? Completed, or at least 75% of its days posted,
 * rest days included. On a pact you're in (made or joined) it's your own days that count
 * (my_days_completed / my_rest_days from the server); otherwise the creator's.
 */
export function isFinishedPact(pact: any): boolean {
  if (pact?.status === 'completed' || pact?.outcome === 'completed') return true
  const days = Math.max(1, Number(pact?.duration_days ?? 0))
  const mine = pact?.my_days_completed != null
  const posted = Number((mine ? pact.my_days_completed : pact?.days_completed) ?? 0)
  const restList = mine ? pact?.my_rest_days : pact?.rest_days
  const rest = Array.isArray(restList) ? restList.length : 0
  return posted + rest >= Math.ceil(0.75 * days)
}
