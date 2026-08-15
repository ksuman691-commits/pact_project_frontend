'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'

interface UserAvatarLinkProps {
  name?: string | null
  avatarUrl?: string | null
  /**
   * The other user's username — resolves to `/profile/[username]`. Ignored
   * if `href` is passed explicitly. Omit for the signed-in user's own
   * avatar, which falls back to `/profile`.
   */
  username?: string | null
  href?: string
  /** Avatar diameter in px. Defaults to 48 (roughly the old "w-12 h-12"). */
  size?: number
  className?: string
  /** Current streak in days. When provided, wraps the avatar in the animated ring with a streak-vs-30-day progress arc. */
  streak?: number
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean
  /**
   * Set when this avatar sits inside another clickable element (a card,
   * list row, etc.) so tapping the avatar opens the profile instead of
   * whatever the surrounding element does.
   */
  stopPropagation?: boolean
}

export default function UserAvatarLink({
  name,
  avatarUrl,
  username,
  href,
  size = 48,
  className = '',
  streak,
  atRisk = false,
  stopPropagation = false,
}: UserAvatarLinkProps) {
  const ring = typeof streak === 'number' ? { percent: Math.min(100, (streak / 30) * 100), atRisk } : undefined
  const resolvedHref = href || (username ? `/profile/${username}` : '/profile')

  return (
    <Link
      href={resolvedHref}
      aria-label={username ? `Open @${username}'s profile` : 'Open profile'}
      onClick={stopPropagation ? (event) => event.stopPropagation() : undefined}
      className={`inline-flex rounded-full transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer ${className}`.trim()}
    >
      <Avatar name={name} avatarUrl={avatarUrl} size={size} ring={ring} />
    </Link>
  )
}
