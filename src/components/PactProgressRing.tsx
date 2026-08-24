'use client'

type PactProgressRingProps = {
  completed: number
  total: number
  missed?: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

export default function PactProgressRing({
  completed,
  total,
  missed = 0,
  size = 72,
  strokeWidth = 7,
  showLabel = true,
  className = '',
}: PactProgressRingProps) {
  const safeTotal = Math.max(1, total)
  const safeCompleted = Math.min(safeTotal, Math.max(0, completed))
  const safeMissed = Math.min(Math.max(0, missed), Math.max(0, safeTotal - safeCompleted))
  const remaining = Math.max(0, safeTotal - safeCompleted - safeMissed)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const gap = circumference * 0.012
  const segment = (value: number) => Math.max(0, circumference * (value / safeTotal) - gap)
  const completedLength = segment(safeCompleted)
  const missedLength = segment(safeMissed)
  const progress = Math.round((safeCompleted / safeTotal) * 100)
  const center = size / 2

  const ring = (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`${progress}% complete${safeMissed ? `, ${safeMissed} missed days` : ''}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--pact-surface-2)" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--pact-violet)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${completedLength} ${circumference - completedLength}`} />
        {safeMissed > 0 && (
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--pact-danger)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${missedLength} ${circumference - missedLength}`} strokeDashoffset={-completedLength - gap} />
        )}
      </svg>
      {showLabel && (
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <strong className="text-[0.78em] font-black text-[var(--pact-text)]">{progress}%</strong>
          <span className="mt-1 text-[0.48em] font-bold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">done</span>
        </span>
      )}
    </div>
  )

  return ring
}

export function getPactProgress(pact: any) {
  const start = new Date(pact.start_date || pact.created_at)
  const end = new Date(pact.end_date || pact.deadline || Date.now())
  const today = new Date()
  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
  // "Elapsed" here means days that have fully PASSED, i.e. days that could
  // actually have been missed — it deliberately does NOT include today
  // (day 0 on creation, or whichever day is currently in progress), since
  // that day hasn't ended yet and can't be "missed" retroactively. Without
  // the "+ 1" that used to be here, a brand-new pact created moments ago
  // (today - start ~= 0ms) correctly gets elapsed = 0 instead of 1, so it
  // shows 0% complete with no red "missed" segment until its first day is
  // actually over.
  const elapsed = Math.min(total, Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000)))
  const completed = Math.min(elapsed, Number(pact.proof_count ?? pact.proofs_count ?? pact.completed_days ?? (pact.status === 'completed' ? total : 0)))
  const missed = Math.max(0, elapsed - completed)
  return { total, completed, missed }
}
