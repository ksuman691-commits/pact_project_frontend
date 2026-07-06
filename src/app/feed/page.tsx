'use client'

import React, { useState } from 'react'
import TopNav from '@/components/TopNav'
import PactWizardModal from '@/components/PactWizardModal'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import WalletDisplay from '@/components/premium/WalletDisplay'
import StreakDisplay from '@/components/premium/StreakDisplay'
import { activity } from '@/lib/dashboard-data'
import { useAuthStore } from '@/store/auth'

export default function FeedPage() {
  const { user } = useAuthStore()
  const [pactModalOpen, setPactModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onCreatePactClick={() => setPactModalOpen(true)} showCategories={true} />
      
      <div className="relative mx-auto max-w-md bg-slate-50 pt-32 pb-4">
        {/* User Greeting */}
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-black text-slate-900">
            Hey, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">Let's build accountability today</p>
        </div>

        {/* Wallet Section */}
        <div className="px-4 mb-6">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Your Wallet
          </h2>
          <WalletDisplay />
        </div>

        {/* Streak Section */}
        <div className="px-4 mb-8">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Daily Momentum
          </h2>
          <StreakDisplay
            streak={14}
            todayComplete={false}
            onUploadProof={() => {}}
          />
        </div>

        {/* Activity Section */}
        <div className="border-t border-slate-200 pt-6">
          <header className="px-4 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              See what your circles are achieving today
            </p>
          </header>

          <ActivityFeed activity={activity} />
        </div>
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  )
}
