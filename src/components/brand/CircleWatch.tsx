'use client'

import React, { useEffect, useState } from 'react'
import { MARK_RED } from '@/lib/circleMark'

const INK = '#17181D'
const YELLOW = '#FFD23F'
const GREEN = '#2E8B57'
const HOUR = 3_600_000

export type WatchState = 'running' | 'done' | 'missed'

function point(deg: number, r: number) {
  const a = (deg * Math.PI) / 180
  return [50 + r * Math.sin(a), 50 - r * Math.cos(a)]
}

/** A red slice from 12 o'clock clockwise, `deg` degrees round. */
function slice(deg: number, r: number) {
  if (deg <= 0) return null
  if (deg >= 359.9) return <circle cx="50" cy="50" r={r} fill={MARK_RED} />
  const [x, y] = point(deg, r)
  return <path d={`M50 50 L50 ${50 - r} A${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`} fill={MARK_RED} />
}

/**
 * The CirclePact watch. A white face that fills with our red, clockwise from
 * 12, as the time runs out: the fuller it is, the less time is left, and when
 * time is up it is a full red circle like the CirclePact mark.
 *
 * - Under 3 hours left a yellow ring appears; in the last hour it breathes.
 * - A thin hand ticks every second so the screen never looks frozen.
 * - Done: the watch stops and shows a green check. Missed: grey and dotted.
 * - Reduce Motion stops the ticking and the breathing.
 *
 * `elapsed` is the share of the window gone (0 to 1). `endsAt` (ms) lets the
 * watch redraw itself every 30s and pick the yellow-ring stage. Children sit
 * in the middle (a face on pact cards); with no children a small pin does.
 */
export default function CircleWatch({
  size = 48,
  elapsed,
  endsAt,
  state = 'running',
  children,
  className = '',
  title,
}: {
  size?: number
  elapsed?: number | null
  endsAt?: number | null
  state?: WatchState
  children?: React.ReactNode
  className?: string
  title?: string
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (state !== 'running') return
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [state])

  const left = endsAt != null ? endsAt - now : null
  const ring = state === 'running' && left != null && left > 0 && left < 3 * HOUR
  const lastHour = ring && left! < HOUR
  const share = Math.min(1, Math.max(0, elapsed ?? 0))
  // With a face in the middle the face is big and the red shows as a band round it.
  const hasFace = children != null
  const capR = hasFace ? 31 : 3.6
  const sliceR = hasFace ? 45 : 37
  const tickIn = hasFace ? 40 : 40
  const capPx = (capR * 2 * size) / 100

  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0 overflow-visible">
        {ring && <circle cx="50" cy="50" r="51.5" fill="none" stroke={YELLOW} strokeWidth="4" className={lastHour ? 'cp-watch-breathe' : ''} />}
        <circle cx="50" cy="50" r="48" fill={state === 'missed' ? '#D9D6CF' : '#FFFFFF'} stroke={INK} strokeWidth="2" />
        {state === 'running' && slice(share * 360, sliceR)}
        {state === 'done' && <circle cx="50" cy="50" r={sliceR} fill={GREEN} />}
        {state === 'missed' && <circle cx="50" cy="50" r={sliceR - 2} fill="none" stroke="#6E7078" strokeWidth="2" strokeDasharray="3 4" />}
        {Array.from({ length: 12 }).map((_, i) => {
          const major = i % 3 === 0
          const [x1, y1] = point(i * 30, major ? tickIn - 2 : tickIn + 1)
          const [x2, y2] = point(i * 30, 46)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={INK}
              strokeWidth={major ? 3 : 1.8}
              strokeLinecap="round"
              opacity={major ? 1 : 0.55}
            />
          )
        })}
        {state === 'running' && (
          <g className="cp-watch-sec">
            <line x1="50" y1="57" x2="50" y2="7" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}
        {state === 'done' && !hasFace && (
          <path d="M34 51 l10 10 21-22" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {!hasFace && state === 'running' && <circle cx="50" cy="50" r={capR} fill={INK} />}
      </svg>
      {hasFace && (
        <span
          className="absolute flex items-center justify-center overflow-hidden rounded-full"
          style={{
            width: capPx,
            height: capPx,
            left: (size - capPx) / 2,
            top: (size - capPx) / 2,
            boxShadow: `0 0 0 ${Math.max(1.5, size * 0.03)}px #fff`,
          }}
        >
          {children}
          {state === 'done' && (
            <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(46,139,87,0.82)' }}>
              <svg viewBox="0 0 24 24" width={capPx * 0.55} height={capPx * 0.55} aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </span>
      )}
    </span>
  )
}
