'use client'

import React, { useState } from 'react'
import TopNav from '@/components/TopNav'
import PactWizardModal from '@/components/PactWizardModal'
import PactFeed from '@/components/PactFeed'
import StatsBar from '@/components/StatsBar'
import { useAuthStore } from '@/store/auth'

export default function FeedPage() {
  const { user } = useAuthStore()
  const [pactModalOpen, setPactModalOpen] = useState(false)

  // Mock stats - replace with actual data from API
  const stats = [
    { label: 'Active', value: 3, icon: '🔄' },
    { label: 'Circles', value: 5, icon: '👥' },
    { label: 'Streak', value: '14d', icon: '🔥' },
    { label: 'Completed', value: 27, icon: '✓' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onCreatePactClick={() => setPactModalOpen(true)} showCategories={true} />
      
      <div className="max-w-md mx-auto bg-slate-50 pb-20">
        {/* User Greeting */}
        <div className="px-3 sm:px-4 pt-4 sm:pt-6 pb-1 sm:pb-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Hey, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Let&apos;s build accountability today</p>
        </div>

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Pacts Feed Section */}
        <div>
          <PactFeed showMockData={true} />
        </div>
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  )
}
