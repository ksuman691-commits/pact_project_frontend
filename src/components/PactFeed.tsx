'use client'

// Cache bust: 2024-07-07 08:40
import React, { useEffect, useMemo, useState } from 'react'
import { usePersonalizedFeed } from '@/hooks/useFeedQueries'
import { useSkipPact } from '@/hooks/usePactActions'
import { useInView } from 'react-intersection-observer'
import FeedPactCard from './FeedPactCard'
import { useRouter } from 'next/navigation'

const mockPacts = [
  {
    id: 1,
    creator: 'Aniket',
    avatar: '🔥',
    title: 'Ship MVP in 7 days',
    category: 'Startup',
    daysTotal: 7,
    daysCurrent: 2,
    supportPool: 42000,
    confidence: 73,
    support_count: 3420,
    timeRemaining: '2d 14h',
    progressPercentage: 28,
    proofClips: [
      { day: 1, type: 'coding', text: 'Started backend setup' },
      { day: 2, type: 'checkpoint', text: 'API endpoints complete' },
    ],
    userVote: null,
  },
  {
    id: 2,
    creator: 'Priya',
    avatar: '💪',
    title: 'Lose 5kg in 60 days',
    category: 'Fitness',
    daysTotal: 60,
    daysCurrent: 11,
    supportPool: 28500,
    confidence: 82,
    support_count: 5643,
    timeRemaining: '49d 3h',
    progressPercentage: 18,
    proofClips: [
      { day: 3, type: 'scale', text: '68kg (down 0.8kg)' },
      { day: 11, type: 'scale', text: '67.1kg (down 1.7kg)' },
    ],
    userVote: null,
    is_joined_by_me: true,
    active_cheer_count: 214,
  },
  {
    id: 3,
    creator: 'Rohan',
    avatar: '📚',
    title: '100 consecutive days of code',
    category: 'Coding',
    daysTotal: 100,
    daysCurrent: 34,
    supportPool: 15800,
    confidence: 65,
    support_count: 4120,
    timeRemaining: '66d 18h',
    progressPercentage: 34,
    proofClips: [
      { day: 1, type: 'code', text: 'Day 1 complete' },
      { day: 34, type: 'code', text: 'Halfway there!' },
    ],
    userVote: 'skip',
  },
]

interface PactFeedProps {
  showMockData?: boolean
  category?: string
  onBusyChange?: (busy: boolean) => void
  onCreatePact?: () => void
  /** Pact id to give a one-time glow entrance (e.g. just returned from Create Pact). */
  highlightPactId?: string | number | null
  // Force rebuild v2
}

const normalizeVote = (vote: unknown): string | null => {
  if (typeof vote !== 'string') return null
  if (vote === 'doubt') return 'skip'
  return vote
}

// Kept in sync with the CATEGORIES list in TopNav.tsx — same 7 real
// backend-filterable buckets, same friendlier vibe-inspired names.
const categoryLabelMap: Record<string, string> = {
  all: 'all pacts',
  trending: 'trending pacts',
  fitness: 'Glow Up & Wellbeing',
  startup: 'Build & Earn',
  coding: 'Coding',
  creator: 'Create',
  study: 'Level Up',
  habits: 'Dare Yourself',
  social: 'Social & Adventure',
}

export default function PactFeed({
  showMockData = false,
  category = 'all',
  onBusyChange,
  onCreatePact,
  highlightPactId = null,
}: PactFeedProps) {
  const router = useRouter()
  const [pacts, setPacts] = useState(showMockData ? mockPacts : [])
  const { ref, inView } = useInView()
  const normalizedCategory = (category || 'all').toLowerCase()

  // Fetch feed data with infinite scroll (will integrate with API later)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } =
    usePersonalizedFeed(normalizedCategory)

  const isBusy = isLoading || isFetching || isFetchingNextPage

  useEffect(() => {
    onBusyChange?.(isBusy)
  }, [isBusy, onBusyChange])

  useEffect(() => {
    if (!showMockData) {
      setPacts([])
    }
  }, [normalizedCategory, showMockData])

  const skipMutation = useSkipPact()

  // Trigger load more when near bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Use API data when available. Mock data is opt-in only for isolated UI previews.
  useEffect(() => {
    if (!data?.pages) {
      if (!showMockData) {
        setPacts([])
      }
      return
    }

    const apiPacts = data.pages.flatMap((page: any) => page.data ?? [])
    if (apiPacts.length > 0) {
      const unskippedPacts = apiPacts.filter((pact: any) => {
        const existingVote = normalizeVote(pact.user_vote ?? pact.userVote)
        return existingVote !== 'skip'
      })
      setPacts(unskippedPacts)
    } else if (!showMockData) {
      setPacts([])
    }
  }, [data, showMockData])

  const emptyStateTitle = useMemo(() => {
    return normalizedCategory === 'all' || normalizedCategory === 'trending'
      ? 'No pacts found yet.'
      : 'No pacts found for this category.'
  }, [normalizedCategory])

  const emptyStateMessage = useMemo(() => 'Be the first to create one!', [])

  const handleVote = async (pactId: number, _voteType: 'skip') => {
    await skipMutation.mutateAsync(pactId)
  }

  const removePact = (pactId: number) => {
    setPacts((prev) => prev.filter((p) => p.id !== pactId))
  }

  return (
    <div id="pact-feed-list" className="space-y-4 scroll-mt-6">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="pact-card rounded-[24px] overflow-hidden">
              <div className="pact-shimmer h-24" />
              <div className="p-4 space-y-3">
                <div className="pact-shimmer h-5 w-2/3 rounded" />
                <div className="pact-shimmer h-4 w-1/2 rounded" />
                <div className="pact-shimmer h-32 rounded-[24px]" />
                <div className="pact-shimmer h-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : pacts.length === 0 ? (
        <div className="pact-card rounded-[24px] px-5 py-10 text-center">
          <p className="text-lg font-bold text-[var(--pact-text)]">{emptyStateTitle}</p>
          <p className="mt-2 text-sm text-[var(--pact-text-dim)]">{emptyStateMessage}</p>
          <button
            onClick={() => onCreatePact ? onCreatePact() : router.push('/pacts/create')}
            className="pact-btn-glow mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full font-bold transition-colors"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
          >
            Create Pact
          </button>
        </div>
      ) : (
        pacts.map((pact, index) => {
        const isNew = highlightPactId != null && String(pact.id) === String(highlightPactId)
        return (
        <div
          key={pact.id}
          className={isNew ? 'pact-new-item' : 'pact-list-item'}
          style={isNew ? undefined : { animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
        <FeedPactCard
          pact={pact}
          userVote={pact.userVote || (pact as any).user_vote}
          onVote={handleVote}
          onDismiss={removePact}
          onProofUpload={(pactId, uploadedProof) => {
            if (!uploadedProof) return
            setPacts((prev) =>
              prev.map((p) =>
                p.id === pactId
                  ? (() => {
                      const currentPact = p as any
                      return {
                        ...currentPact,
                        proof_url: uploadedProof.proof_url || uploadedProof.file_url || currentPact.proof_url,
                        proof_type: uploadedProof.proof_type || currentPact.proof_type,
                        latest_proof_caption: uploadedProof.caption || currentPact.latest_proof_caption,
                        latest_proof_upload_date:
                          uploadedProof.uploaded_at || uploadedProof.created_at || currentPact.latest_proof_upload_date,
                        proof_count: Number(currentPact.proof_count ?? 0) + 1,
                      }
                    })()
                  : p
              )
            )
          }}
        />
        </div>
        )
        })
      )}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage && !isLoading && <p className="text-[var(--pact-text-dim)]">Loading more...</p>}
        {!hasNextPage && pacts.length > 0 && (
          <p className="text-[var(--pact-text-faint)] text-sm">No more pacts to load</p>
        )}
      </div>
    </div>
  )
}
