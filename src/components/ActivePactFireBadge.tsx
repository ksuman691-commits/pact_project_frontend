'use client'

import { Flame } from 'lucide-react'

type ActivePactFireBadgeProps = {
  size?: number
  className?: string
}

// Small "story ring"-style badge for a 🔥 icon, signaling a pact has real
// momentum right now (see hasPactMomentum in src/lib/pactMomentum.ts —
// callers are responsible for only rendering this when that's true).
// Reuses the exact rotating conic-gradient ring technique from Avatar.tsx's
// story ring (same avatar-ring-spin keyframe, same padding-as-ring-band
// trick) so it reads as part of the same design language, just scoped down
// to badge size and recolored warm (amber/red) instead of the avatar's
// pink/gold/mint/violet mix — this ring means "hot", not "premium".
export default function ActivePactFireBadge({ size = 22, className = '' }: ActivePactFireBadgeProps) {
  const ringBand = Math.max(2, Math.round(size * 0.12))

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Layer 1: soft breathing amber/red glow behind the ring. */}
      <div
        className="avatar-ring-breathe pointer-events-none absolute inset-0 rounded-full blur-sm"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.65), rgba(239,68,68,0.45) 60%, transparent 80%)' }}
      />
      {/* Layer 2: rotating conic-gradient ring band, warm palette. */}
      <div
        className="avatar-ring-spin absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #FBBF24, #F97316, #EF4444, #F97316, #FBBF24)',
          padding: ringBand,
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full" style={{ background: 'var(--pact-bg, #ffffff)' }}>
          <Flame className="h-[55%] w-[55%] fill-orange-500 text-orange-500" aria-hidden="true" />
        </div>
      </div>
      <span className="sr-only">Active with real momentum</span>
    </div>
  )
}
