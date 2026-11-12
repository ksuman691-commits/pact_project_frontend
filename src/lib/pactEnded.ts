/**
 * How long ago a pact ended, counted in calendar days from the day you look at
 * it. A pact ends at midnight after its last day (end_date), so a pact whose
 * last day was yesterday "ended today". Returns null while it hasn't ended by
 * date (for example, one stopped early): then the screen just says "Ended".
 */
export function daysSinceEnded(endDate?: string | null, now = new Date()): number | null {
  if (!endDate) return null
  const [y, m, d] = endDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const endedOn = new Date(y, m - 1, d + 1) // local midnight after the last day
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

/** Short form for a chip: "Ended today", "Ended 3d ago". */
export function endedShort(endDate?: string | null, now = new Date()): string {
  const days = daysSinceEnded(endDate, now)
  if (days == null) return 'Ended'
  if (days === 0) return 'Ended today'
  if (days === 1) return 'Ended yesterday'
  return `Ended ${days}d ago`
}
