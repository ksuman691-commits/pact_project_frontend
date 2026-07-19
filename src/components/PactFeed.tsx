'use client'

// Cache bust: 2024-07-07 08:40
import React, { useEffect, useMemo, useState } from 'react'
import { usePersonalizedFeed } from '@/hooks/useFeedQueries'
import { useSkipPact, useSupportPact } from '@/hooks/usePactActions'
import { useInView } from 'react-intersection-observer'
import FeedPactCard from './FeedPactCard'
import { pactService } from '@/services/api'
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
    skip_count: 1250,
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
    skip_count: 892,
    timeRemaining: '49d 3h',
    progressPercentage: 18,
    proofClips: [
      { day: 3, type: 'scale', text: '68kg (down 0.8kg)' },
      { day: 11, type: 'scale', text: '67.1kg (down 1.7kg)' },
    ],
    userVote: 'support',
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
    skip_count: 2130,
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
  // Force rebuild v2
}

const categoryLabelMap: Record<string, string> = {
  all: 'all pacts',
  trending: 'trending pacts',
  fitness: 'Fitness',
  startup: 'Startup',
  coding: 'Coding',
  creator: 'Creator',
  study: 'Study',
  habits: 'Habits',
  social: 'Social',
}

export default function PactFeed({
  showMockData = false,
  category = 'all',
  onBusyChange,
  onCreatePact,
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

  const supportMutation = useSupportPact()
  const skipMutation = useSkipPact()

  // Trigger load more when near bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Use API data when available. Mock data is opt-in only for isolated UI previews.
  useEffect(() => {
    if (data?.pages) {
      const apiPacts = data.pages.flatMap((page) => page.data)
      if (apiPacts.length > 0) {
        Promise.all(
          apiPacts.map(async (pact: any) => {
            try {
              const proofsRes = await pactService.listProofs(pact.id, 1).catch(() => ({ pagination: { total: 0 } }))
              return {
                ...pact,
                proof_count: proofsRes.pagination?.total ?? proofsRes.data?.pagination?.total ?? 0,
              }
            } catch {
              return {
                ...pact,
                proof_count: pact.proof_count ?? 0,
              }
            }
          })
        ).then(setPacts)
      } else if (!showMockData) {
        setPacts([])
      }
    }
  }, [data, showMockData])

  const emptyStateTitle = useMemo(() => {
    return normalizedCategory === 'all' || normalizedCategory === 'trending'
      ? 'No pacts found yet.'
      : 'No pacts found for this category.'
  }, [normalizedCategory])

  const emptyStateMessage = useMemo(() => 'Be the first to create one!', [])

  const handleVote = async (pactId: number, voteType: 'support' | 'skip') => {
    if (voteType === 'support') {
      await supportMutation.mutateAsync(pactId)
    } else {
      await skipMutation.mutateAsync(pactId)
    }
  }

  const removePact = (pactId: number) => {
    setPacts((prev) => prev.filter((p) => p.id !== pactId))
  }

  return (
    <div id="pact-feed-list" className="space-y-4 scroll-mt-6">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-200 rounded" />
                <div className="h-32 bg-slate-100 rounded-xl" />
                <div className="h-10 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : pacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-10 text-center">
          <p className="text-lg font-bold text-slate-900">{emptyStateTitle}</p>
          <p className="mt-2 text-sm text-slate-600">{emptyStateMessage}</p>
          <button
            onClick={() => onCreatePact ? onCreatePact() : router.push('/pacts/create')}
            className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
          >
            Create Pact
          </button>
        </div>
      ) : (
        pacts.map((pact) => (
        <FeedPactCard
          key={pact.id}
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
        ))
      )}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage && !isLoading && <p className="text-slate-600">Loading more...</p>}
        {!hasNextPage && pacts.length > 0 && (
          <p className="text-slate-500 text-sm">No more pacts to load</p>
        )}
      </div>
    </div>
  )
}
