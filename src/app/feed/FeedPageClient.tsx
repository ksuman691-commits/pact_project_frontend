'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, X } from 'lucide-react'
import TodayCheckInRow from '@/components/TodayCheckInRow'
import WelcomeHeader from '@/components/WelcomeHeader'
import FeaturedDareCard from '@/components/FeaturedDareCard'
import YourCirclesRail from '@/components/YourCirclesRail'
import StoryCirclesRow from '@/components/stories/StoryCirclesRow'
import { useMomentPeople } from '@/hooks/useMomentPeople'
import { STORIES_ENABLED } from '@/lib/stories'
import CreatePactFlowModal from '@/components/create-pact-flow/CreatePactFlowModal'
import PactFeed from '@/components/PactFeed'
import { APP_REFRESH_EVENT } from '@/components/AppPullToRefresh'
import { useAuthStore } from '@/store/auth'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useUserStats } from '@/hooks/useUserQueries'
import { useCircles } from '@/hooks/useCircles'
import { useAtRiskPact } from '@/hooks/useAtRiskPact'
import { useFeaturedDare } from '@/hooks/useFeaturedDare'
import { usePendingDareCount } from '@/hooks/usePendingDareCount'
import toast from 'react-hot-toast'

export default function FeedPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isInitialized } = useAuthStore()
  const { data: unreadCountData } = useUnreadNotificationCount()
  const { data: userStatsData } = useUserStats(user?.id || 0)
  const currentStreak = userStatsData?.data?.current_streak ?? 0
  const { data: circlesData, isLoading: circlesLoading } = useCircles()
  const circles = (circlesData || []) as Array<{ id: number; name: string; photo_url?: string | null; emoji?: string | null; icon_emoji?: string | null; member_count?: number; stories_today_count?: number | null }>
  const momentPeople = useMomentPeople(circles, user?.id)
  const isAtRisk = useAtRiskPact(user?.id)
  const { featuredDare } = useFeaturedDare()
  const pendingDares = usePendingDareCount()
  const [pactModalOpen, setPactModalOpen] = useState(false)
  const [, setFeedBusy] = useState(false)
  const firstLoadRef = useRef(true)
  // PullToRefresh needs to wrap the *whole* scrollable page (header + nav +
  // feed) so a pull starting anywhere on screen while scrolled to the top is
  // caught — not just one starting inside PactFeed's own markup, which sits
  // below ~250px of header/nav on a typical phone screen. PactFeed still owns
  // the actual data fetching, so it hands its `refetch` up through this ref
  // each time the query identity changes.
  const feedRefetchRef = useRef<() => Promise<unknown>>(async () => {})
  const handleRefreshReady = useCallback((refetch: () => Promise<unknown>) => {
    feedRefetchRef.current = refetch
  }, [])
  const unreadCount = unreadCountData?.unread_count ?? 0
  // The app-wide pull to refresh re-asks every query on screen; the feed list hands its own refetch up, so run that too.
  useEffect(() => {
    const refresh = () => void feedRefetchRef.current()
    window.addEventListener(APP_REFRESH_EVENT, refresh)
    return () => window.removeEventListener(APP_REFRESH_EVENT, refresh)
  }, [])
  const category = (searchParams.get('category') || 'all').toLowerCase()
  const highlightPactId = searchParams.get('created')
  // /feed?paid=1 (from "Browse The Feed" on the Watching tab): only pacts you can pay to watch.
  const paidOnly = searchParams.get('paid') === '1'

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      router.replace('/auth/register')
    }
  }, [isInitialized, user, router])

  // "Back to Feed" on the create-pact success screen pushes /feed?created=id.
  // When the modal was opened from this same page (Feed's own "New Pact"
  // button), that's a shallow same-route navigation, so pactModalOpen would
  // otherwise stay true and the modal would linger open over the feed.
  useEffect(() => {
    if (highlightPactId) setPactModalOpen(false)
  }, [highlightPactId])

  // Clear the `created` param from the URL once the glow has had a chance to
  // play, so a later refresh of /feed doesn't keep re-highlighting the pact.
  useEffect(() => {
    if (!highlightPactId) return
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('created')
      const query = params.toString()
      router.replace(query ? `/feed?${query}` : '/feed')
    }, 1600)
    return () => clearTimeout(timeout)
  }, [highlightPactId, router, searchParams])

  useEffect(() => {
    // Landing here from Browse The Feed should open on the list, not on Home's header.
    if (firstLoadRef.current) {
      firstLoadRef.current = false
      if (!paidOnly) return
    }

    const feedAnchor = document.getElementById('pact-feed-list')
    feedAnchor?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [category, paidOnly])


  const handleCreatePact = () => {
    if (!user) {
      toast.error('Please login to create a pact')
      router.push('/auth/login')
      return
    }
    setPactModalOpen(true)
  }

  const handleNotificationsClick = () => {
    router.push('/notifications')
  }

  return (
    <>
      <div className="pact-flow pact-page-enter min-h-screen">
        <WelcomeHeader
          userName={user?.full_name || user?.username || ''}
          avatarUrl={user?.avatar_url || null}
          notificationCount={unreadCount}
          onNotificationsClick={handleNotificationsClick}
          streak={currentStreak}
          atRisk={isAtRisk}
          pendingDares={pendingDares}
        />

        {/* Header -> Moments -> Today -> feed. The "For you" chips are gone and
            the camera lives in the bottom nav. Moments hide themselves when
            nobody else has posted today. */}
        {isInitialized && user && (
          <div className="max-w-md mx-auto px-4">
            {STORIES_ENABLED ? (
              <StoryCirclesRow circles={circles} isLoading={circlesLoading} />
            ) : (
              <YourCirclesRail circles={circles} isLoading={circlesLoading} />
            )}
          </div>
        )}

        {isInitialized && user && (
          <div className="max-w-md mx-auto px-4 pb-3 pt-3">
            <TodayCheckInRow onCreatePact={handleCreatePact} peers={momentPeople.people} streak={currentStreak} />
          </div>
        )}

        {/* Dare of the Day: the same real "featured dare" selection the
            Dares page hero uses (see useFeaturedDare) — reused as-is rather
            than a second, home-feed-specific pick. Renders nothing when
            Discover has no open public dare, same as the Dares page's own
            hero. */}
        {isInitialized && user && featuredDare && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <FeaturedDareCard dare={featuredDare} />
            <nav aria-label="Dares" className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
              <Link href="/dares?tab=for-you" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--ink)] px-3 text-[13px] font-bold text-white">
                For you
                {pendingDares > 0 && <span className="rounded-full bg-[var(--dare)] px-1.5 text-[11px] leading-[18px] text-[var(--ink)]">{pendingDares > 9 ? '9+' : pendingDares}</span>}
              </Link>
              <Link href="/dares?tab=sent" className="flex h-9 shrink-0 items-center rounded-full border border-[var(--hairline)] bg-[var(--card)] px-3 text-[13px] font-bold text-[var(--ink)]">
                Sent
              </Link>
              <Link href="/dares?tab=discover" className="flex h-9 shrink-0 items-center rounded-full border border-[var(--hairline)] bg-[var(--card)] px-3 text-[13px] font-bold text-[var(--ink)]">
                Discover
              </Link>
            </nav>
          </div>
        )}

        {/* pb-28: clearance for the floating pill BottomNav (same convention as
            circles/page.tsx) so the last pact card in the feed isn't covered. */}
        <div className="max-w-md mx-auto pb-28 px-4" id="pact-feed-shell">
          {paidOnly && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--card)] px-4 py-3">
              <p className="flex min-w-0 items-center gap-2 text-[14px] font-extrabold text-[var(--ink)]">
                <Lock className="size-4 shrink-0 text-[var(--navy)]" strokeWidth={2.4} aria-hidden="true" />
                <span className="truncate">Pay to watch</span>
              </p>
              <button
                type="button"
                onClick={() => router.replace(category === 'all' ? '/feed' : `/feed?category=${encodeURIComponent(category)}`)}
                className="flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-extrabold text-[var(--navy)]"
              >
                Show all <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          )}
          <PactFeed
            showMockData={false}
            category={category}
            paidOnly={paidOnly}
            onBusyChange={setFeedBusy}
            onCreatePact={handleCreatePact}
            highlightPactId={highlightPactId}
            onRefreshReady={handleRefreshReady}
          />
        </div>

        <CreatePactFlowModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
      </div>
    </>
  )
}
