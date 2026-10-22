'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FeedFilterChips from '@/components/FeedFilterChips'
import TodayCheckInRow from '@/components/TodayCheckInRow'
import WelcomeHeader from '@/components/WelcomeHeader'
import FeaturedDareCard from '@/components/FeaturedDareCard'
import YourCirclesRail from '@/components/YourCirclesRail'
import StoryCirclesRow from '@/components/stories/StoryCirclesRow'
import { useMomentPeople } from '@/hooks/useMomentPeople'
import { STORIES_ENABLED } from '@/lib/stories'
import CreatePactFlowModal from '@/components/create-pact-flow/CreatePactFlowModal'
import PactFeed from '@/components/PactFeed'
import QuickPostButton from '@/components/QuickPostButton'
import PullToRefresh from '@/components/PullToRefresh'
import { useAuthStore } from '@/store/auth'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useUserStats } from '@/hooks/useUserQueries'
import { useCircles } from '@/hooks/useCircles'
import { useAtRiskPact } from '@/hooks/useAtRiskPact'
import { useFeaturedDare } from '@/hooks/useFeaturedDare'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { isProfileNudgeDismissed, isProfileChecklistDismissed } from '@/lib/onboarding'
import ProfileCompletionCard from '@/components/ProfileCompletionCard'
import ProfileNudgeCard from '@/components/ProfileNudgeCard'
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
  const profileCompletion = useProfileCompletion()
  const [nudgeDismissed, setNudgeDismissed] = useState(true)
  const [checklistDismissed, setChecklistDismissed] = useState(true)
  const [pactModalOpen, setPactModalOpen] = useState(false)
  const [feedBusy, setFeedBusy] = useState(false)
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
  const category = (searchParams.get('category') || 'all').toLowerCase()
  const highlightPactId = searchParams.get('created')

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      router.replace('/auth/register')
    }
  }, [isInitialized, user, router])

  // Read the dismissal flag on mount only (client-only localStorage), rather
  // than during render, so this never causes a hydration mismatch.
  useEffect(() => {
    setNudgeDismissed(isProfileNudgeDismissed())
    setChecklistDismissed(isProfileChecklistDismissed())
  }, [])

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
    if (firstLoadRef.current) {
      firstLoadRef.current = false
      return
    }

    const feedAnchor = document.getElementById('pact-feed-list')
    feedAnchor?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [category])

  // Home shows one card between Today and the feed: a profile reminder while
  // one is due, otherwise the dare of the day. Never both.
  const showChecklist = profileCompletion.showChecklist && !checklistDismissed
  const showNudge = !showChecklist && profileCompletion.showSingleNudge && !nudgeDismissed && Boolean(profileCompletion.missingItem)
  const showDare = !showChecklist && !showNudge

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
    <PullToRefresh onRefresh={() => feedRefetchRef.current()} disabled={!isInitialized}>
      <div className="pact-flow pact-page-enter min-h-screen">
        <WelcomeHeader
          userName={user?.full_name || user?.username || ''}
          avatarUrl={user?.avatar_url || null}
          notificationCount={unreadCount}
          onNotificationsClick={handleNotificationsClick}
          streak={currentStreak}
          atRisk={isAtRisk}
        />

        {/* Header -> Moments -> Today -> Dare -> For you. The old "Your record" stats
            block is gone: a row of zeros says nothing to a new user, and the
            streak already shows in the header. Moments lead the page instead. */}
        {isInitialized && user && (
          <div className="max-w-md mx-auto px-4 pb-3 pt-2">
            {STORIES_ENABLED ? (
              <StoryCirclesRow circles={circles} isLoading={circlesLoading} />
            ) : (
              <YourCirclesRail circles={circles} isLoading={circlesLoading} />
            )}
          </div>
        )}

        {isInitialized && user && (
          <div className="max-w-md mx-auto px-4 pb-3">
            <TodayCheckInRow onCreatePact={handleCreatePact} peers={momentPeople.people} />
          </div>
        )}

        {/* Dare of the Day: the same real "featured dare" selection the
            Dares page hero uses (see useFeaturedDare) — reused as-is rather
            than a second, home-feed-specific pick. Renders nothing when
            Discover has no open public dare, same as the Dares page's own
            hero. */}
        {isInitialized && user && featuredDare && showDare && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <FeaturedDareCard dare={featuredDare} />
          </div>
        )}

        {showChecklist && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <ProfileCompletionCard
              percent={profileCompletion.percent}
              checklist={profileCompletion.checklist}
              onDismiss={() => setChecklistDismissed(true)}
            />
          </div>
        )}

        {showNudge && profileCompletion.missingItem && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <ProfileNudgeCard itemId={profileCompletion.missingItem.id} onDismiss={() => setNudgeDismissed(true)} />
          </div>
        )}

        <div className="max-w-md mx-auto px-4 pb-3 pt-1">
          <FeedFilterChips activeCategory={category} disabled={feedBusy} />
        </div>

        {/* pb-28: clearance for the floating pill BottomNav (same convention as
            circles/page.tsx) so the last pact card in the feed isn't covered. */}
        <div className="max-w-md mx-auto pb-28 px-4" id="pact-feed-shell">
          <PactFeed
            showMockData={false}
            category={category}
            onBusyChange={setFeedBusy}
            onCreatePact={handleCreatePact}
            highlightPactId={highlightPactId}
            onRefreshReady={handleRefreshReady}
          />
        </div>

        {isInitialized && user && STORIES_ENABLED && <QuickPostButton onCreatePact={handleCreatePact} />}
        <CreatePactFlowModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
      </div>
    </PullToRefresh>
  )
}
