'use client'

import { Bell, Flame, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import UserAvatarLink from '@/components/UserAvatarLink'
import MemberSearchModal from '@/components/MemberSearchModal'

interface WelcomeHeaderProps {
  userName?: string
  avatarUrl?: string | null
  notificationCount?: number
  onNotificationsClick?: () => void
  onSearch?: () => void
  /** Current streak in days — wraps the avatar in a tier ring and shows a chip once above zero. */
  streak?: number
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean
}

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function dateLabelFor(now: Date) {
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(now)
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(now)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(now)
  return `${weekday}, ${day} ${month}`
}

const iconButton =
  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)] text-[var(--ink)] transition active:scale-95'

export default function WelcomeHeader({
  userName = 'User',
  avatarUrl = null,
  notificationCount = 0,
  onNotificationsClick,
  onSearch,
  streak,
  atRisk = false,
}: WelcomeHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  // Date and greeting depend on the viewer's clock, so they fill in after
  // mount. Rendering them on the server would mismatch on hydration.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])

  const firstName = userName.trim().split(/\s+/)[0] || userName
  const greeting = now ? greetingFor(now.getHours()) : 'Welcome back'

  return (
    <>
      <header className="mx-auto max-w-md px-4 pb-1 pt-5">
        <div className="flex items-center gap-3">
          <UserAvatarLink
            name={userName}
            avatarUrl={avatarUrl}
            href="/profile"
            size={44}
            className="flex-shrink-0"
            streak={streak}
            atRisk={atRisk}
          />
          <div className="min-w-0 flex-1">
            <div className="flex h-[18px] items-center gap-2">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{now ? dateLabelFor(now) : ' '}</p>
              {typeof streak === 'number' && streak > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--navy)] px-2 py-0.5 text-[11px] font-bold text-white">
                  <Flame className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
                  {streak}-day streak
                </span>
              )}
            </div>
            <h1 className="truncate text-[20px] font-extrabold leading-tight tracking-[-0.015em] text-[var(--ink)]">
              {greeting}, {firstName}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true)
                onSearch?.()
              }}
              className={iconButton}
              aria-label="Search"
              data-testid="search-button"
            >
              <Search className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </button>

            <button type="button" onClick={onNotificationsClick} className={iconButton} aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}>
              <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              {notificationCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--paper)] bg-[var(--navy)] px-1 text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <MemberSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
