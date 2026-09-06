'use client'

import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import UserAvatarLink from '@/components/UserAvatarLink'
import MemberSearchModal from '@/components/MemberSearchModal'

interface WelcomeHeaderProps {
  userName?: string
  avatarUrl?: string | null
  notificationCount?: number
  onNotificationsClick?: () => void
  onSearch?: () => void
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
  onSearch,
  streak,
  atRisk = false
}: WelcomeHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
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
              type="button"
              onClick={() => {
                setSearchOpen(true)
                onSearch?.()
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pact-surface-2)] text-[var(--pact-text-dim)] transition hover:bg-[var(--pact-surface-3)] hover:text-[var(--pact-text)]"
              aria-label="Search"
              data-testid="search-button"
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
      </div>
    </div>
    <MemberSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
