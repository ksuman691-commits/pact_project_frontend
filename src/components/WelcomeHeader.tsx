'use client'

import { Bell, Plus, Search } from 'lucide-react'
import UserAvatarLink from '@/components/UserAvatarLink'

interface WelcomeHeaderProps {
  userName?: string
  avatarUrl?: string | null
  notificationCount?: number
  onNotificationsClick?: () => void
  onCreatePact?: () => void
  onSearch?: () => void
}

export default function WelcomeHeader({
  userName = 'User',
  avatarUrl = null,
  notificationCount = 3,
  onNotificationsClick,
  onCreatePact,
  onSearch
}: WelcomeHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-md mx-auto px-4 pt-4 pb-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-4 py-5 sm:py-6 flex items-center justify-between gap-4">
        {/* Left: Avatar + Text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UserAvatarLink
            name={userName}
            avatarUrl={avatarUrl}
            href="/profile"
            sizeClassName="w-12 h-12"
            textClassName="text-sm"
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Welcome back</p>
            <p className="text-lg font-bold text-slate-900 truncate">{userName}</p>
          </div>
        </div>

        {/* Right: Icons + Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Search */}
          <button
            onClick={onSearch}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Notification bell */}
          <button
            onClick={onNotificationsClick}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Create Pact button */}
          <button
            onClick={onCreatePact}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            New Pact
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
