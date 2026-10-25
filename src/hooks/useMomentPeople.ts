'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { STORIES_ENABLED, type PactStory } from '@/lib/stories'
import { queryKeys } from '@/lib/queryKeys'
import { circleService } from '@/services/api'
import { useFollowingMoments, usePactsStoriesToday } from '@/hooks/useStories'

export interface MomentPerson {
  userId: number
  name: string | null
  avatarUrl: string | null
  username: string | null
  /** Oldest first, so a person's moments play in the order they were posted. */
  stories: PactStory[]
  hasUnseen: boolean
  /** Set when the person is in one of the viewer's circles (the first one found). */
  circleId: number | null
  circleName: string | null
  /** The viewer follows this person. Someone can be both a circle member and followed. */
  isFollowing: boolean
  latestAt: number
}

interface CircleLike {
  id: number
  name: string
  stories_today_count?: number | null
}

/** The most bubbles the Home row shows. Everyone else is one tap away in See All. */
export const HOME_MOMENT_LIMIT = 15

const time = (iso: string) => new Date(iso).getTime()

/**
 * Who posted a moment today that the viewer can already watch, one entry per
 * person: people in the viewer's circles, plus people the viewer follows (free
 * public and followers-only pacts). Someone who is both is one bubble with all
 * their moments, oldest first. Only circles the backend says have moments
 * today are queried, and those queries share their cache with the circle viewer.
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

  // pact id -> circle and title, so each story can say which pact and circle it came from.
  const pactInfo = useMemo(() => {
    const map = new Map<number, { circle: CircleLike; title: string | null }>()
    pactQueries.forEach((query, i) => {
      const data: any = query.data
      const pacts: any[] = Array.isArray(data) ? data : data?.data ?? []
      pacts
        .filter((p) => !p.status || p.status === 'active')
        .forEach((p) => {
          const id = Number(p.id)
          if (id && !map.has(id)) map.set(id, { circle: active[i], title: p.title ?? null })
        })
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pactQueries.map((q) => q.dataUpdatedAt).join(','), active])

  const pactIds = useMemo(() => Array.from(pactInfo.keys()), [pactInfo])
  const storyQueries = usePactsStoriesToday(pactIds)
  const followingQuery = useFollowingMoments()

  const grouped = useMemo(() => {
    const byUser = new Map<number, MomentPerson>()
    const seenStoryIds = new Set<number>()
    const mine: PactStory[] = []

    const personFor = (story: PactStory, seed: Partial<MomentPerson>): MomentPerson => {
      const existing = byUser.get(story.user_id)
      if (existing) return existing
      const person: MomentPerson = {
        userId: story.user_id,
        name: story.name,
        avatarUrl: story.avatar_url,
        username: story.username ?? null,
        stories: [],
        hasUnseen: false,
        circleId: null,
        circleName: null,
        isFollowing: false,
        latestAt: 0,
        ...seed,
      }
      byUser.set(story.user_id, person)
      return person
    }

    const add = (person: MomentPerson, story: PactStory) => {
      if (seenStoryIds.has(story.id)) return
      seenStoryIds.add(story.id)
      person.stories.push(story)
      if (story.seen === false) person.hasUnseen = true
      person.latestAt = Math.max(person.latestAt, time(story.created_at))
      if (!person.username && story.username) person.username = story.username
    }

    // Circles first: when a story shows up through a circle and through a follow, the circle label wins.
    storyQueries.forEach((query, i) => {
      const info = pactInfo.get(pactIds[i])
      if (!info) return
      for (const story of query.data ?? []) {
        if (viewerId != null && story.user_id === viewerId) {
          mine.push(story)
          continue
        }
        const person = personFor(story, {})
        if (person.circleId == null) {
          person.circleId = info.circle.id
          person.circleName = info.circle.name
        }
        add(person, { ...story, pact_id: Number(pactIds[i]), pact_title: info.title, pact_visibility: 'circle' })
      }
    })

    for (const followed of followingQuery.data ?? []) {
      if (viewerId != null && followed.user_id === viewerId) continue
      for (const story of followed.stories ?? []) {
        const person = personFor(story, { username: followed.username })
        person.isFollowing = true
        add(person, story)
      }
    }

    const list = Array.from(byUser.values()).filter((p) => p.stories.length > 0)
    list.forEach((p) => p.stories.sort((a, b) => time(a.created_at) - time(b.created_at) || a.id - b.id))
    // Unseen first, then most recent.
    return {
      people: list.sort((a, b) => Number(b.hasUnseen) - Number(a.hasUnseen) || b.latestAt - a.latestAt),
      mine,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyQueries.map((q) => q.dataUpdatedAt).join(','), followingQuery.dataUpdatedAt, pactInfo, pactIds, viewerId])

  const isLoading = pactQueries.some((q) => q.isLoading) || storyQueries.some((q) => q.isLoading) || followingQuery.isLoading
  return { people: grouped.people, mine: grouped.mine, isLoading, hasActiveCircles: active.length > 0 }
}
