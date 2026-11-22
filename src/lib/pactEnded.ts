/**
 * How long ago a pact ended, counted in calendar days from the day you look at
 * it. The server stores end_date as start_date + duration_days: the day AFTER
 * the last day, i.e. the day the pact ended. So a pact whose last day was
 * yesterday has end_date today and "ended today". Returns null while it hasn't
 * ended by date (for example, one stopped early): then the screen just says "Ended".
 */
export function daysSinceEnded(endDate?: string | null, now = new Date()): number | null {
  if (!endDate) return null
  const [y, m, d] = endDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const endedOn = new Date(y, m - 1, d) // local midnight after the last day
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - endedOn.getTime()) / 86_400_000)
  return days < 0 ? null : days
}

/** "Ended today", "Ended yesterday", "Ended 3 days ago", or plain "Ended". */
export function endedLabel(endDate?: string | null, now = new Date()): string {
  const days = daysSinceEnded(endDate, now)
  if (days == null) return 'Ended'
  if (days === 0) return 'Ended today'
  if (days === 1) return 'Ended yesterday'
  return `Ended ${days} days ago`
}

/** "22 Nov": the day the pact ended (end_date), for showing next to the label. */
export function endedOnDate(endDate?: string | null): string | null {
  if (!endDate) return null
  const [y, m, d] = endDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Short form for a chip: "Ended today", "Ended 3d ago". */
export function endedShort(endDate?: string | null, now = new Date()): string {
  const days = daysSinceEnded(endDate, now)
  if (days == null) return 'Ended'
  if (days === 0) return 'Ended today'
  if (days === 1) return 'Ended yesterday'
  return `Ended ${days}d ago`
}
