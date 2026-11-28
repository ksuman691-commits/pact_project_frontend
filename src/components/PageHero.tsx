'use client'

import { useState } from 'react'
import Link from 'next/link'
import CircleMark from '@/components/brand/CircleMark'
import HeroMark from '@/components/brand/HeroMark'

interface PageHeroProps {
  /** Yellow for dares, navy for pacts, red for circles: each tab has its own colour. */
  tone: 'dare' | 'navy' | 'circle'
  title: string
  /** What this page is, in a few words. Always there, so the page explains itself. */
  tagline?: React.ReactNode
  /** What's happening right now. */
  line?: React.ReactNode
  /** The page is still loading its numbers: the big mark turns until it's done. */
  busy?: boolean
  /** The page's main action, as a pill beside the title (New pact, Send a dare, New circle). */
  action?: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }
  children?: React.ReactNode
}

const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : 0)
  const dist = 60 + (i % 3) * 26
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, size: 4 + (i % 3) * 2.5, delay: (i % 4) * 30 }
})

/**
 * The coloured top of Dares (yellow), Pacts (navy) and Circles (red). The whole top is the colour,
 * like the "Dare sent." screen; a big CirclePact mark sits sunk into it. The
 * mark draws itself when the page opens, closes as you pull down, turns while
 * the page loads, then pops with a crisp ring and sparks when the numbers land. Reduced motion keeps all of it still.
 */
export default function PageHero({ tone, title, tagline, line, busy = false, action, children }: PageHeroProps) {
  const dare = tone === 'dare'
  const circle = tone === 'circle'
  const [popKey, setPopKey] = useState(0)

  return (
    <section
      className={`cp-hero relative isolate overflow-hidden rounded-b-[26px] px-4 pb-3.5 pt-4 ${dare ? 'bg-[var(--dare)] text-[var(--ink)]' : circle ? 'bg-[var(--circles)] text-white' : 'bg-[var(--navy)] text-white'}`}
    >
      {/* A flat, even tone: one quiet step lighter at the top. No blur. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{ background: dare ? 'linear-gradient(180deg, #FFDA5C 0%, #FFD23F 55%)' : circle ? 'linear-gradient(180deg, #EC4A4F 0%, #E5363B 60%)' : 'linear-gradient(180deg, #2546A6 0%, #1F3A93 60%)' }}
      />

      {/* The mark, set into the colour: a tone of the background with a crisp 2px edge, and two orbit rings. */}
      <span aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: -46, top: -50 }}>
        <span className="cp-hero-float block">
          <HeroMark
            size={140}
            color={dare ? '#FFC414' : circle ? '#EF5256' : '#2A4CB0'}
            stroke={dare ? '#17181D' : 'rgba(255,255,255,0.55)'}
            ringColor={dare ? 'rgba(23,24,29,0.16)' : 'rgba(255,255,255,0.16)'}
            busy={busy}
            onPop={() => setPopKey((k) => k + 1)}
          />
        </span>
      </span>

      {/* Sparks thrown out by the pop, from the mark's centre. */}
      {popKey > 0 && (
        <span key={popKey} aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: 24, top: 20 }}>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="cp-spark absolute"
              style={{
                width: s.size + 2,
                height: s.size + 2,
                borderRadius: i % 2 ? 999 : 2,
                background: i % 3 === 0 ? (circle ? '#FFFFFF' : '#E5363B') : dare ? '#FFFFFF' : '#FFD23F',
                boxShadow: '0 0 0 1.5px #17181D',
                animationDelay: `${s.delay}ms`,
                ['--dx' as string]: `${s.dx}px`,
                ['--dy' as string]: `${s.dy}px`,
              }}
            />
          ))}
        </span>
      )}


      {/* Three small four-point stars that twinkle. */}
      {[
        { top: '10%', left: '52%', size: 9, delay: '0s' },
        { top: '24%', left: '62%', size: 7, delay: '1.3s' },
      ].map((s, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="-1 -1 14 14"
          width={s.size}
          height={s.size}
          className="cp-hero-spark pointer-events-none absolute -z-10"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          <path d="M6 0Q7 5 12 6Q7 7 6 12Q5 7 0 6Q5 5 6 0Z" fill={dare ? '#FFFFFF' : '#FFD23F'} stroke="#17181D" strokeWidth={1} strokeLinejoin="round" />
        </svg>
      ))}

      {/* Kept short on purpose: title and the main action on one line, then one line of news. */}
      <div className="flex items-center gap-3">
        <h1 className="cp-hero-title flex min-w-0 flex-1 items-center gap-2 text-[28px] font-bold leading-none tracking-[-0.04em]" style={{ color: dare ? 'var(--ink)' : '#FFFFFF' }}>
          <span className={`flex size-7 shrink-0 items-center justify-center rounded-full shadow-[0_4px_10px_-4px_rgba(0,0,0,0.45)] ${dare ? 'bg-[var(--ink)]' : 'bg-white'}`}>
            <CircleMark size={17} animation="draw" delay={0.15} />
          </span>
          <span className="truncate">{title}</span>
        </h1>
        {action &&
          (() => {
            const className = 'cp-hero-cta relative flex h-9 shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3.5 text-[13.5px] font-extrabold shadow-[0_4px_12px_-6px_rgba(0,0,0,0.5)] transition active:scale-95'
            const style = { background: dare ? 'var(--ink)' : '#FFFFFF', color: dare ? 'var(--dare)' : circle ? 'var(--circles-deep)' : 'var(--navy)' }
            return action.href ? (
              <Link href={action.href} className={className} style={style}>
                {action.icon}
                {action.label}
              </Link>
            ) : (
              <button type="button" onClick={action.onClick} className={className} style={style}>
                {action.icon}
                {action.label}
              </button>
            )
          })()}
      </div>
      {(line || tagline) && (
        <p className="cp-hero-title mt-1.5 line-clamp-2 max-w-[88%] text-[13.5px] font-medium leading-[1.35]" style={{ animationDelay: '100ms', color: dare ? 'var(--ink)' : '#FFFFFF' }}>
          {line ?? tagline}
        </p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </section>
  )
}
