'use client'

import { User, Bell, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WelcomeHeaderProps {
  userName?: string
  notificationCount?: number
  onCreatePact?: () => void
}

export default function WelcomeHeader({
  userName = 'User',
  notificationCount = 3,
  onCreatePact
}: WelcomeHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between gap-3">
        {/* Left: Avatar + Text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Welcome back</p>
            <p className="text-lg font-bold text-slate-900 truncate">{userName}</p>
          </div>
        </div>

        {/* Right: Icons + Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Profile icon */}
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
            aria-label="Profile"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Notification bell */}
          <button
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Create Pact button */}
          <button
            onClick={onCreatePact}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm flex items-center gap-2 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Pact
          </button>
        </div>
      </div>
    </div>
  )
}
