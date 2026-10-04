'use client'

import { Flame } from 'lucide-react'

interface StreakStatsHeroProps {
  /** `current_streak` from GET /api/users/{id}/stats — consecutive days, real field. */
  streak: number
  /** `win_rate` from the same response — percentage of created pacts that finished completed. */
  winRate: number
  /** `pacts_completed` — lifetime count of the viewer's own completed pacts. */
  pactsCompleted: number
  /** `circles_count` — number of circles the viewer belongs to. */
  circlesCount: number
  isLoading?: boolean
}

/**
 * Streak-led hero for the top of the feed/home page: one prominent card with
 * the streak as the dominant number, a compact stat row underneath. Every
 * number here is a real field off GET /api/users/{id}/stats (UserStatsResponse
 * in app/schemas/users.py) — there is no "active pact count" or "circle rank"
 * field on that response, so this intentionally doesn't show either; win
 * rate, pacts completed, and circle membership count stand in as the closest
 * real analogs.
 */
export default function StreakStatsHero({ streak, winRate, pactsCompleted, circlesCount, isLoading }: StreakStatsHeroProps) {
  if (isLoading) {
    return <div className="pact-shimmer h-40 rounded-[28px]" />
  }

  return (
    <section aria-label="Your record" className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Your record</p>
      <div className="grid grid-cols-4 divide-x divide-[var(--hairline-soft)] rounded-[6px] border border-[var(--hairline)] bg-[var(--card)]">
        {[
          { value: `${streak}`, label: streak === 1 ? 'day running' : 'days running' },
          { value: `${winRate}%`, label: 'kept' },
          { value: `${pactsCompleted}`, label: 'completed' },
          { value: `${circlesCount}`, label: circlesCount === 1 ? 'circle' : 'circles' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 px-1 py-4 text-center">
            <span className="font-display text-[28px] leading-none text-[var(--ink)]">{stat.value}</span>
            <span className="text-[11px] text-[var(--muted)]">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
