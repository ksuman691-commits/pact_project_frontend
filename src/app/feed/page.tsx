'use client'

import React, { useState } from 'react'
import TopNav from '@/components/TopNav'
import WelcomeHeader from '@/components/WelcomeHeader'
import PactWizardModal from '@/components/PactWizardModal'
import PactFeed from '@/components/PactFeed'
import StatsBar from '@/components/StatsBar'
import { useAuthStore } from '@/store/auth'

export default function FeedPage() {
  const { user } = useAuthStore()
  const [pactModalOpen, setPactModalOpen] = useState(false)

  // Mock stats - replace with actual data from API
  const stats = [
    { label: 'Active', value: 2, icon: '🔄' },
    { label: 'Circles', value: 3, icon: '👥' },
    { label: 'Streak', value: '14d', icon: '🔥' },
    { label: 'Done', value: 27, icon: '✓' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onCreatePactClick={() => setPactModalOpen(true)} showCategories={true} />
      
      {/* Welcome Header with avatar, greeting, notifications, and New Pact button */}
      <WelcomeHeader 
        userName={user?.full_name || 'Test User'}
        notificationCount={3}
        onCreatePact={() => setPactModalOpen(true)}
      />

      <div className="max-w-md mx-auto bg-slate-50 pb-20">
        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Pacts Feed Section */}
        <PactFeed showMockData={true} />
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  )
}
