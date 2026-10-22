'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const CARD = '#FBF8F1'

export interface ProfileHeaderProps {
  name: string
  username?: string | null
  avatarUrl?: string | null
  bio?: string | null
  followers?: number
  following?: number
  /** The CP Score card, between the name and the buttons. */
  score?: ReactNode
  /** Navy ring around the photo when they posted a moment today. */
  hasMoment?: boolean
  onViewMoment?: () => void
  onFollowersClick?: () => void
  onFollowingClick?: () => void
  isOwn?: boolean
  /** Buttons row: Follow / Tip / Add to circle, or Edit / Share. */
  actions?: ReactNode
  /** Extra line under the actions (supporters, shared circle). */
  footer?: ReactNode
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * The top of every profile, own or someone else's: photo, name, bio, the
 * follow counts, the CP Score card and the buttons. Nothing else.
 */
export default function ProfileHeader({
  name,
  username,
  avatarUrl,
  bio,
  followers = 0,
  following = 0,
  score,
  hasMoment = false,
  onViewMoment,
  onFollowersClick,
  onFollowingClick,
  isOwn = false,
  actions,
  footer,
}: ProfileHeaderProps) {
  const ringStyle = hasMoment
    ? { border: `3px solid ${NAVY}`, padding: 3 }
    : { border: '3px solid transparent', padding: 3 }

  const avatar = (
    <span className="block size-[80px] shrink-0 rounded-full" style={{ ...ringStyle, boxSizing: 'border-box' }}>
      <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full text-[26px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
        {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="80px" className="object-cover" /> : initials(name) || '?'}
      </span>
    </span>
  )

  return (
    <section className="px-4 pt-1">
      <div className="flex items-center gap-4">
        {hasMoment && onViewMoment ? (
          <button type="button" onClick={onViewMoment} aria-label={`Watch ${isOwn ? 'your' : `${name}'s`} moment`} className="rounded-full">
            {avatar}
          </button>
        ) : (
          avatar
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[23px] font-extrabold leading-tight tracking-[-0.025em]" style={{ color: INK }}>{name}</div>
          {bio ? (
            <div className="mt-0.5 line-clamp-3 whitespace-pre-line text-[14px] leading-snug" style={{ color: MUTED }}>{bio}</div>
          ) : isOwn ? (
            <Link href="/profile/edit#bio" className="mt-0.5 inline-block text-[14px] font-bold" style={{ color: NAVY }}>
              Add a bio
            </Link>
          ) : null}
          <div className="mt-1.5 flex items-center gap-1 text-[13.5px]" style={{ color: MUTED }}>
            <button type="button" onClick={onFollowersClick} className="hover:underline">
              <span className="font-extrabold" style={{ color: INK }}>{followers.toLocaleString('en-IN')}</span> {followers === 1 ? 'follower' : 'followers'}
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={onFollowingClick} className="hover:underline">
              <span className="font-extrabold" style={{ color: INK }}>{following.toLocaleString('en-IN')}</span> following
            </button>
          </div>
        </div>
      </div>

      {score}
      {actions && <div className="mt-3.5 flex gap-2">{actions}</div>}
      {footer && <div className="mt-3 flex flex-col gap-2">{footer}</div>}
    </section>
  )
}

/** Primary (navy), outline (navy border) and quiet (card) buttons used in the actions row. */
export const profileButton = {
  primary: { background: NAVY, color: '#FFFFFF', border: 0 },
  outline: { background: CARD, color: NAVY, border: `1.5px solid ${NAVY}` },
  quiet: { background: CARD, color: INK, border: `1px solid ${LINE}` },
  /** Second action next to a navy button (Tip, Edit): navy outline on paper. */
  ghost: { background: 'transparent', color: NAVY, border: `1.5px solid ${NAVY}` },
} as const
