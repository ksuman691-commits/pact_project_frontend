'use client'

import Link from 'next/link'
import { Bell, Search, Zap } from 'lucide-react'
import { useState } from 'react'
import LogoMark from '@/components/LogoMark'
import UserAvatarLink from '@/components/UserAvatarLink'
import MemberSearchModal from '@/components/MemberSearchModal'

interface WelcomeHeaderProps {
  userName?: string
  avatarUrl?: string | null
  notificationCount?: number
  onNotificationsClick?: () => void
  onSearch?: () => void
  /** Current streak in days: wraps the avatar in a tier ring. The chip itself now sits in Today. */
  streak?: number
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean
  /** Dares waiting for the viewer's answer. The lightning flickers while there are any. */
  pendingDares?: number
}

const iconButton =
  'cp-hit relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)] text-[var(--ink)] transition active:scale-95'

/**
 * Home's top bar: the CirclePact wordmark (same as the sign-in page) on the
 * left; dares, search, notifications and your profile on the right.
 */
export default function WelcomeHeader({
  userName = 'User',
  avatarUrl = null,
  notificationCount = 0,
  onNotificationsClick,
  onSearch,
  streak,
  atRisk = false,
  pendingDares = 0,
}: WelcomeHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const waiting = pendingDares > 0

  return (
    <>
      <header className="mx-auto max-w-md px-4 pb-1 pt-4" style={{ ['--cp-hit' as string]: '2px' }}>
        <div className="flex items-center gap-1.5">
          <h1 className="m-0 mr-auto flex min-w-0 items-center overflow-hidden">
            <LogoMark size={20} />
          </h1>

          <Link
            href="/dares?tab=for-you"
            aria-label={waiting ? `Dares, ${pendingDares} waiting for you` : 'Dares'}
            className={`cp-hit relative flex h-10 shrink-0 items-center justify-center gap-1 rounded-full bg-[var(--ink)] text-[14px] font-bold text-[var(--dare)] transition active:scale-95 ${waiting ? 'cp-zap-glow pl-2.5 pr-3' : 'w-10'}`}
          >
            <Zap className={`h-[18px] w-[18px] ${waiting ? 'cp-zap' : ''}`} fill="currentColor" strokeWidth={1.6} aria-hidden="true" />
            {waiting && <span aria-hidden="true">{pendingDares > 9 ? '9+' : pendingDares}</span>}
          </Link>

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
            <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
          </button>

          <button type="button" onClick={onNotificationsClick} className={iconButton} aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}>
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
            {notificationCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--paper)] bg-[var(--navy)] px-1 text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <UserAvatarLink name={userName} avatarUrl={avatarUrl} href="/profile" size={38} className="ml-0.5 flex-shrink-0" streak={streak} atRisk={atRisk} />
        </div>
      </header>
      <MemberSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
