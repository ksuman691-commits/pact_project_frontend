'use client'

import Link from 'next/link'

function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

type ChipVariant = 'lead' | 'feed' | 'muted'

interface CircleChipProps {
  circleId: number | string
  circleName: string
  variant?: ChipVariant
  /** Use over a photo/dark hero where the default ink colour would vanish. */
  onDark?: boolean
  className?: string
}

const SIZES: Record<ChipVariant, { disc: number; font: number; name: number; gap: number; padRight: number }> = {
  lead: { disc: 30, font: 11, name: 14, gap: 10, padRight: 96 },
  feed: { disc: 26, font: 10, name: 13, gap: 8, padRight: 84 },
  muted: { disc: 22, font: 8, name: 13, gap: 8, padRight: 0 },
}

/**
 * A tappable reference to the circle a pact belongs to. Used on every pact
 * surface so the circle is never buried as muted footer text. `variant`
 * controls size/weight only — all three link to the same
 * `/circles/{id}` destination.
 */
export default function CircleChip({ circleId, circleName, variant = 'lead', onDark = false, className = '' }: CircleChipProps) {
  const s = SIZES[variant]
  const muted = variant === 'muted'
  return (
    <Link
      href={`/circles/${circleId}`}
      aria-label={`Open the circle ${circleName}`}
      className={`flex items-center no-underline ${variant === 'muted' ? 'min-h-[44px]' : variant === 'lead' ? 'min-h-[44px]' : ''} ${className}`}
      style={{
        gap: s.gap,
        paddingRight: s.padRight || undefined,
        color: onDark ? '#fff' : muted ? 'var(--muted)' : 'var(--ink-soft)',
        margin: variant === 'muted' ? '-8px 0 -6px' : undefined,
      }}
    >
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full font-sans"
        style={{
          width: s.disc,
          height: s.disc,
          boxSizing: 'border-box',
          border: `1.5px solid ${muted ? 'var(--seat-border)' : 'var(--navy)'}`,
          background: 'var(--paper)',
          color: muted ? 'var(--muted)' : 'var(--navy)',
          fontSize: s.font,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {monogram(circleName)}
      </span>
      <span style={{ fontSize: s.name, fontWeight: 600 }} className="truncate">
        {circleName}
      </span>
    </Link>
  )
}

/** Plain text for a pact with no circle. Never invents a circle to show. */
export function PersonalPactLabel({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[14px] text-[var(--muted)] ${className}`}>Just you</span>
  )
}
