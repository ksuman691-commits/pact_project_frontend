import { useQuery } from '@tanstack/react-query'
import { leaderboardService } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'

export type BoardPeriod = 'week' | 'month' | 'all'

export interface BoardEntry {
  rank: number
  user_id: number
  username: string
  full_name: string
  avatar_url: string | null
  days_posted: number
  days_possible: number | null
  pct: number | null
  streak: number
  /** Positive: moved up since the start of today. Null: nothing to compare with yet. */
  rank_change: number | null
  is_you: boolean
}

export interface CircleBoard {
  circle_id: number
  period: BoardPeriod
  total: number
  showed_up: number
  entries: BoardEntry[]
  me: BoardEntry | null
}

/**
 * A circle's leaderboard. It sits under ['circles', ...], so the existing
 * invalidation after a check-in refetches it and the rows slide to their new places.
 */
export function useCircleBoard(circleId: number, period: BoardPeriod, enabled = true) {
  return useQuery<CircleBoard>({
    queryKey: [...queryKeys.circles.all, 'leaderboard', circleId, period],
    queryFn: async () => {
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined
      const response = await leaderboardService.circleBoard(circleId, period, tz)
      return response.data
    },
    enabled: enabled && !!circleId,
    staleTime: 20_000,
    retry: false,
  })
}
