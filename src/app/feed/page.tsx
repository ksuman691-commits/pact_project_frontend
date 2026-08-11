import { Suspense } from 'react'
import FeedPageClient from './FeedPageClient'

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F2FB]" />}>
      <FeedPageClient />
    </Suspense>
  )
}
