import api from '@/services/api'

export interface CpScorePart {
  key: 'showing_up' | 'finishing' | 'consistency' | 'trust' | 'community'
  name: string
  got: number
  max: number
  why: string
}

export interface CpScoreChange {
  what: string
  delta: string
  up: boolean
  at: string
}

export interface CpScore {
  user_id: number
  /** building: old servers only. resting: nothing in 90 days, score kept as of the last moment. */
  status: 'ready' | 'resting' | 'building' | 'unavailable'
  score: number | null
  band: string | null
  building_day?: number
  building_days?: number
  /** First 14 days: band reads New, everyone starts at 75. */
  is_new?: boolean
  new_day?: number | null
  new_days?: number
  resting_since?: string | null
  change_30d?: number | null
  summary?: string
  parts?: CpScorePart[]
  penalty?: number
  trend?: { date: string; score: number }[]
  /** Only on your own score. */
  recent?: CpScoreChange[]
}

export async function getCpScore(userId: number | string): Promise<CpScore> {
  const response = await api.get(`/api/users/${userId}/cp-score`)
  return response.data
}
