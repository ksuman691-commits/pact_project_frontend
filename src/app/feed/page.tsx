import { Suspense } from 'react'
import FeedPageClient from './FeedPageClient'

export default function FeedPage() {
  return (
    <Suspense fallback={      <div className="pact-flow min-h-screen" />}>
      <FeedPageClient />
    </Suspense>
  )
}
