'use client'

import Link from 'next/link'
import Image from 'next/image'
import StreakAvatarRing from '@/components/StreakAvatarRing'

interface UserAvatarLinkProps {
  name?: string | null
  avatarUrl?: string | null
  href?: string
  sizeClassName?: string
  textClassName?: string
  className?: string
  /** Current streak in days. When provided, wraps the avatar in a tier ring. */
  streak?: number
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean
  showStreakBadge?: boolean
}

function getInitials(name?: string | null) {
  const safeName = (name || 'User').trim()
  if (!safeName) return 'U'

  return safeName
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function UserAvatarLink({
  name,
  avatarUrl,
  href = '/profile',
  sizeClassName = 'w-12 h-12',
  textClassName = 'text-sm',
  className = '',
  streak,
  atRisk = false,
  showStreakBadge = true,
}: UserAvatarLinkProps) {
  const initials = getInitials(name)

  const avatarLink = (
    <Link
      href={href}
      aria-label="Open profile"
      className={`relative overflow-hidden rounded-full bg-slate-900 text-white flex items-center justify-center font-bold transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer ${sizeClassName} ${textClassName} ${className}`.trim()}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name || 'Profile'}
          fill
          sizes="48px"
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </Link>
  )

  if (typeof streak !== 'number') {
    return avatarLink
  }

  return (
    <StreakAvatarRing streak={streak} atRisk={atRisk} showBadge={showStreakBadge}>
      {avatarLink}
    </StreakAvatarRing>
  )
}
