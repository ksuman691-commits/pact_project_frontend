'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import TopNav from '@/components/TopNav'
import WelcomeHeader from '@/components/WelcomeHeader'
import PactWizardModal from '@/components/PactWizardModal'
import PactFeed from '@/components/PactFeed'
import MemberSearchModal from '@/components/MemberSearchModal'
import { useAuthStore } from '@/store/auth'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'

export default function FeedPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()
  const { data: unreadCountData } = useUnreadNotificationCount()
  const [pactModalOpen, setPactModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const unreadCount = unreadCountData?.unread_count ?? 0

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      router.replace('/auth/register')
    }
  }, [isInitialized, user, router])

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
      {/* Welcome Header with avatar, greeting, notifications, and New Pact button */}
      <WelcomeHeader 
        userName={user?.full_name || 'Test User'}
        avatarUrl={user?.avatar_url || null}
        notificationCount={unreadCount}
        onNotificationsClick={handleNotificationsClick}
        onCreatePact={handleCreatePact}
        onSearch={() => setSearchModalOpen(true)}
      />

      {/* Category strip below welcome panel */}
      <TopNav showCategories={true} fixed={false} compact={true} />

      {/* Pacts Feed Section */}
      <div className="max-w-md mx-auto bg-slate-50 pb-20 px-4">
        <PactFeed showMockData={false} />
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
      <MemberSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  )
}
