'use client'

import { useEffect, useRef, useState } from 'react'
import { haptic, prefersReducedMotion } from '@/lib/motion'

const SEEN_KEY = 'cp:streak-seen'

/** Bigger, hotter flame as the streak grows, so a long streak looks like something worth protecting. */
function tier(streak: number): 'spark' | 'flame' | 'blaze' {
  if (streak >= 7) return 'blaze'
  if (streak >= 3) return 'flame'
  return 'spark'
}

function Flame({ size, hot }: { size: number; hot: boolean }) {
  return (
    <span className="cp-flame relative inline-block" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size} className="cp-flame-outer absolute inset-0">
        <defs>
          <linearGradient id="cp-flame-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="60%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
        </defs>
        <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 .5 2 1.5 2.5 2 2 0-3-1-5 1-8z" fill="url(#cp-flame-grad)" />
      </svg>
      <svg viewBox="0 0 24 24" width={size} height={size} className="cp-flame-inner absolute inset-0">
        <path d="M12 10c.6 2 3 3 3 6a3 3 0 0 1-6 0c0-1.6 1-2.3 1.6-3.2.2 1 .8 1.3 1 1 0-1.5-.3-2.6.4-3.8z" fill={hot ? '#FFF7D6' : '#FDE68A'} />
      </svg>
    </span>
  )
}

/**
 * The streak chip on Home. The flame always flickers a little (it is alive). When the streak has grown
 * since this phone last saw it, the chip levels up once: it pops, the number rolls up, and sparks fly.
 */
export default function StreakChip({ streak, tone = 'navy' }: { streak: number; tone?: 'navy' | 'onNavy' }) {
  const [shown, setShown] = useState(streak)
  const [levelUp, setLevelUp] = useState(false)
  // What this phone last saw, read once (so a re-run of the effect still knows the old value).
  const seenRef = useRef<number | null>(null)

  useEffect(() => {
    if (streak <= 0) return
    if (seenRef.current === null) {
      try {
        seenRef.current = Number(window.localStorage.getItem(SEEN_KEY) || 0)
        window.localStorage.setItem(SEEN_KEY, String(streak))
      } catch {
        seenRef.current = streak
      }
    }
    const seen = seenRef.current
    if (seen > 0 && streak > seen && !prefersReducedMotion()) {
      setShown(seen)
      const timers: number[] = []
      timers.push(
        window.setTimeout(() => {
          setLevelUp(true)
          haptic(15)
        }, 450),
      )
      // Roll the number up one day at a time (capped, so a long gap still finishes quickly).
      const steps = Math.min(streak - seen, 10)
      for (let i = 1; i <= steps; i += 1) {
        timers.push(window.setTimeout(() => setShown(i === steps ? streak : seen + i), 450 + (i * 500) / steps))
      }
      return () => timers.forEach(window.clearTimeout)
    }
    setShown(streak)
  }, [streak])

  const level = tier(streak)
  const size = level === 'blaze' ? 16 : level === 'flame' ? 14 : 13
  return (
    <span
      className={`relative mb-0.5 inline-flex items-center gap-1 rounded-full py-0.5 pl-1.5 pr-2 text-[11px] font-bold text-white ${tone === 'onNavy' ? 'bg-white/15' : 'bg-[var(--navy)]'} ${levelUp ? 'cp-streak-levelup' : ''} ${level === 'blaze' ? 'cp-streak-blaze' : ''}`}
      aria-label={`${streak}-day streak`}
    >
      <Flame size={size} hot={level !== 'spark'} />
      <span aria-hidden="true">{shown}-day streak</span>
      {levelUp && (
        <span className="pointer-events-none absolute left-2.5 top-1/2" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="cp-spark" style={{ ['--a' as string]: `${i * 45}deg` }} />
          ))}
        </span>
      )}
    </span>
  )
}
