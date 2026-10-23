'use client'

import { useMemo } from 'react'
import type { PactStory } from '@/lib/stories'
import { useMomentPeople } from './useMomentPeople'
import { useMyStoriesToday } from './useStories'

interface CircleLike {
  id: number
  name: string
  stories_today_count?: number | null
}

/**
 * The viewer's own moments from today, wherever they were posted: on their
 * own pacts, or on a friend's pact in a shared circle. De-duped, oldest first.
 */
export function useMyMomentsToday(circles: CircleLike[], viewerId?: number | null) {
  const { mine } = useMomentPeople(circles, viewerId)
  // One request for all of the viewer's pacts (it used to check only the 8 most urgent).
  const myPactStories = useMyStoriesToday().data
  const myStories = useMemo(() => {
    const byId = new Map<number, PactStory>()
    ;[...(myPactStories ?? []), ...mine].forEach((s) => byId.set(s.id, s))
    return Array.from(byId.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [myPactStories, mine])
  return { myStories, postedToday: myStories.length > 0 }
}
