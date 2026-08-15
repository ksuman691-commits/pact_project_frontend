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
  actionsDisabled?: boolean
  /** Current streak in days — wraps the avatar in a tier ring when provided. */
  streak?: number
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean
}

export default function WelcomeHeader({
  userName = 'User',
  avatarUrl = null,
  notificationCount = 3,
  onNotificationsClick,
  onCreatePact,
  onCreateDare,
  onSearch,
  actionsDisabled = false,
  streak,
  atRisk = false
}: WelcomeHeaderProps) {
  return (
    <div className="border-b border-[var(--pact-hairline)]">
      <div className="mx-auto max-w-md px-4 pb-4 pt-4">
        <div className="pact-card flex items-center justify-between gap-4 rounded-[28px] px-4 py-5 sm:py-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatarLink
              name={userName}
              avatarUrl={avatarUrl}
              href="/profile"
              size={48}
              className="flex-shrink-0"
              streak={streak}
              atRisk={atRisk}
            />
            <div className="min-w-0">
              <p className="pact-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--pact-text-faint)]">Welcome back</p>
              <p className="truncate text-lg font-bold text-[var(--pact-text)]">{userName}</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={onSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pact-surface-2)] text-[var(--pact-text-dim)] transition hover:bg-[var(--pact-surface-3)] hover:text-[var(--pact-text)]"
              aria-label="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <button
              onClick={onNotificationsClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pact-surface-2)] text-[var(--pact-text-dim)] transition hover:bg-[var(--pact-surface-3)] hover:text-[var(--pact-text)]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pact-pink)] text-[10px] font-bold text-[var(--pact-bg)]">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onCreatePact}
            disabled={actionsDisabled}
            className="pact-btn-glow flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            New Pact
          </button>
          <button
            onClick={onCreateDare}
            disabled={actionsDisabled}
            className="pact-btn-glow flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: 'var(--pact-violet)', background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
            New Dare
          </button>
        </div>
      </div>
    </div>
  )
}
