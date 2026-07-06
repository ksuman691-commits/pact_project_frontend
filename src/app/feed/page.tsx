'use client'

import TopNav from '@/components/TopNav'
import PactWizardModal from '@/components/PactWizardModal'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { activity } from '@/lib/dashboard-data'
import { useState } from 'react'

export default function FeedPage() {
  const [pactModalOpen, setPactModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onCreatePactClick={() => setPactModalOpen(true)} />
      
      <div className="relative mx-auto max-w-md bg-slate-50">
        <header className="px-5 pb-1 pt-2">
          <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
          <p className="mt-1 text-sm text-slate-500">
            See what your circles are achieving today
          </p>
        </header>

        <ActivityFeed activity={activity} />
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  )
}
