/** Did an ended pact count as finished? Same rule as the pact card: completed, or at least 75% of its days posted. */
export function isFinishedPact(pact: any): boolean {
  if (pact?.status === 'completed') return true
  const days = Math.max(1, Number(pact?.duration_days ?? 0))
  return Number(pact?.days_completed ?? 0) >= Math.ceil(0.75 * days)
}
