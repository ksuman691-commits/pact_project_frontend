'use client'

import { useState } from 'react'
import { monogram } from '@/lib/stories'

export type RingState = 'unseen' | 'seen' | 'none'

/** unseen = navy 3px, seen = grey 3px, none/unknown = thin dashed. */
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

export default function StoryRing({ state, size, name, imageUrl }: { state: RingState; size: number; name?: string | null; imageUrl?: string | null }) {
  const border =
    state === 'unseen' ? '3px solid var(--navy)' : state === 'seen' ? '3px solid var(--seat-border)' : '1.5px dashed var(--seat-border)'
  const gap = 3
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, border, boxSizing: 'border-box', background: 'var(--paper)' }}
    >
      <RingFace name={name} imageUrl={imageUrl} size={size - (state === 'none' ? 3 : 6) - gap * 2} />
    </span>
  )
}
