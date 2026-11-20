'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/*
 * Drawn badges for the coloured page tops. One sticker style throughout:
 * a 32px disc with a 1.5px ink edge, and a glyph that also carries an ink
 * edge so it stays crisp on yellow and navy. Each one has a small motion:
 * the flame flickers, the tick draws itself, the gauge needle swings to
 * the score, the bolt flashes, the hourglass tips over. They replay when
 * the tile remounts (HeroStats remounts them as the numbers land).
 */

const INK = '#17181D'
const EDGE = 1.5

function Disc({ fill, children, label }: { fill: string; children: React.ReactNode; label?: string }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="block shrink-0 overflow-visible">
      <circle cx="16" cy="16" r={15.25} fill={fill} stroke={INK} strokeWidth={EDGE} />
      {children}
    </svg>
  )
}

export function FlameBadge() {
  return (
    <Disc fill="#FFF1D6">
      <g className="cp-b-flame-outer">
        <path
          d="M16 5.6c.7 3.3 3.2 4.9 5 7.3 1.4 1.9 2.1 3.8 2.1 5.7 0 4.1-3.2 7.1-7.1 7.1s-7.1-3-7.1-7c0-2.4 1.1-4.4 2.7-5.7.2 1.6 1.1 2.8 2.3 3.3-.6-4.1.6-8 2.1-10.7z"
          fill="#FF5A1F"
          stroke={INK}
          strokeWidth={EDGE}
          strokeLinejoin="round"
        />
      </g>
      <g className="cp-b-flame-inner">
        <path
          d="M16 15.8c.4 1.7 1.9 2.6 2.6 3.8.4.7.5 1.4.5 2 0 1.8-1.4 3.1-3.1 3.1s-3.1-1.3-3.1-3.1c0-1.5.8-2.7 1.8-3.6.1.8.5 1.4 1.1 1.6-.2-1.4 0-2.8.2-3.8z"
          fill="#FFD23F"
        />
      </g>
    </Disc>
  )
}

export function CheckBadge({ fill = '#22C55E' }: { fill?: string }) {
  return (
    <Disc fill={fill}>
      {/* Ink under white gives the tick its own edge. */}
      <path d="M10.2 16.6l3.9 3.9 7.8-8.4" fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="cp-b-draw" />
      <path d="M10.2 16.6l3.9 3.9 7.8-8.4" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="cp-b-draw" />
    </Disc>
  )
}

/** value 0–100; the needle swings there from 0 when the badge appears. */
export function GaugeBadge({ value }: { value: number | null }) {
  const reduce = useReducedMotion()
  const target = Math.max(0, Math.min(100, value ?? 0)) / 100
  const [shown, setShown] = useState(reduce ? target : 0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target))
    return () => cancelAnimationFrame(id)
  }, [target])
  // 270° dial from bottom-left round to bottom-right.
  const cx = 16
  const cy = 17
  const r = 8.6
  const arc = (from: number, to: number) => {
    const p = (a: number) => [cx + r * Math.cos(((a - 90) * Math.PI) / 180), cy + r * Math.sin(((a - 90) * Math.PI) / 180)]
    const [x0, y0] = p(from)
    const [x1, y1] = p(to)
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }
  const angle = -135 + 270 * shown
  return (
    <Disc fill="#FFFFFF">
      <path d={arc(-135, 135)} fill="none" stroke="rgba(23,24,29,0.16)" strokeWidth={3} strokeLinecap="round" />
      <path
        d={arc(-135, 135)}
        fill="none"
        stroke="#E5363B"
        strokeWidth={3}
        strokeLinecap="round"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1 - shown, transition: reduce ? undefined : 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
      />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: reduce ? undefined : 'transform 1.1s cubic-bezier(.34,1.45,.5,1)' }}>
        <path d={`M${cx} ${cy}L${cx} ${cy - 7.4}`} stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={2.1} fill={INK} />
    </Disc>
  )
}

export function BoltBadge() {
  return (
    <Disc fill="#FFD23F">
      <g className="cp-b-bolt">
        <path d="M17.6 6.8l-7.2 10h5l-1.4 8.4 7.6-10.6h-5.2z" fill={INK} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      </g>
    </Disc>
  )
}

export function HourglassBadge() {
  return (
    <Disc fill="#FFFFFF">
      <g className="cp-b-glass">
        <path d="M11 8.5h10M11 23.5h10" stroke={INK} strokeWidth={EDGE} strokeLinecap="round" />
        <path d="M12 8.5c0 4 4 5.4 4 7.5s-4 3.5-4 7.5h8c0-4-4-5.4-4-7.5s4-3.5 4-7.5z" fill="none" stroke={INK} strokeWidth={EDGE} strokeLinejoin="round" />
        <path d="M13.4 10.3h5.2c-.4 1.9-2.6 2.9-2.6 4.1 0-1.2-2.2-2.2-2.6-4.1z" fill="#FFB020" className="cp-b-sand-top" />
        <path d="M13.2 22.2c.3-2 2.8-3 2.8-4 0 1 2.5 2 2.8 4z" fill="#FFB020" className="cp-b-sand-bottom" />
      </g>
    </Disc>
  )
}

/** Any lucide glyph on the same sticker disc, for the less important tiles. */
export function GlyphBadge({ fill, children }: { fill: string; children: React.ReactNode }) {
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: fill, boxShadow: `inset 0 0 0 ${EDGE}px ${INK}` }}>
      {children}
    </span>
  )
}
