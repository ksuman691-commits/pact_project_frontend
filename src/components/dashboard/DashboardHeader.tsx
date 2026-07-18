'use client'

import { Bell } from 'lucide-react'
import UserAvatarLink from '@/components/UserAvatarLink'

export default function DashboardHeader({
  name,
  initials,
  avatarUrl,
  notifications = 0,
}: {
  name: string
  initials: string
  avatarUrl?: string | null
  notifications?: number
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-6">
      <div className="flex items-center gap-3">
        <UserAvatarLink
          name={name || initials}
          avatarUrl={avatarUrl}
          href="/profile"
          sizeClassName="h-11 w-11"
          textClassName="text-sm"
          className="bg-emerald-600"
        />
        <div>
          <p className="text-xs text-slate-500">Welcome back</p>
          <h1 className="text-lg font-bold leading-tight text-slate-900">{name}</h1>
        </div>
      </div>

      <button
        aria-label={`Notifications${notifications ? `, ${notifications} unread` : ''}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Bell className="h-5 w-5" />
        {notifications > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {notifications}
          </span>
        )}
      </button>
    </header>
  )
}
