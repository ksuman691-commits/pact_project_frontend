'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { usePersonalizedFeed } from '@/hooks/useFeedQueries'
import { useInView } from 'react-intersection-observer'
import PactCardV2 from './PactCardV2'
import { useRouter } from 'next/navigation'

interface PactFeedV2Props {
  showMockData?: boolean
  category?: string
  onBusyChange?: (busy: boolean) => void
  onCreatePact?: () => void
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

export default function PactFeedV2({
  showMockData = false,
  category = 'all',
  onBusyChange,
  onCreatePact,
}: PactFeedV2Props) {
  const router = useRouter()
  const [pacts, setPacts] = useState<any[]>([])
  const [userVotes, setUserVotes] = useState<Record<number, string>>({})
  const { ref, inView } = useInView()
  const normalizedCategory = (category || 'all').toLowerCase()

  // Fetch feed data with infinite scroll
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

  // Trigger load more when near bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Use API data when available
  useEffect(() => {
    if (data?.pages) {
      const apiPacts = data.pages.flatMap((page) => page.data)
      // Filter out pacts with >= 4 reports (auto-hidden)
      const filteredPacts = apiPacts.filter((pact: any) => {
        const reportCount = pact.report_count ?? 0
        return reportCount < 4
      })
      if (filteredPacts.length > 0) {
        setPacts(filteredPacts)
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
            className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
          >
            Create Pact
          </button>
        </div>
      ) : (
        <>
          {pacts.map((pact) => (
            <PactCardV2
              key={pact.id}
              pact={pact}
              userVote={userVotes[pact.id] || pact.user_vote}
              onProofUpload={(pactId, uploadedProof) => {
                if (!uploadedProof) return
                setPacts((prev) =>
                  prev.map((p) =>
                    p.id === pactId
                      ? {
                          ...p,
                          proofClips: [
                            uploadedProof,
                            ...(Array.isArray(p.proofClips) ? p.proofClips : []),
                          ],
                        }
                      : p
                  )
                )
              }}
            />
          ))}
          
          {/* Load more trigger */}
          <div ref={ref} className="py-4 text-center">
            {isFetchingNextPage ? (
              <p className="text-slate-600 font-medium">Loading more pacts...</p>
            ) : hasNextPage ? (
              <p className="text-slate-500 text-sm">Scroll for more</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
