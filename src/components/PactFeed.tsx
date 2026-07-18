'use client'

// Cache bust: 2024-07-07 08:40
import React, { useEffect, useMemo, useState } from 'react'
import { usePersonalizedFeed } from '@/hooks/useFeedQueries'
import { useBelievePact, useDoubtPact } from '@/hooks/usePactMutations'
import { useInView } from 'react-intersection-observer'
import PactCard from './PactCard'
import toast from 'react-hot-toast'
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
    believers: 3420,
    doubters: 1250,
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
    believers: 5643,
    doubters: 892,
    timeRemaining: '49d 3h',
    progressPercentage: 18,
    proofClips: [
      { day: 3, type: 'scale', text: '68kg (down 0.8kg)' },
      { day: 11, type: 'scale', text: '67.1kg (down 1.7kg)' },
    ],
    userVote: 'believe',
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
    believers: 4120,
    doubters: 2130,
    timeRemaining: '66d 18h',
    progressPercentage: 34,
    proofClips: [
      { day: 1, type: 'code', text: 'Day 1 complete' },
      { day: 34, type: 'code', text: 'Halfway there!' },
    ],
    userVote: 'doubt',
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
  const [userVotes, setUserVotes] = useState<Record<number, string>>({})
  const { ref, inView } = useInView()
  const normalizedCategory = (category || 'all').toLowerCase()

  const toProofClip = (proof: any) => ({
    id: proof.id,
    type: proof.proof_type === 'video' ? 'video' : 'photo',
    url: proof.file_url,
    file_url: proof.file_url,
    text: proof.caption || '',
    caption: proof.caption || '',
    day: proof.day_number,
    uploadedAt: proof.created_at,
  })

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

  // Mutations for voting
  const believeMutation = useBelievePact()
  const doubtMutation = useDoubtPact()

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
              const [voteRes, proofsRes] = await Promise.all([
                pactService.getVotes(pact.id),
                pactService.listProofs(pact.id).catch(() => ({ data: [] })),
              ])
              return {
                ...pact,
                believers: voteRes.data?.believe_count ?? 0,
                doubters: voteRes.data?.doubt_count ?? 0,
                confidence: voteRes.data?.confidence_percentage ?? 0,
                proofClips: (proofsRes.data || []).map(toProofClip),
              }
            } catch {
              return {
                ...pact,
                believers: pact.believers ?? 0,
                doubters: pact.doubters ?? 0,
                confidence: pact.confidence ?? 0,
                proofClips: [],
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

  const handleVote = (pactId: number, voteType: 'believe' | 'doubt') => {
    setPacts((prev) =>
      prev.map((p) => {
        if (p.id !== pactId) return p

        const previousVote = (userVotes[pactId] || (p as any).userVote || null) as 'believe' | 'doubt' | null
        let believers = Number((p as any).believers ?? 0)
        let doubters = Number((p as any).doubters ?? 0)

        if (previousVote === 'believe' && believers > 0) believers -= 1
        if (previousVote === 'doubt' && doubters > 0) doubters -= 1

        if (voteType === 'believe') believers += 1
        if (voteType === 'doubt') doubters += 1

        const total = believers + doubters
        const confidence = total > 0 ? Math.round((believers / total) * 100) : 0

        return {
          ...p,
          believers,
          doubters,
          confidence,
          userVote: voteType,
        }
      })
    )

    setUserVotes((prev) => ({
      ...prev,
      [pactId]: voteType,
    }))

    if (voteType === 'believe') {
      believeMutation.mutate(pactId, {
        onSuccess: () => {
          toast.success('Vote recorded!')
        },
        onError: () => {
          toast.error('Failed to vote')
        },
      })
    } else {
      doubtMutation.mutate(pactId, {
        onSuccess: () => {
          toast.success('Vote recorded!')
        },
        onError: () => {
          toast.error('Failed to vote')
        },
      })
    }
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
        <PactCard
          key={pact.id}
          pact={pact}
          userVote={userVotes[pact.id] || pact.userVote}
          onVote={(pactId, vote) =>
            handleVote(pactId, vote as 'believe' | 'doubt')
          }
          onProofUpload={(pactId, uploadedProof) => {
            if (!uploadedProof) return
            setPacts((prev) =>
              prev.map((p) =>
                p.id === pactId
                  ? {
                      ...p,
                      proofClips: [
                        toProofClip(uploadedProof),
                        ...(Array.isArray((p as any).proofClips) ? (p as any).proofClips : []),
                      ],
                    }
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
