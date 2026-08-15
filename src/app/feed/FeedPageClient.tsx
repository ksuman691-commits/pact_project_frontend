'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopNav from '@/components/TopNav'
import WelcomeHeader from '@/components/WelcomeHeader'
import CreatePactFlowModal from '@/components/create-pact-flow/CreatePactFlowModal'
import PactFeed from '@/components/PactFeed'
import MemberSearchModal from '@/components/MemberSearchModal'
import { useAuthStore } from '@/store/auth'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useUserStats } from '@/hooks/useUserQueries'
import { useAtRiskPact } from '@/hooks/useAtRiskPact'
import toast from 'react-hot-toast'

export default function FeedPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isInitialized } = useAuthStore()
  const { data: unreadCountData } = useUnreadNotificationCount()
  const { data: userStatsData } = useUserStats(user?.id || 0)
  const currentStreak = userStatsData?.data?.current_streak ?? 0
  const isAtRisk = useAtRiskPact(user?.id)
  const [pactModalOpen, setPactModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [feedBusy, setFeedBusy] = useState(false)
  const firstLoadRef = useRef(true)
  const unreadCount = unreadCountData?.unread_count ?? 0
  const category = (searchParams.get('category') || 'all').toLowerCase()
  const highlightPactId = searchParams.get('created')

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

  const handleCreateDare = () => {
    router.push('/dares')
  }

  return (
    <div className="pact-flow pact-page-enter min-h-screen">
      <WelcomeHeader
        userName={user?.full_name || 'Test User'}
        avatarUrl={user?.avatar_url || null}
        notificationCount={unreadCount}
        onNotificationsClick={handleNotificationsClick}
        onCreatePact={handleCreatePact}
        onCreateDare={handleCreateDare}
        onSearch={() => setSearchModalOpen(true)}
        actionsDisabled={!isInitialized}
        streak={currentStreak}
        atRisk={isAtRisk}
      />

      <TopNav
        showCategories={true}
        fixed={false}
        compact={true}
        isLoadingCategories={feedBusy}
        activeCategory={category}
      />

      <div className="max-w-md mx-auto pb-20 px-4" id="pact-feed-shell">
        <PactFeed
          showMockData={false}
          category={category}
          onBusyChange={setFeedBusy}
          onCreatePact={handleCreatePact}
          highlightPactId={highlightPactId}
        />
      </div>

      <CreatePactFlowModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
      <MemberSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  )
}
