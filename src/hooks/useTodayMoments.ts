'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { STORIES_ENABLED, type PactStory } from '@/lib/stories'
import { useMyPacts } from './useMyPacts'
import { usePactsStoriesToday } from './useStories'

// One stories request per active pact, so keep the fan-out small.
const MAX_PACTS = 8

function endTime(pact: any): number {
  const raw = pact?.end_date || pact?.deadline
  const t = raw ? new Date(raw).getTime() : NaN
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
}

/**
 * What the viewer has and hasn't posted today, across their active pacts.
 *
 * A pact counts as "posted" when today's stories for it include one from the
 * viewer (the same check StoryPactCard uses). Both queries share their cache
 * keys with the Pacts page and the Post today sheet, so Home adds no new
 * request types.
 */
export function useTodayMoments() {
  const { user } = useAuthStore()
  const myPacts = useMyPacts()

  const activePacts = useMemo(() => {
    const list: any[] = ((myPacts.data as any)?.data || []).filter((p: any) => p.status === 'active' && p.is_joined_by_me !== false)
    return list
      .slice()
      .sort((a, b) => endTime(a) - endTime(b))
      .slice(0, MAX_PACTS)
  }, [myPacts.data])

  const storyQueries = usePactsStoriesToday(activePacts.map((p) => Number(p.id)))

  return useMemo(() => {
    const postedIds = new Set<number>()
    const myStories: PactStory[] = []
    activePacts.forEach((pact, i) => {
      const stories = storyQueries[i]?.data
      const mine = user?.id != null ? (stories ?? []).filter((s) => s.user_id === user.id) : []
      if (mine.length > 0) {
        postedIds.add(Number(pact.id))
        myStories.push(...mine)
      }
    })
    const storiesLoading = STORIES_ENABLED && storyQueries.some((q) => q.isLoading)
    const pendingPact = activePacts.find((p) => !postedIds.has(Number(p.id))) ?? null
    return {
      activePacts,
      /** The viewer's own moments from today, oldest first. */
      myStories: myStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      /** True once the viewer has a moment on at least one active pact today. */
      postedToday: postedIds.size > 0,
      /** True when every active pact already has a moment from the viewer. */
      allDone: activePacts.length > 0 && postedIds.size === activePacts.length,
      /** The most urgent active pact without a moment from the viewer yet. */
      pendingPact,
      isLoading: myPacts.isLoading || storiesLoading,
    }
  }, [activePacts, storyQueries, user?.id, myPacts.isLoading])
}
