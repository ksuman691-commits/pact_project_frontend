'use client'

import { useState } from 'react'
import CirclePact from '@/components/CirclePactApp'
import WelcomeHeader from '@/components/WelcomeHeader'
import StatsBar from '@/components/StatsBar'
import TopNav from '@/components/TopNav'
import PactWizardModal from '@/components/PactWizardModal'
import { useAuthStore } from '@/store/auth'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [pactModalOpen, setPactModalOpen] = useState(false)

  // Stats data
  const stats = [
    { label: 'Active', value: 2, icon: '🔄' },
    { label: 'Circles', value: 3, icon: '👥' },
    { label: 'Streak', value: '14d', icon: '🔥' },
    { label: 'Done', value: 27, icon: '✓' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onCreatePactClick={() => setPactModalOpen(true)} showCategories={true} />
      
      {/* Welcome Header */}
      <WelcomeHeader 
        userName={user?.full_name || 'Test User'}
        notificationCount={3}
        onCreatePact={() => setPactModalOpen(true)}
      />

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Main Content */}
      <div className="relative mx-auto min-h-screen max-w-md bg-slate-50">
        <CirclePact />
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  )
}
