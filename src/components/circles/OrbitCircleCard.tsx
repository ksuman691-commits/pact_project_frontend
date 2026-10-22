'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import type { CircleActivity } from '@/lib/circleActivity'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const TRACK = '#ECE6D8'

const SIZE = 116
const RADIUS = 44
const MAX_FACES = 7

function initials(name: string) {
  return (
    String(name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

function Face({ member, active, isYou, duration }: { member: any; active: boolean; isYou: boolean; duration: string }) {
  const [broken, setBroken] = useState(false)
  const name = member?.full_name || member?.name || member?.username || ''
  const photo = member?.avatar_url && !broken ? member.avatar_url : null
  return (
    <span
      className="cp-orbit-upright absolute left-[-13px] top-[-13px] flex size-[26px] items-center justify-center overflow-hidden rounded-full text-[9.5px] font-extrabold"
      style={{
        animationDuration: duration,
        ...(active
          ? { background: NAVY, color: '#FFFFFF', boxShadow: '0 0 0 2.5px #FFFFFF' }
          : { background: '#FBF8F1', color: MUTED, boxShadow: `0 0 0 1.5px ${LINE}, 0 0 0 4px #FFFFFF` }),
      }}
      title={`${isYou ? 'You' : name}${active ? ' · showed up this week' : ''}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" onError={() => setBroken(true)} className="size-full object-cover" style={active ? {} : { opacity: 0.75 }} />
      ) : isYou ? (
        'You'
      ) : (
        initials(name)
      )}
    </span>
  )
}

/**
 * A circle on the Circles page: its initials or cover in the middle, a ring
 * whose navy arc is how much of the circle showed up this week, and up to 7
 * faces turning slowly around it (you, then whoever posted, then others).
 * Everyone else is "+N". Works the same for 3 members or 300.
 */
export default function OrbitCircleCard({ circle, activity, index = 0 }: { circle: any; activity: CircleActivity; index?: number }) {
  const [coverBroken, setCoverBroken] = useState(false)
  const preview: any[] = Array.isArray(circle?.members_preview) ? circle.members_preview : []
  const faces = preview.slice(0, MAX_FACES)
  const total = Math.max(activity.totalMembers || 0, faces.length, 1)
  const extra = total - faces.length
  const active = activity.known ? activity.activeCount : faces.filter((m) => m?.sent_proof_this_week === true).length
  const circumference = 2 * Math.PI * RADIUS
  const arc = (circumference * Math.min(active, total)) / total
  const duration = `${60 + (index % 4) * 12}s`
  const isPrivate = (circle?.visibility ?? 'public') === 'private'
  const live = typeof circle?.live_pact_count === 'number' ? circle.live_pact_count : null
  const cover = circle?.photo_url && !coverBroken ? circle.photo_url : null

  const status = !activity.known
    ? `${total} ${total === 1 ? 'member' : 'members'}`
    : active === 0
      ? 'Quiet this week. Be the first to post.'
      : active >= total
        ? 'Everyone showed up this week.'
        : `${active} of ${total} showed up this week.`

  return (
    <Link
      href={`/circles/${circle.id}`}
      className="flex items-center gap-3.5 rounded-[24px] py-3.5 pl-3 pr-4 transition active:scale-[0.99]"
      style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, boxShadow: '0 1px 0 rgba(23,24,29,0.03), 0 16px 30px -26px rgba(23,24,29,0.5)', color: INK }}
    >
      <span className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden="true">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={TRACK} strokeWidth="3" />
          {active > 0 && (
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${arc} ${circumference}`} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} />
          )}
        </svg>
        <span
          className="absolute flex items-center justify-center overflow-hidden rounded-full text-[17px] font-extrabold tracking-[-0.02em]"
          style={{ left: 30, top: 30, width: 56, height: 56, background: INK, color: '#FFFFFF', boxShadow: '0 0 0 4px #FFFFFF' }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" onError={() => setCoverBroken(true)} className="size-full object-cover" />
          ) : (
            initials(circle?.name)
          )}
        </span>
        <span className="cp-orbit-spin absolute inset-0" style={{ animationDuration: duration }} aria-hidden="true">
          {faces.map((member, i) => {
            const seats = faces.length + (extra > 0 ? 1 : 0)
            const angle = (i / seats) * Math.PI * 2 - Math.PI / 2
            const left = SIZE / 2 + RADIUS * Math.cos(angle)
            const top = SIZE / 2 + RADIUS * Math.sin(angle)
            return (
              <span key={member?.user_id ?? i} className="absolute size-0" style={{ left, top }}>
                <Face member={member} active={member?.sent_proof_this_week === true} isYou={Boolean(member?.is_you)} duration={duration} />
              </span>
            )
          })}
          {extra > 0 && (() => {
            // "+N" takes the last seat on the ring and turns with the faces.
            const angle = (faces.length / (faces.length + 1)) * Math.PI * 2 - Math.PI / 2
            return (
              <span className="absolute size-0" style={{ left: SIZE / 2 + RADIUS * Math.cos(angle), top: SIZE / 2 + RADIUS * Math.sin(angle) }}>
                <span
                  className="cp-orbit-upright absolute left-[-15px] top-[-13px] flex h-[26px] min-w-[30px] items-center justify-center rounded-full px-1 text-[9.5px] font-extrabold"
                  style={{ animationDuration: duration, background: INK, color: '#FFFFFF', boxShadow: '0 0 0 2.5px #FFFFFF' }}
                >
                  +{extra > 999 ? `${Math.floor(extra / 1000)}k` : extra}
                </span>
              </span>
            )
          })()}
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[17px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>{circle?.name}</span>
          {isPrivate && <Lock className="size-[13px] shrink-0" strokeWidth={2.4} style={{ color: MUTED }} aria-label="Private circle" />}
        </span>
        <span className="text-[13.5px] leading-snug" style={{ color: MUTED }}>{status}</span>
        <span className="mt-1 flex flex-wrap gap-1.5">
          {live != null && (
            <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: '#F4EFE4', color: INK }}>
              {live} live {live === 1 ? 'pact' : 'pacts'}
            </span>
          )}
          <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: '#F4EFE4', color: INK }}>
            {total} {total === 1 ? 'member' : 'members'}
          </span>
        </span>
      </span>
    </Link>
  )
}
