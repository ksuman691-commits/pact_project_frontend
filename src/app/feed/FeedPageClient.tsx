'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopNav from '@/components/TopNav'
import WelcomeHeader from '@/components/WelcomeHeader'
import CreatePactFlowModal from '@/components/create-pact-flow/CreatePactFlowModal'
import PactFeed from '@/components/PactFeed'
import PullToRefresh from '@/components/PullToRefresh'
import { useAuthStore } from '@/store/auth'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useUserStats } from '@/hooks/useUserQueries'
import { useAtRiskPact } from '@/hooks/useAtRiskPact'
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
  const isAtRisk = useAtRiskPact(user?.id)
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

  const handleNavigateCircles = () => {
    router.push('/circles')
  }

  return (
    <PullToRefresh onRefresh={() => feedRefetchRef.current()} disabled={!isInitialized}>
      <div className="pact-flow pact-page-enter min-h-screen">
        <WelcomeHeader
          userName={user?.full_name || 'Test User'}
          avatarUrl={user?.avatar_url || null}
          notificationCount={unreadCount}
          onNotificationsClick={handleNotificationsClick}
          onCreatePact={handleCreatePact}
          onNavigateCircles={handleNavigateCircles}
          streak={currentStreak}
          atRisk={isAtRisk}
        />

        {profileCompletion.showChecklist && !checklistDismissed && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <ProfileCompletionCard
              percent={profileCompletion.percent}
              checklist={profileCompletion.checklist}
              onDismiss={() => setChecklistDismissed(true)}
            />
          </div>
        )}

        {profileCompletion.showSingleNudge && !nudgeDismissed && profileCompletion.missingItem && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <ProfileNudgeCard itemId={profileCompletion.missingItem.id} onDismiss={() => setNudgeDismissed(true)} />
          </div>
        )}

        <TopNav
          showCategories={true}
          fixed={false}
          compact={true}
          isLoadingCategories={feedBusy}
          activeCategory={category}
        />

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

        <CreatePactFlowModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
      </div>
    </PullToRefresh>
  )
}
