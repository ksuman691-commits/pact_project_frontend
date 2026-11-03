import confetti from 'canvas-confetti'
import { prefersReducedMotion } from '@/lib/motion'

/** Brand colours, so the confetti looks like CirclePact and not a party shop. */
const COLORS = ['#1F3A93', '#17181D', '#A29C8D', '#D9CFBA', '#2E7D5B']
const LIGHT_COLORS = ['#FFFFFF', '#D9CFBA', '#A29C8D', '#F4EFE4']

export type ConfettiSize = 'small' | 'medium' | 'big'

/** Confetti that stays off for people who asked for less motion. */
export function fireConfetti(size: ConfettiSize = 'medium', opts: { light?: boolean; y?: number } = {}): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return
  const count = size === 'small' ? 50 : size === 'medium' ? 80 : 130
  confetti({
    particleCount: count,
    spread: size === 'big' ? 90 : 70,
    origin: { y: opts.y ?? 0.55 },
    colors: opts.light ? LIGHT_COLORS : COLORS,
    disableForReducedMotion: true,
    zIndex: 120,
  })
}

/** canvas-confetti draws on one shared canvas on document.body; call this when leaving a screen. */
export function stopConfetti(): void {
  try {
    confetti.reset()
  } catch {
    // Nothing was drawn.
  }
}

/** Optional numbers from the server for the check-in moment (streak, circle progress). */
export interface CheckInExtras {
  streak?: { before: number; after: number } | null
  circle?: { name?: string | null; before: number; after: number; total: number } | null
}

export interface CheckInCelebrationData extends CheckInExtras {
  pactId: number
  title?: string | null
  day?: number | null
  totalDays?: number | null
}
