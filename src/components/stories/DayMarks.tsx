export type DayMark = 'posted' | 'missed' | 'upcoming'

const DAY_MS = 86400000

export interface DayMarksSummary {
  marks: DayMark[]
  total: number
  dayNumber: number
  done: number
  missed: number
}

function spanOf(pact: any) {
  const start = new Date(pact.start_date || pact.created_at)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(pact.end_date || pact.deadline || '')
  if (Number.isNaN(end.getTime())) return null
  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_MS))
  // Days fully passed; today is still open so it can't be missed yet.
  const elapsed = Math.min(total, Math.max(0, Math.floor((Date.now() - start.getTime()) / DAY_MS)))
  return { total, elapsed }
}

/**
 * Per-day marks from the proof list's real day numbers. Returns null when
 * the pact's dates or the per-day data are missing, so callers omit the row
 * instead of drawing guessed dots.
 */
export function marksFromProofDays(pact: any, proofs: Array<{ day?: number | null }>): DayMarksSummary | null {
  const span = spanOf(pact)
  if (!span) return null
  const days = new Set(proofs.map((p) => p.day).filter((d): d is number => typeof d === 'number'))
  if (proofs.length > 0 && days.size === 0) return null
  const { total, elapsed } = span
  const marks: DayMark[] = []
  let done = 0
  let missed = 0
  for (let day = 1; day <= total; day++) {
    if (days.has(day)) {
      marks.push('posted')
      done++
    } else if (day <= elapsed) {
      marks.push('missed')
      missed++
    } else {
      marks.push('upcoming')
    }
  }
  return { marks, total, dayNumber: Math.min(total, elapsed + 1), done, missed }
}

/**
 * List-row version: the pacts list only carries a count of completed days,
 * not which ones, so done days are drawn first. Null when no count exists.
 */
export function marksFromCount(pact: any): DayMarksSummary | null {
  const span = spanOf(pact)
  if (!span) return null
  const raw = pact.completed_days ?? pact.proof_count ?? pact.proofs_count
  const { total, elapsed } = span
  const dayNumber = Math.min(total, elapsed + 1)
  if (raw == null || Number.isNaN(Number(raw))) {
    return { marks: [], total, dayNumber, done: -1, missed: -1 }
  }
  const done = Math.min(Math.max(0, Number(raw)), Math.min(total, elapsed + 1))
  const missed = Math.max(0, elapsed - Math.min(done, elapsed))
  const marks: DayMark[] = Array.from({ length: total }, (_, i) => (i < done ? 'posted' : i < done + missed ? 'missed' : 'upcoming'))
  return { marks, total, dayNumber, done, missed }
}

export function dayLine(summary: DayMarksSummary) {
  const head = `Day ${summary.dayNumber} of ${summary.total}.`
  if (summary.done < 0) return head
  if (summary.missed === 0) return `${head} You haven't missed any.`
  return `${head} Done ${summary.done}, missed ${summary.missed}.`
}

function Mark({ mark, size = 10 }: { mark: DayMark; size?: number }) {
  const style =
    mark === 'posted'
      ? { background: 'var(--navy)', border: '1.5px solid var(--navy)' }
      : mark === 'missed'
        ? { background: 'transparent', border: '1.5px solid var(--muted)' }
        : { background: 'transparent', border: '1.5px dashed var(--seat-border)' }
  return <span aria-hidden="true" className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, boxSizing: 'border-box', ...style }} />
}

export default function DayMarks({ marks, size = 10 }: { marks: DayMark[]; size?: number }) {
  if (marks.length === 0) return null
  const posted = marks.filter((m) => m === 'posted').length
  const missed = marks.filter((m) => m === 'missed').length
  return (
    <div
      role="img"
      aria-label={`${posted} days posted, ${missed} missed, ${marks.length - posted - missed} still to come`}
      className="flex flex-wrap gap-1.5"
    >
      {marks.map((mark, i) => (
        <Mark key={i} mark={mark} size={size} />
      ))}
    </div>
  )
}

export function DayMarksKey() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]" aria-label="Key for day marks">
      <li className="flex items-center gap-1.5">
        <Mark mark="posted" />
        Posted
      </li>
      <li className="flex items-center gap-1.5">
        <Mark mark="missed" />
        Missed
      </li>
      <li className="flex items-center gap-1.5">
        <Mark mark="upcoming" />
        Still to come
      </li>
    </ul>
  )
}
