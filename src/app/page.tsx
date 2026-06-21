'use client'

import { useAuthStore } from '@/store/auth'
import BottomNav from '@/components/BottomNav'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StreakCard from '@/components/dashboard/StreakCard'
import StatsRow from '@/components/dashboard/StatsRow'
import GoalProgress from '@/components/dashboard/GoalProgress'
import PactAnnouncements from '@/components/dashboard/PactAnnouncements'
import CirclesStrip from '@/components/dashboard/CirclesStrip'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import {
  currentUser,
  stats,
  goals,
  circles,
  announcements,
  activity,
} from '@/lib/dashboard-data'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  const name = user?.full_name?.split(' ')[0] || currentUser.name
  const initials =
    user?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || currentUser.initials
  const reputation = user?.reputation_score
    ? Math.round(user.reputation_score)
    : currentUser.reputation

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative mx-auto min-h-screen max-w-md bg-slate-50 pb-28">
        <DashboardHeader
          name={name}
          initials={initials}
          notifications={announcements.length}
        />

        <StreakCard streak={currentUser.streak} week={currentUser.week} />

        <StatsRow
          activePacts={stats.activePacts}
          circles={stats.circles}
          completed={stats.completed}
          reputation={reputation}
        />

        <PactAnnouncements announcements={announcements} />

        <GoalProgress goals={goals} />

        <CirclesStrip circles={circles} />

        <ActivityFeed activity={activity} />
      </div>

      <BottomNav />
    </div>
  )
}
