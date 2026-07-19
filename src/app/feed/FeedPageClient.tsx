'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopNav from '@/components/TopNav'
import WelcomeHeader from '@/components/WelcomeHeader'
import PactWizardModal from '@/components/PactWizardModal'
import PactFeedV2 from '@/components/PactFeedV2'
import MemberSearchModal from '@/components/MemberSearchModal'
import { useAuthStore } from '@/store/auth'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'

export default function FeedPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isInitialized } = useAuthStore()
  const { data: unreadCountData } = useUnreadNotificationCount()
  const [pactModalOpen, setPactModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [feedBusy, setFeedBusy] = useState(false)
  const firstLoadRef = useRef(true)
  const unreadCount = unreadCountData?.unread_count ?? 0
  const category = (searchParams.get('category') || 'all').toLowerCase()

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      router.replace('/auth/register')
    }
  }, [isInitialized, user, router])

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

  return (
    <div className="min-h-screen bg-slate-50">
      <WelcomeHeader
        userName={user?.full_name || 'Test User'}
        avatarUrl={user?.avatar_url || null}
        notificationCount={unreadCount}
        onNotificationsClick={handleNotificationsClick}
        onCreatePact={handleCreatePact}
        onSearch={() => setSearchModalOpen(true)}
      />

      <TopNav
        showCategories={true}
        fixed={false}
        compact={true}
        isLoadingCategories={feedBusy}
        activeCategory={category}
      />

      <div className="max-w-md mx-auto bg-slate-50 pb-20 px-4" id="pact-feed-shell">
        <PactFeedV2
          showMockData={false}
          category={category}
          onBusyChange={setFeedBusy}
          onCreatePact={handleCreatePact}
        />
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
      <MemberSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  )
}
