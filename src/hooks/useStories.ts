'use client'

import { useCallback, useRef, useState } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStory, getFollowingMoments, getMyStoriesToday, getStoryViewers, getTodayStories, markStorySeen, putStoryVideo, requestStoryUploadUrl } from '@/lib/api/stories'
import { isStoriesUnavailable, storyErrorMessage, STORIES_ENABLED, STORY_MAX_SECONDS, type PactStory } from '@/lib/stories'
import { queryKeys } from '@/lib/queryKeys'
import { circleService, pactService } from '@/services/api'
import { MOMENT_POSTED_EVENT } from '@/lib/push'

export const storyKeys = {
  all: ['stories'] as const,
  pactToday: (pactId: number) => ['stories', 'pact', pactId, 'today'] as const,
  mineToday: ['stories', 'me', 'today'] as const,
  followingToday: ['stories', 'following', 'today'] as const,
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

/** Everything the viewer posted today, on any pact. Drives the "You" ring on Home. */
export function useMyStoriesToday() {
  return useQuery({
    queryKey: storyKeys.mineToday,
    queryFn: getMyStoriesToday,
    enabled: STORIES_ENABLED,
    staleTime: 30_000,
    retry: (count: number, error: any) => !isStoriesUnavailable(error) && count < 1,
  })
}

/** Live moments from people the viewer follows (free pacts open to followers only). */
export function useFollowingMoments() {
  return useQuery({
    queryKey: storyKeys.followingToday,
    queryFn: getFollowingMoments,
    enabled: STORIES_ENABLED,
    staleTime: 30_000,
    retry: (count: number, error: any) => !isStoriesUnavailable(error) && count < 1,
  })
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

/** Who has watched one of the viewer's own moments. Polls gently while open. */
export function useStoryViewers(storyId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['stories', 'viewers', storyId],
    queryFn: () => getStoryViewers(storyId as number),
    enabled: STORIES_ENABLED && enabled && !!storyId,
    staleTime: 10_000,
    refetchInterval: enabled ? 20_000 : false,
    retry: false,
  })
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

function isRetryablePostError(error: any) {
  const status = error?.response?.status
  return error?.code === 'ECONNABORTED' || status == null || status === 408 || status >= 500
}

export function usePostStory(pactId: number) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<PostPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retryable, setRetryable] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const post = useCallback(
    async ({ blob, contentType, durationSeconds }: { blob: Blob; contentType: string; durationSeconds: number }) => {
      setError(null)
      setRetryable(false)
      setProgress(0)
      try {
        if (contentType.startsWith('image/')) {
          // Photo moments go through the pact's photo upload (checked for safety there),
          // and count for today's day like a video.
          setPhase('uploading')
          const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : contentType.includes('hei') ? 'heic' : 'jpg'
          const file = new File([blob], `moment.${extension}`, { type: contentType })
          await pactService.uploadProofFile(pactId, file, 'photo', undefined, undefined, setProgress)
          setPhase('saving')
        } else {
          setPhase('requesting')
          const { upload_url, object_key } = await requestStoryUploadUrl(pactId, { content_type: contentType, size_bytes: blob.size })
          setPhase('uploading')
          await putStoryVideo(upload_url, blob, contentType, setProgress)
          setPhase('saving')
          await createStory(pactId, {
            object_key,
            duration_seconds: Math.min(STORY_MAX_SECONDS, Math.max(1, Math.round(durationSeconds))),
          })
        }
        setPhase('done')
        // The reminder sheet offers itself once, after a first check-in (src/components/ReminderPrompt.tsx).
        try {
          window.dispatchEvent(new CustomEvent(MOMENT_POSTED_EVENT, { detail: { pactId } }))
        } catch {
          // Old browsers without CustomEvent: nothing to offer.
        }
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: storyKeys.pactToday(pactId) }),
          queryClient.invalidateQueries({ queryKey: storyKeys.mineToday }),
          queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) }),
          queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
          queryClient.invalidateQueries({ queryKey: ['me-today'] }),
          queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.circles.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.circles.lists() }),
        ])
      } catch (err) {
        // The photo upload is always there, so a 404 on it is a real error, not "coming soon".
        const isPhoto = contentType.startsWith('image/')
        setUnavailable(!isPhoto && isStoriesUnavailable(err))
        setError(isPhoto && isStoriesUnavailable(err) ? "Couldn't find this pact. Refresh and try again." : storyErrorMessage(err))
        setRetryable(isRetryablePostError(err))
        setPhase('error')
      }
    },
    [pactId, queryClient],
  )

  const reset = useCallback(() => {
    setPhase('idle')
    setProgress(0)
    setError(null)
    setRetryable(false)
  }, [])

  return { phase, progress, error, retryable, unavailable, post, reset }
}
