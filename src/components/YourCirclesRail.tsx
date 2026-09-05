'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface CircleRailItem {
  id: number
  name: string
  photo_url?: string | null
  emoji?: string | null
  icon_emoji?: string | null
  member_count?: number
}

interface YourCirclesRailProps {
  circles: CircleRailItem[]
  isLoading?: boolean
}

/**
 * Horizontally-scrollable rail of the viewer's circles for the top of the
 * feed. Backed by the same `useCircles()` query the Circles tab uses
 * (`queryKeys.circles.list()`) — no separate fetch. Only real fields are
 * shown: `name`, `photo_url`/`emoji` fallback, `member_count`.
 */
export default function YourCirclesRail({ circles, isLoading }: YourCirclesRailProps) {
  if (isLoading) {
    return <div className="pact-shimmer h-28 rounded-[28px]" />
  }

  if (circles.length === 0) {
    // Same dashed-border "Nothing here yet" convention used elsewhere in the
    // app for empty lists (see ProfileTabs.tsx's renderEmptyState).
    return (
      <div
        className="pact-card rounded-3xl border border-dashed px-6 py-8 text-center"
        style={{ borderColor: 'var(--pact-hairline)' }}
      >
        <p className="text-base font-semibold text-[var(--pact-text)]">Nothing here yet</p>
        <p className="mt-1 text-sm text-[var(--pact-text-muted)]">Join or create a circle to hold each other accountable.</p>
        <Link
          href="/circles"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold text-[var(--pact-text)]"
          style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
        >
          Browse circles
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between px-1 pb-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-text-muted)]">Your circles</h2>
        <Link
          href="/circles"
          className="flex items-center gap-1 text-xs font-semibold text-[var(--pact-violet)]"
        >
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1" aria-label="Your circles">
        {circles.map((circle) => (
          <Link
            key={circle.id}
            href={`/circles/${circle.id}`}
            className="pact-card flex w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center"
            style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
          >
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--pact-violet)]/40 bg-[var(--pact-surface-2)] text-xl">
              {circle.photo_url ? (
                <Image src={circle.photo_url} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                circle.emoji || circle.icon_emoji || '◌'
              )}
            </span>
            <div className="min-w-0 w-full">
              <p className="truncate text-xs font-bold text-[var(--pact-text)]">{circle.name}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-[var(--pact-gold)]">
                {circle.member_count ?? 0} member{circle.member_count === 1 ? '' : 's'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
