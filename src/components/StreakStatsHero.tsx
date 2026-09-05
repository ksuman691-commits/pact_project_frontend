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
    <div
      className="pact-card rounded-[28px] px-5 py-5 sm:px-6 sm:py-6"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316 55%, #EF4444)' }}
          aria-hidden="true"
        >
          <Flame className="h-7 w-7 fill-white text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black leading-none tracking-[-0.04em] text-[var(--pact-text)]">{streak}</span>
            <span className="text-sm font-semibold text-[var(--pact-text-muted)]">day{streak === 1 ? '' : 's'} streak</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--pact-hairline)] rounded-2xl border border-[var(--pact-hairline)]" style={{ background: 'var(--pact-surface-2)' }}>
        <div className="px-3 py-3 text-center">
          <p className="text-lg font-black text-[var(--pact-text)]">{winRate}%</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--pact-text-faint)]">Win Rate</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-lg font-black text-[var(--pact-text)]">{pactsCompleted}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--pact-text-faint)]">Completed</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-lg font-black text-[var(--pact-text)]">{circlesCount}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--pact-text-faint)]">Circles</p>
        </div>
      </div>
    </div>
  )
}
