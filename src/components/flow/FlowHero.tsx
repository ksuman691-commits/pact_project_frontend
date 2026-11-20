'use client'

import { Check, ChevronLeft, X } from 'lucide-react'
import HeroMark from '@/components/brand/HeroMark'

/*
 * The look of the landing tops, carried into the create flows. The coloured
 * top holds the controls, the steps by name, and the live card of the thing
 * you're making, so every answer visibly lands on it. Questions sit below on
 * paper; the main button stays pinned at the bottom.
 */

const INK = '#17181D'

export function StepTrack({ tone, steps, current }: { tone: 'dare' | 'navy'; steps: string[]; current: number }) {
  const dare = tone === 'dare'
  const onColour = dare ? INK : '#FFFFFF'
  const offColour = dare ? 'rgba(23,24,29,0.55)' : 'rgba(255,255,255,0.6)'
  return (
    <ol className="flex items-center justify-center gap-1.5" aria-label={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((label, i) => {
        const done = i < current
        const now = i === current
        return (
          <li key={label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="h-[2px] w-3 rounded-full" style={{ background: done || now ? onColour : offColour, opacity: done || now ? 0.9 : 0.5 }} />}
            <span
              aria-current={now ? 'step' : undefined}
              className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-bold transition-colors"
              style={
                now
                  ? { background: dare ? INK : '#FFFFFF', color: dare ? 'var(--dare)' : 'var(--navy)', boxShadow: `0 0 0 1.5px ${INK}` }
                  : done
                    ? { color: onColour, boxShadow: `inset 0 0 0 1.5px ${dare ? INK : 'rgba(255,255,255,0.7)'}` }
                    : { color: offColour, boxShadow: `inset 0 0 0 1.5px ${dare ? 'rgba(23,24,29,0.25)' : 'rgba(255,255,255,0.3)'}` }
              }
            >
              {done ? <Check className="size-3" strokeWidth={3.2} aria-hidden="true" /> : <span className="tabular-nums">{i + 1}</span>}
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function FlowHero({
  tone,
  steps,
  current,
  onBack,
  onExit,
  children,
}: {
  tone: 'dare' | 'navy'
  steps: string[]
  current: number
  /** Left out on the first step. */
  onBack?: () => void
  onExit: () => void
  /** The live card. */
  children: React.ReactNode
}) {
  const dare = tone === 'dare'
  const roundBtn = 'flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-95'
  const btnStyle: React.CSSProperties = dare
    ? { background: 'rgba(255,255,255,0.55)', color: INK, boxShadow: `inset 0 0 0 1.5px ${INK}` }
    : { background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.45)' }
  return (
    <section
      className={`relative isolate shrink-0 overflow-hidden rounded-b-[30px] px-4 pb-5 pt-[max(0.75rem,env(safe-area-inset-top))] ${dare ? 'text-[var(--ink)]' : 'text-white'}`}
      style={{ background: dare ? 'linear-gradient(180deg, #FFDA5C 0%, #FFD23F 60%)' : 'linear-gradient(180deg, #2546A6 0%, #1F3A93 60%)' }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: -70, top: -78 }}>
        <span className="cp-hero-float block">
          <HeroMark
            size={200}
            color={dare ? '#FFC414' : '#2A4CB0'}
            stroke={dare ? INK : 'rgba(255,255,255,0.55)'}
            ringColor={dare ? 'rgba(23,24,29,0.16)' : 'rgba(255,255,255,0.16)'}
          />
        </span>
      </span>

      <div className="flex items-center gap-2">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back" className={roundBtn} style={btnStyle}>
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </button>
        ) : (
          <span className="size-10 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <StepTrack tone={tone} steps={steps} current={current} />
        </div>
        <button type="button" onClick={onExit} aria-label="Close" className={roundBtn} style={btnStyle}>
          <X className="size-5" strokeWidth={2.4} />
        </button>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Section label inside a step: short, sentence case. */
export function FlowLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <span className="text-[14px] font-bold text-[var(--ink)]">{children}</span>
      {hint && <span className="text-[12.5px] text-[var(--muted)]">{hint}</span>}
    </div>
  )
}

/** A row of choices that reads as one control. */
export function Segmented<T extends string | number>({
  tone,
  value,
  options,
  onChange,
  label,
}: {
  tone: 'dare' | 'navy'
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  const dare = tone === 'dare'
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full bg-[var(--card)] p-1" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="h-10 flex-1 rounded-full px-2 text-[14px] font-bold transition active:scale-[0.97]"
            style={on ? { background: dare ? INK : 'var(--navy)', color: dare ? 'var(--dare)' : '#FFFFFF' } : { color: 'var(--ink)' }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** The button area pinned to the bottom of a step. */
export function FlowFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-[var(--paper)] from-70% to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
      {children}
    </div>
  )
}
