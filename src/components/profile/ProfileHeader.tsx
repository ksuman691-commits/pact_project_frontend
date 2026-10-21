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
  streak?: number | null
  activeCount?: number
  completedCount?: number
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
 * The top of every profile, own or someone else's. Only real numbers: no
 * win rate, reputation or locked achievements. Everything uses explicit
 * colours so the legacy .pact-flow heading and paragraph rules can't grey it out.
 */
export default function ProfileHeader({
  name,
  username,
  avatarUrl,
  bio,
  followers = 0,
  following = 0,
  streak,
  activeCount = 0,
  completedCount = 0,
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
    <span className="block size-[84px] shrink-0 rounded-full" style={{ ...ringStyle, boxSizing: 'border-box' }}>
      <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full text-[26px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
        {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="84px" className="object-cover" /> : initials(name) || '?'}
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
        <div className="min-w-0">
          <div className="truncate text-[23px] font-extrabold leading-tight tracking-[-0.025em]" style={{ color: INK }}>{name}</div>
          {username && <div className="mt-0.5 truncate text-[13.5px]" style={{ color: MUTED }}>@{username}</div>}
          <div className="mt-1 flex items-center gap-1 text-[13.5px]" style={{ color: MUTED }}>
            <button type="button" onClick={onFollowersClick} className="hover:underline">
              <span className="font-extrabold" style={{ color: INK }}>{followers}</span> followers
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={onFollowingClick} className="hover:underline">
              <span className="font-extrabold" style={{ color: INK }}>{following}</span> following
            </button>
          </div>
        </div>
      </div>

      {bio ? (
        <div className="mt-3 whitespace-pre-line text-[14.5px] leading-snug" style={{ color: INK }}>{bio}</div>
      ) : isOwn ? (
        <Link
          href="/profile/edit#bio"
          className="mt-3 flex min-h-11 items-center rounded-[14px] px-3 text-[14px] font-semibold"
          style={{ border: `1.5px dashed ${NAVY}`, color: NAVY, background: '#F5F7FD' }}
        >
          + Add a bio. Tell people what you&apos;re working on.
        </Link>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {streak != null && streak > 0 && (
          <span className="flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-extrabold" style={{ background: '#E8ECF7', color: NAVY }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={NAVY} aria-hidden="true"><path d="M12 2c1 4-3 6-3 10a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 5 5 8a9 9 0 0 1-18 0c0-6 6-8 9-13z" /></svg>
            {streak}-day streak
          </span>
        )}
        <span className="flex h-[30px] items-center rounded-full px-3 text-[13px] font-bold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>
          {activeCount} active {activeCount === 1 ? 'pact' : 'pacts'}
        </span>
        <span className="flex h-[30px] items-center rounded-full px-3 text-[13px] font-bold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>
          {completedCount} completed
        </span>
      </div>

      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
      {footer && <div className="mt-3 flex flex-col gap-2">{footer}</div>}
    </section>
  )
}

/** Primary (navy), outline (navy border) and quiet (card) buttons used in the actions row. */
export const profileButton = {
  primary: { background: NAVY, color: '#FFFFFF', border: 0 },
  outline: { background: CARD, color: NAVY, border: `1.5px solid ${NAVY}` },
  quiet: { background: CARD, color: INK, border: `1px solid ${LINE}` },
} as const
