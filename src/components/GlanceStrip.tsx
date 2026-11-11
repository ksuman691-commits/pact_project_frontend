'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface GlanceStat {
  label: string
  /** Read out with the label when the short label alone could be unclear. */
  hint?: string
  /** What to show; null while loading. */
  value: string | number | null
  /** True when the list below is showing exactly this. */
  selected?: boolean
  onSelect: () => void
}

interface GlanceStripProps {
  /** Navy for pacts and circles, ink + yellow for dares. */
  tone: 'navy' | 'ink'
  label: string
  stats: GlanceStat[]
  action: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }
}

/**
 * The strip at the top of Pacts, Circles and Dares: three numbers that are
 * also the quickest filters, and the one thing you came here to start. Each
 * number is its own button with a pressed state and lights up while the list
 * below is filtered to it.
 */
export default function GlanceStrip({ tone, label, stats, action }: GlanceStripProps) {
  const navy = tone === 'navy'
  const accent = navy ? 'white' : 'var(--dare)'
  const onAccent = navy ? 'var(--navy)' : 'var(--ink)'
  const actionClass = 'flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition active:scale-[0.98]'
  const actionStyle = { background: accent, color: onAccent }
  return (
    <section className={`mx-[10px] rounded-[20px] p-2 text-white sm:mx-6 ${navy ? 'bg-[var(--navy)]' : 'bg-[var(--ink)]'}`} aria-label={label}>
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onSelect}
            aria-pressed={!!stat.selected}
            aria-label={`${stat.label}${stat.hint ? ` (${stat.hint.toLowerCase()})` : ''}: ${stat.value ?? 'loading'}`}
            title={stat.hint}
            className="group relative flex min-h-[58px] flex-col justify-center rounded-[14px] px-3 text-left transition active:scale-[0.97]"
            style={stat.selected ? { background: accent, color: onAccent } : { background: 'rgba(255,255,255,0.1)' }}
          >
            <span key={String(stat.value)} className="cp-tick block text-[22px] font-bold leading-none tracking-[-0.03em]" style={stat.selected || navy ? undefined : { color: accent }}>
              {stat.value ?? '–'}
            </span>
            <span className="mt-1 block truncate text-[12px] font-medium" style={stat.selected ? undefined : { color: navy ? '#D4DBFA' : '#C9C8CF' }}>
              {stat.label}
            </span>
            <ChevronRight className="absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" strokeWidth={2.4} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="mt-1.5">
        {action.href ? (
          <Link href={action.href} className={actionClass} style={actionStyle}>
            {action.icon}
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClass} style={actionStyle}>
            {action.icon}
            {action.label}
          </button>
        )}
      </div>
    </section>
  )
}
