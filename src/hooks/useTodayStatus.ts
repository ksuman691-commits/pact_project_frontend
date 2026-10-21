'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { useAuthStore } from '@/store/auth'

export interface TodayPact {
  id: number
  title: string
  circle_id: number | null
  circle_name: string | null
  end_date: string | null
  posted_today: boolean
}

const storageKey = (userId: number | string) => `cp:today:${userId}`

function readCache(userId: number | string | undefined): TodayPact[] | undefined {
  if (userId == null || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as { day: string; pacts: TodayPact[] }
    // Yesterday's "posted" flags are wrong today, so only reuse today's copy.
    if (parsed.day !== new Date().toDateString()) return undefined
    return parsed.pacts
  } catch {
    return undefined
  }
}

/**
 * Home's Today card in one request (GET /api/me/today). The last answer is
 * kept in localStorage so the card paints instantly on the next visit, then
 * refreshes in the background.
 */
export function useTodayStatus() {
  const { user } = useAuthStore()
  const query = useQuery({
    queryKey: ['me-today', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/me/today', { timeout: 12000 })
      return (response.data?.pacts ?? []) as TodayPact[]
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    initialData: () => readCache(user?.id),
    initialDataUpdatedAt: 0,
  })

  useEffect(() => {
    if (!query.data || user?.id == null) return
    try {
      window.localStorage.setItem(storageKey(user.id), JSON.stringify({ day: new Date().toDateString(), pacts: query.data }))
    } catch {
      // Storage can be full or blocked; the card still works without it.
    }
  }, [query.data, user?.id])

  const pacts = query.data ?? []
  const pending = pacts.find((p) => !p.posted_today) ?? null
  return {
    pacts,
    pendingPact: pending,
    allDone: pacts.length > 0 && !pending,
    isLoading: query.data === undefined && query.isLoading,
  }
}
