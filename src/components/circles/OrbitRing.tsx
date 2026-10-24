'use client'

import { useState } from 'react'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const TRACK = '#ECE6D8'

export interface OrbitMember {
  user_id?: number | string
  full_name?: string | null
  name?: string | null
  username?: string | null
  avatar_url?: string | null
  sent_proof_this_week?: boolean | null
  is_you?: boolean
}

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

function Face({ member, size, duration, compact = false }: { member: OrbitMember; size: number; duration: string; compact?: boolean }) {
  const [broken, setBroken] = useState(false)
  const active = member.sent_proof_this_week === true
  const name = member.full_name || member.name || member.username || ''
  const photo = member.avatar_url && !broken ? member.avatar_url : null
  return (
    <span
      className="cp-orbit-upright absolute flex items-center justify-center overflow-hidden rounded-full font-extrabold"
      style={{
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        animationDuration: duration,
        ...(compact
          ? active
            ? { background: NAVY, color: '#FFFFFF', boxShadow: '0 0 0 1.5px #FBF8F1' }
            : { background: '#E3D9C2', color: MUTED, boxShadow: '0 0 0 1.5px #FBF8F1' }
          : active
            ? { background: NAVY, color: '#FFFFFF', boxShadow: '0 0 0 2.5px #FFFFFF' }
            : { background: '#FBF8F1', color: MUTED, boxShadow: `0 0 0 1.5px ${LINE}, 0 0 0 4px #FFFFFF` }),
      }}
      title={`${member.is_you ? 'You' : name}${active ? ' · showed up this week' : ''}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" onError={() => setBroken(true)} className="size-full object-cover" style={active ? {} : { opacity: 0.75 }} />
      ) : size < 14 ? null : member.is_you ? (
        'You'
      ) : (
        initials(name)
      )}
    </span>
  )
}

/**
 * A circle's ring: its photo or initials in an ink disc, a track whose navy
 * arc is the share of members who showed up this week, and up to 7 faces
 * turning slowly around it. Anyone beyond that is a "+N" seat on the ring.
 */
export default function OrbitRing({
  name,
  photoUrl,
  members,
  total,
  active,
  size = 116,
  duration = '60s',
  center,
  discSize,
  faceSize,
}: {
  name: string
  photoUrl?: string | null
  members: OrbitMember[]
  total: number
  active: number
  size?: number
  duration?: string
  /** Extra content over the disc, e.g. a change-photo button. */
  center?: React.ReactNode
  /** For small rings: the centre disc and the faces in px, instead of scaling down from 116. */
  discSize?: number
  faceSize?: number
}) {
  const [coverBroken, setCoverBroken] = useState(false)
  const scale = size / 116
  const radius = 44 * scale
  const disc = discSize ?? 56 * scale
  const face = faceSize ?? Math.round(26 * Math.min(1.35, scale))
  const halo = discSize ? 2 : 4
  // A small ring shows a few faces and no "+N" chip, so it stays legible.
  const compact = discSize != null
  const faces = members.slice(0, compact ? 4 : 7)
  const safeTotal = Math.max(1, total, faces.length)
  const extra = compact ? 0 : safeTotal - faces.length
  const seats = faces.length + (extra > 0 ? 1 : 0)
  const circumference = 2 * Math.PI * radius
  const arc = (circumference * Math.min(active, safeTotal)) / safeTotal
  const at = (i: number) => {
    const angle = (i / Math.max(1, seats)) * Math.PI * 2 - Math.PI / 2
    return { left: size / 2 + radius * Math.cos(angle), top: size / 2 + radius * Math.sin(angle) }
  }
  const cover = photoUrl && !coverBroken ? photoUrl : null

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={TRACK} strokeWidth={discSize ? 2 : 3 * Math.min(1.4, scale)} />
        {active > 0 && (
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={NAVY} strokeWidth={discSize ? 2 : 3 * Math.min(1.4, scale)} strokeLinecap="round" strokeDasharray={`${arc} ${circumference}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )}
      </svg>
      <span
        className="absolute flex items-center justify-center overflow-hidden rounded-full font-extrabold tracking-[-0.02em]"
        style={{ left: (size - disc) / 2, top: (size - disc) / 2, width: disc, height: disc, fontSize: discSize ? Math.round(discSize * 0.4) : Math.round(17 * scale), background: INK, color: '#FFFFFF', boxShadow: `0 0 0 ${halo}px ${compact ? '#FBF8F1' : '#FFFFFF'}` }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" onError={() => setCoverBroken(true)} className="size-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
      {center}
      <span className="cp-orbit-spin absolute inset-0" style={{ animationDuration: duration }} aria-hidden="true">
        {faces.map((member, i) => (
          <span key={member.user_id ?? i} className="absolute size-0" style={at(i)}>
            <Face member={member} size={face} duration={duration} compact={compact} />
          </span>
        ))}
        {extra > 0 && (
          <span className="absolute size-0" style={at(faces.length)}>
            <span
              className="cp-orbit-upright absolute flex items-center justify-center rounded-full px-1 font-extrabold"
              style={{ left: -(face + 4) / 2, top: -face / 2, height: face, minWidth: face + 4, fontSize: Math.round(face * 0.36), animationDuration: duration, background: INK, color: '#FFFFFF', boxShadow: '0 0 0 2.5px #FFFFFF' }}
            >
              +{extra > 999 ? `${Math.floor(extra / 1000)}k` : extra}
            </span>
          </span>
        )}
      </span>
    </span>
  )
}
