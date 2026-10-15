'use client'

import { useState } from 'react'
import { monogram } from '@/lib/stories'

/**
 * unseen = navy segments (one per unseen moment), seen = thin grey ring,
 * none = no ring (nothing posted), add = dashed navy ring (post your own).
 */
export type RingState = 'unseen' | 'seen' | 'none' | 'add'

export function ringStateFrom(hasUnseen: boolean | null | undefined, count: number | null | undefined): RingState {
  if (hasUnseen === true) return 'unseen'
  if (hasUnseen === false && typeof count === 'number' && count > 0) return 'seen'
  return 'none'
}

export function RingFace({ name, imageUrl, size }: { name?: string | null; imageUrl?: string | null; size: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className="flex items-center justify-center overflow-hidden rounded-full font-bold"
      style={{ width: size, height: size, background: 'var(--card)', color: 'var(--navy)', fontSize: Math.round(size * 0.32), letterSpacing: '-0.02em' }}
    >
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        monogram(name)
      )}
    </span>
  )
}

const MAX_SEGMENTS = 8

function ringPaint(state: RingState, circumference: number, count: number) {
  if (state === 'add') {
    const dash = circumference / 36
    return { stroke: 'var(--navy)', width: 3, dasharray: `${dash} ${dash}` }
  }
  if (state === 'seen') return { stroke: 'var(--seat-border)', width: 2, dasharray: `${circumference} 0` }
  if (state === 'none') return { stroke: 'transparent', width: 2, dasharray: `${circumference} 0` }
  const width = 3
  const segments = Math.min(Math.max(count, 1), MAX_SEGMENTS)
  if (segments === 1) return { stroke: 'var(--navy)', width, dasharray: `${circumference} 0` }
  const gap = 9
  const segment = (circumference - segments * gap) / segments
  // Round caps extend each dash by half the stroke width at both ends, so shorten the dash and lengthen the gap by the same amount.
  return { stroke: 'var(--navy)', width, dasharray: `${Math.max(segment - width, 1)} ${gap + width}` }
}

/** Ring around a face. `count` splits an unseen ring into one segment per unseen moment. */
export default function StoryRing({
  state,
  size,
  name,
  imageUrl,
  count,
}: {
  state: RingState
  size: number
  name?: string | null
  imageUrl?: string | null
  count?: number | null
}) {
  const radius = (size - 3) / 2
  const circumference = 2 * Math.PI * radius
  const paint = ringPaint(state, circumference, typeof count === 'number' ? count : 1)
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={paint.stroke}
          strokeWidth={paint.width}
          strokeLinecap={state === 'add' ? 'butt' : 'round'}
          strokeDasharray={paint.dasharray}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ opacity: state === 'none' ? 0.7 : 1 }}>
        <RingFace name={name} imageUrl={imageUrl} size={size - 12} />
      </span>
    </span>
  )
}
