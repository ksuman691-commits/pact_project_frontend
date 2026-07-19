'use client'

import Link from 'next/link'
import Image from 'next/image'

interface UserAvatarLinkProps {
  name?: string | null
  avatarUrl?: string | null
  href?: string
  sizeClassName?: string
  textClassName?: string
  className?: string
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
}: UserAvatarLinkProps) {
  const initials = getInitials(name)

  return (
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
}