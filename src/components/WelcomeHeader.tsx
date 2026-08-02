'use client'

import { Bell, Plus, Search, Sparkles } from 'lucide-react'
import UserAvatarLink from '@/components/UserAvatarLink'

interface WelcomeHeaderProps {
  userName?: string
  avatarUrl?: string | null
  notificationCount?: number
  onNotificationsClick?: () => void
  onCreatePact?: () => void
  onCreateDare?: () => void
  onSearch?: () => void
}

export default function WelcomeHeader({
  userName = 'User',
  avatarUrl = null,
  notificationCount = 3,
  onNotificationsClick,
  onCreatePact,
  onCreateDare,
  onSearch
}: WelcomeHeaderProps) {
  return (
    <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60">
      <div className="mx-auto max-w-md px-4 pb-4 pt-4">
        <div className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:py-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatarLink
              name={userName}
              avatarUrl={avatarUrl}
              href="/profile"
              sizeClassName="w-12 h-12"
              textClassName="text-sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Welcome back</p>
              <p className="truncate text-lg font-bold text-slate-900">{userName}</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={onSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <button
              onClick={onNotificationsClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onCreatePact}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            New Pact
          </button>
          <button
            onClick={onCreateDare}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
            New Dare
          </button>
        </div>
      </div>
    </div>
  )
}
