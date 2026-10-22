'use client'

import { ChevronLeft } from 'lucide-react'
import { RequestsList } from '@/components/requests/RequestsList'
import { useSmartBack } from '@/hooks/useSmartBack'

export default function RequestsPage() {
  const goBack = useSmartBack('/profile')
  return (
    <main className="min-h-screen pb-28" style={{ background: '#F4EFE4', color: '#17181D' }}>
      <div className="mx-auto max-w-md px-4">
        <div className="flex items-center pt-3">
          <button type="button" onClick={goBack} aria-label="Go back" className="-ml-2 flex size-11 items-center justify-center" style={{ color: '#17181D' }}>
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: '#17181D' }}>
            Requests
          </h1>
        </div>
        <RequestsList />
      </div>
    </main>
  )
}
