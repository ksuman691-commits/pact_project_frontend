'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { STORIES_ENABLED, type PactStory } from '@/lib/stories'
import { queryKeys } from '@/lib/queryKeys'
import { circleService } from '@/services/api'
import { usePactsStoriesToday } from '@/hooks/useStories'

export interface MomentPerson {
  userId: number
  name: string | null
  avatarUrl: string | null
  stories: PactStory[]
  hasUnseen: boolean
  circleId: number
  circleName: string
  latestAt: number
}

interface CircleLike {
  id: number
  name: string
  stories_today_count?: number | null
}

/**
 * Who posted a moment today across the viewer's circles, one entry per person
 * (Instagram-style). Only circles the backend says have moments today are
 * queried, and the queries share their cache with the circle viewer.
 */
export function useMomentPeople(circles: CircleLike[], viewerId?: number | null) {
  const active = useMemo(() => circles.filter((c) => (c.stories_today_count ?? 0) > 0), [circles])

  const pactQueries = useQueries({
    queries: active.map((circle) => ({
      queryKey: queryKeys.circles.pacts(circle.id),
      queryFn: async () => (await circleService.listPacts(circle.id)).data,
      enabled: STORIES_ENABLED,
      staleTime: 60_000,
    })),
  })

  // pact id -> circle, so each story can say which circle it came from.
  const pactCircle = useMemo(() => {
    const map = new Map<number, CircleLike>()
    pactQueries.forEach((query, i) => {
      const data: any = query.data
      const pacts: any[] = Array.isArray(data) ? data : data?.data ?? []
      pacts
        .filter((p) => !p.status || p.status === 'active')
        .forEach((p) => {
          const id = Number(p.id)
          if (id && !map.has(id)) map.set(id, active[i])
        })
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pactQueries.map((q) => q.dataUpdatedAt).join(','), active])

  const pactIds = useMemo(() => Array.from(pactCircle.keys()), [pactCircle])
  const storyQueries = usePactsStoriesToday(pactIds)

  const people = useMemo(() => {
    const byUser = new Map<number, MomentPerson>()
    storyQueries.forEach((query, i) => {
      const circle = pactCircle.get(pactIds[i])
      if (!circle) return
      for (const story of query.data ?? []) {
        if (viewerId != null && story.user_id === viewerId) continue
        const at = new Date(story.created_at).getTime()
        const person: MomentPerson = byUser.get(story.user_id) ?? {
          userId: story.user_id,
          name: story.name,
          avatarUrl: story.avatar_url,
          stories: [],
          hasUnseen: false,
          circleId: circle.id,
          circleName: circle.name,
          latestAt: 0,
        }
        person.stories.push(story)
        if (story.seen === false) person.hasUnseen = true
        if (at > person.latestAt) person.latestAt = at
        byUser.set(story.user_id, person)
      }
    })
    const list = Array.from(byUser.values())
    list.forEach((p) => p.stories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    // Unseen first, then most recent.
    return list.sort((a, b) => Number(b.hasUnseen) - Number(a.hasUnseen) || b.latestAt - a.latestAt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyQueries.map((q) => q.dataUpdatedAt).join(','), pactCircle, pactIds, viewerId])

  const isLoading = pactQueries.some((q) => q.isLoading) || storyQueries.some((q) => q.isLoading)
  return { people, isLoading, hasActiveCircles: active.length > 0 }
}
