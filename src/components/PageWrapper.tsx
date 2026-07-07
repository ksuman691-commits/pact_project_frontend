'use client'

import TopNav from '@/components/TopNav'
import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  showBack?: boolean
  showCategories?: boolean
  onCreatePactClick?: () => void
}

export default function PageWrapper({
  children,
  showBack = false,
  showCategories = true,
  onCreatePactClick,
}: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav
        showBack={showBack}
        showCategories={showCategories}
        onCreatePactClick={onCreatePactClick}
      />
      <div className="mx-auto max-w-md bg-white min-h-screen">
        {children}
      </div>
    </div>
  )
}
