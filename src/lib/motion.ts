/**
 * One set of timings for the whole app, so everything moves the same way.
 * Animate transform and opacity only. Keep celebrations short and skippable.
 */
export const DUR = { fast: 0.12, base: 0.22, slow: 0.36 } as const
export const EASE = [0.22, 1, 0.36, 1] as const
export const SPRING = { type: 'spring', stiffness: 380, damping: 22 } as const

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** A short buzz on Android and installed web apps. iPhone browsers ignore it. */
export function haptic(ms = 10): void {
  if (prefersReducedMotion()) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    // Not supported: nothing to do.
  }
}
