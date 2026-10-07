'use client'

import { useCallback, useRef, useState } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStory, getTodayStories, markStorySeen, putStoryVideo, requestStoryUploadUrl } from '@/lib/api/stories'
import { isStoriesUnavailable, storyErrorMessage, STORIES_ENABLED, type PactStory } from '@/lib/stories'
import { queryKeys } from '@/lib/queryKeys'
import { circleService } from '@/services/api'

export const storyKeys = {
  all: ['stories'] as const,
  pactToday: (pactId: number) => ['stories', 'pact', pactId, 'today'] as const,
}

const todayQueryOptions = (pactId: number) => ({
  queryKey: storyKeys.pactToday(pactId),
  queryFn: () => getTodayStories(pactId),
  staleTime: 30_000,
  // A 404/501 means "not built yet" — retrying only delays the calm state.
  retry: (count: number, error: any) => !isStoriesUnavailable(error) && count < 1,
})

export function usePactStoriesToday(pactId: number, enabled = true) {
  const query = useQuery({ ...todayQueryOptions(pactId), enabled: STORIES_ENABLED && enabled && !!pactId })
  return { ...query, unavailable: query.isError && isStoriesUnavailable(query.error) }
}

export function usePactsStoriesToday(pactIds: number[]) {
  return useQueries({
    queries: pactIds.map((id) => ({ ...todayQueryOptions(id), enabled: STORIES_ENABLED && !!id })),
  })
}

/**
 * Today's stories across every active pact a circle owns. Only runs while
 * the viewer is open, so tapping one ring is the only thing that triggers it.
 */
export function useCircleStoriesToday(circleId: number | null) {
  const pactsQuery = useQuery({
    queryKey: queryKeys.circles.pacts(circleId ?? 0),
    queryFn: async () => (await circleService.listPacts(circleId as number)).data,
    enabled: STORIES_ENABLED && !!circleId,
    staleTime: 60_000,
  })
  const pacts: any[] = Array.isArray(pactsQuery.data) ? pactsQuery.data : (pactsQuery.data as any)?.data ?? []
  const activeIds = pacts.filter((p) => !p.status || p.status === 'active').map((p) => Number(p.id)).filter(Boolean)
  const storyQueries = usePactsStoriesToday(activeIds)

  const stories: PactStory[] = storyQueries
    .flatMap((q) => q.data ?? [])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const isLoading = pactsQuery.isLoading || storyQueries.some((q) => q.isLoading)
  const unavailable = storyQueries.length > 0 && storyQueries.every((q) => q.isError && isStoriesUnavailable(q.error))
  return { stories, isLoading, unavailable, isError: pactsQuery.isError }
}

/** Fire-and-forget; each story is reported at most once per page load. */
export function useMarkStorySeen() {
  const reported = useRef(new Set<number>())
  return useCallback((storyId: number) => {
    if (reported.current.has(storyId)) return
    reported.current.add(storyId)
    markStorySeen(storyId).catch(() => {
      reported.current.delete(storyId)
    })
  }, [])
}

export type PostPhase = 'idle' | 'requesting' | 'uploading' | 'saving' | 'done' | 'error'

export function usePostStory(pactId: number) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<PostPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const post = useCallback(
    async ({ blob, contentType, durationSeconds }: { blob: Blob; contentType: string; durationSeconds: number }) => {
      setError(null)
      setProgress(0)
      try {
        setPhase('requesting')
        const { upload_url, object_key } = await requestStoryUploadUrl(pactId, { content_type: contentType, size_bytes: blob.size })
        setPhase('uploading')
        await putStoryVideo(upload_url, blob, contentType, setProgress)
        setPhase('saving')
        await createStory(pactId, { object_key, duration_seconds: Math.round(durationSeconds * 10) / 10 })
        setPhase('done')
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: storyKeys.pactToday(pactId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) }),
          queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
          queryClient.invalidateQueries({ queryKey: queryKeys.circles.lists() }),
        ])
      } catch (err) {
        setUnavailable(isStoriesUnavailable(err))
        setError(storyErrorMessage(err))
        setPhase('error')
      }
    },
    [pactId, queryClient],
  )

  const reset = useCallback(() => {
    setPhase('idle')
    setProgress(0)
    setError(null)
  }, [])

  return { phase, progress, error, unavailable, post, reset }
}
