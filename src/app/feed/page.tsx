'use client'

import BottomNav from '@/components/BottomNav'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { activity } from '@/lib/dashboard-data'

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative mx-auto min-h-screen max-w-md bg-slate-50 pb-28">
        <header className="px-5 pb-1 pt-7">
          <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
          <p className="mt-1 text-sm text-slate-500">
            See what your circles are achieving today
          </p>
        </header>

        <ActivityFeed activity={activity} />
      </div>

      <BottomNav />
    </div>
  )
}
