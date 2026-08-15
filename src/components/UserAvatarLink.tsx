'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'

interface UserAvatarLinkProps {
  name?: string | null
  avatarUrl?: string | null
  href?: string
  /** Avatar diameter in px. Defaults to 48 (roughly the old "w-12 h-12"). */
  size?: number
  className?: string
  /** Current streak in days. When provided, wraps the avatar in the animated ring with a streak-vs-30-day progress arc. */
  streak?: number
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean
}

export default function UserAvatarLink({
  name,
  avatarUrl,
  href = '/profile',
  size = 48,
  className = '',
  streak,
  atRisk = false,
}: UserAvatarLinkProps) {
  const ring = typeof streak === 'number' ? { percent: Math.min(100, (streak / 30) * 100), atRisk } : undefined

  return (
    <Link
      href={href}
      aria-label="Open profile"
      className={`inline-flex rounded-full transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer ${className}`.trim()}
    >
      <Avatar name={name} avatarUrl={avatarUrl} size={size} ring={ring} />
    </Link>
  )
}
