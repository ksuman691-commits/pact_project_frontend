'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export interface HeroStat {
  key: string
  label: string
  /** Null while loading. Numbers count up; strings are shown as they are. */
  value: number | string | null
  /** Small word after the number: "days", "of 16". */
  unit?: string
  /** One short line of meaning under the label. */
  sub?: React.ReactNode
  icon: React.ReactNode
  /** Background of a plain icon chip. Leave out when `icon` is a drawn badge. */
  iconBg?: string
  /** Something small drawn in the tile's corner: a ring, a sparkline, faces. */
  visual?: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  href?: string
  /** Read out with the label. */
  hint?: string
}

interface HeroStatsProps {
  tone: 'dare' | 'navy'
  label: string
  stats: HeroStat[]
  action?: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }
  /** Numbers wait for this before counting up, so they land with the logo's pop. */
  ready?: boolean
}

/** Counts up to the value the first time it's ready, and between values after that. */
export function CountUp({ value, ready = true, delay = 0 }: { value: number; ready?: boolean; delay?: number }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  const from = useRef(reduce ? value : 0)
  useEffect(() => {
    if (!ready) return
    if (reduce) {
      setShown(value)
      return
    }
    const c = animate(from.current, value, {
      duration: Math.min(1.1, 0.45 + Math.abs(value - from.current) * 0.04),
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
      onComplete: () => {
        from.current = value
      },
    })
    return () => c.stop()
  }, [value, ready, reduce, delay])
  return <>{Math.round(shown)}</>
}

/**
 * The three numbers in the coloured top of a page, each with a meaning line
 * and a small picture, and the page's main action under them. Tiles rise in
 * one after another; numbers count up once the data is in.
 */
export default function HeroStats({ tone, label, stats, action, ready = true }: HeroStatsProps) {
  const dare = tone === 'dare'
  const tileBase =
    'cp-tile group relative flex min-h-[132px] flex-col overflow-hidden rounded-[18px] p-3 text-left transition active:scale-[0.97]'
  const actionClass =
    'cp-hero-cta relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-full text-[16px] font-bold transition active:scale-[0.98]'

  return (
    <section aria-label={label}>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, i) => {
          const body = (
            <>
              {/* soft light on the top edge */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent)' }} />
              <span className="flex items-center justify-between">
                {/* Remounted when the numbers land, so the badge's own motion plays with the pop. */}
                <span key={ready ? 'ready' : 'wait'} className="cp-badge-pop flex">
                  {stat.iconBg ? (
                    <span className="flex size-8 items-center justify-center rounded-full" style={{ background: stat.iconBg, boxShadow: 'inset 0 0 0 1.5px #17181D' }}>
                      {stat.icon}
                    </span>
                  ) : (
                    stat.icon
                  )}
                </span>
                {stat.visual ?? <ChevronRight className="h-4 w-4 opacity-50" strokeWidth={2.4} aria-hidden="true" />}
              </span>
              <span className="mt-3 flex items-baseline gap-1">
                <span
                  className="text-[30px] font-bold leading-none tracking-[-0.04em] tabular-nums"
                  style={{ color: stat.selected ? undefined : dare ? 'var(--dare)' : '#FFFFFF' }}
                >
                  {stat.value == null ? '–' : typeof stat.value === 'number' ? <CountUp value={stat.value} ready={ready} delay={0.08 * i} /> : stat.value}
                </span>
                {stat.unit && stat.value != null && (
                  <span className="text-[12.5px] font-semibold" style={{ color: stat.selected ? undefined : dare ? '#C9C8CF' : '#C7D0F7' }}>
                    {stat.unit}
                  </span>
                )}
              </span>
              <span className="mt-1 block truncate text-[13px] font-bold" style={{ color: stat.selected ? undefined : '#FFFFFF' }}>
                {stat.label}
              </span>
              {stat.sub && (
                <span className="mt-0.5 line-clamp-2 block text-[11.5px] font-medium leading-[1.3]" style={{ color: stat.selected ? undefined : dare ? '#B5B4BC' : '#C7D0F7' }}>
                  {stat.sub}
                </span>
              )}
            </>
          )
          const style: React.CSSProperties = {
            animationDelay: `${120 + i * 90}ms`,
            ...(stat.selected
              ? { background: dare ? 'var(--dare)' : '#FFFFFF', color: dare ? 'var(--ink)' : 'var(--navy)', boxShadow: '0 10px 24px -12px rgba(0,0,0,0.5)' }
              : dare
                ? { background: 'var(--ink)', color: '#fff', boxShadow: '0 3px 0 rgba(23,24,29,0.35)' }
                : { background: '#2A4AAC', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), 0 2px 0 rgba(10,20,70,0.55)' }),
          }
          const aria = `${stat.label}${stat.hint ? ` (${stat.hint.toLowerCase()})` : ''}: ${stat.value ?? 'loading'}${stat.unit ? ` ${stat.unit}` : ''}`
          return stat.href ? (
            <Link key={stat.key} href={stat.href} className={tileBase} style={style} aria-label={aria}>
              {body}
            </Link>
          ) : (
            <button key={stat.key} type="button" onClick={stat.onSelect} aria-pressed={!!stat.selected} aria-label={aria} className={tileBase} style={style}>
              {body}
            </button>
          )
        })}
      </div>
      {action && (
        <div className="cp-tile mt-2.5" style={{ animationDelay: '400ms' }}>
          {action.href ? (
            <Link href={action.href} className={actionClass} style={{ background: dare ? 'var(--ink)' : '#FFFFFF', color: dare ? 'var(--dare)' : 'var(--navy)' }}>
              {action.icon}
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClass} style={{ background: dare ? 'var(--ink)' : '#FFFFFF', color: dare ? 'var(--dare)' : 'var(--navy)' }}>
              {action.icon}
              {action.label}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

/** A face small enough for a tile corner: the photo, or one initial (two would be unreadable at this size). */
export function TinyFace({ name, avatarUrl, ring }: { name: string; avatarUrl?: string | null; ring: string }) {
  const initial = name.replace(/^@/, '').trim().charAt(0).toUpperCase() || '?'
  return (
    <span className="inline-flex size-[22px] items-center justify-center overflow-hidden rounded-full bg-[#5A5C63] text-[10.5px] font-bold text-white" style={{ boxShadow: `0 0 0 2px ${ring}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initial}
    </span>
  )
}

/** For someone with nothing here yet: how this page works, in three steps. */
export function HeroSteps({ tone, steps }: { tone: 'dare' | 'navy'; steps: { icon: React.ReactNode; title: string; body: string }[] }) {
  const dare = tone === 'dare'
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="How it works">
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="cp-tile relative flex min-h-[118px] flex-col rounded-[18px] p-3"
          style={{
            animationDelay: `${120 + i * 110}ms`,
            background: dare ? 'var(--ink)' : 'rgba(255,255,255,0.12)',
            color: '#fff',
            boxShadow: dare ? '0 14px 28px -16px rgba(23,24,29,0.75)' : 'inset 0 0 0 1px rgba(255,255,255,0.16)',
          }}
        >
          <span className="flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-full" style={{ background: dare ? 'var(--dare)' : '#FFFFFF', color: dare ? 'var(--ink)' : 'var(--navy)', boxShadow: 'inset 0 0 0 1.5px #17181D' }}>
              {step.icon}
            </span>
            <span className="text-[12px] font-bold opacity-60">{i + 1}</span>
          </span>
          <span className="mt-auto block pt-2 text-[14px] font-bold leading-tight">{step.title}</span>
          <span className="mt-0.5 block text-[11.5px] leading-snug" style={{ color: dare ? '#B5B4BC' : '#C7D0F7' }}>
            {step.body}
          </span>
        </li>
      ))}
    </ol>
  )
}
