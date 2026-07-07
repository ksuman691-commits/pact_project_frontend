'use client'

import React, { useState } from 'react'
import TopNav from '@/components/TopNav'
import PactWizardModal from '@/components/PactWizardModal'
import PactFeed from '@/components/PactFeed'

export default function FeedPage() {
  const [pactModalOpen, setPactModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav onCreatePactClick={() => setPactModalOpen(true)} showCategories={true} />
      
      <div className="max-w-md mx-auto bg-slate-50 pb-20">
        {/* Pacts Feed Section - Main Content */}
        <div className="px-4">
          <header className="pb-6">
            <h2 className="text-2xl font-bold text-slate-900">Feed</h2>
            <p className="mt-1 text-sm text-slate-500">
              See what your circles are achieving
            </p>
          </header>

          <PactFeed showMockData={true} />
        </div>
      </div>

      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  )
}
