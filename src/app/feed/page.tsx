import { Suspense } from 'react'
import FeedPageClient from './FeedPageClient'

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <FeedPageClient />
    </Suspense>
  )
}
