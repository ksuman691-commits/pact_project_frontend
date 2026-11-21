'use client'

import { useState } from 'react'
import CircleMark from '@/components/brand/CircleMark'
import HeroMark from '@/components/brand/HeroMark'

interface PageHeroProps {
  /** Yellow for dares, navy for pacts and circles. */
  tone: 'dare' | 'navy'
  title: string
  /** What this page is, in a few words. Always there, so the page explains itself. */
  tagline?: React.ReactNode
  /** What's happening right now. */
  line?: React.ReactNode
  /** The page is still loading its numbers: the big mark turns until it's done. */
  busy?: boolean
  children?: React.ReactNode
}

const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : 0)
  const dist = 95 + (i % 3) * 38
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, size: 4 + (i % 3) * 2.5, delay: (i % 4) * 30 }
})

/**
 * The coloured top of Dares, Pacts and Circles. The whole top is the colour,
 * like the "Dare sent." screen; a big CirclePact mark sits sunk into it. The
 * mark draws itself when the page opens, closes as you pull down, turns while
 * the page loads, then pops with a crisp ring and sparks when the numbers land. Reduced motion keeps all of it still.
 */
export default function PageHero({ tone, title, tagline, line, busy = false, children }: PageHeroProps) {
  const dare = tone === 'dare'
  const [popKey, setPopKey] = useState(0)

  return (
    <section
      className={`cp-hero relative isolate overflow-hidden rounded-b-[34px] px-5 pb-5 pt-9 ${dare ? 'bg-[var(--dare)] text-[var(--ink)]' : 'bg-[var(--navy)] text-white'}`}
    >
      {/* A flat, even tone: one quiet step lighter at the top. No blur. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{ background: dare ? 'linear-gradient(180deg, #FFDA5C 0%, #FFD23F 55%)' : 'linear-gradient(180deg, #2546A6 0%, #1F3A93 60%)' }}
      />

      {/* The mark, set into the colour: a tone of the background with a crisp 2px edge, and two orbit rings. */}
      <span aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: -66, top: -64 }}>
        <span className="cp-hero-float block">
          <HeroMark
            size={224}
            color={dare ? '#FFC414' : '#2A4CB0'}
            stroke={dare ? '#17181D' : 'rgba(255,255,255,0.55)'}
            ringColor={dare ? 'rgba(23,24,29,0.16)' : 'rgba(255,255,255,0.16)'}
            busy={busy}
            onPop={() => setPopKey((k) => k + 1)}
          />
        </span>
      </span>

      {/* Sparks thrown out by the pop, from the mark's centre. */}
      {popKey > 0 && (
        <span key={popKey} aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: 46, top: 48 }}>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="cp-spark absolute"
              style={{
                width: s.size + 2,
                height: s.size + 2,
                borderRadius: i % 2 ? 999 : 2,
                background: i % 3 === 0 ? '#E5363B' : dare ? '#FFFFFF' : '#FFD23F',
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
        { top: '13%', left: '56%', size: 12, delay: '0s' },
        { top: '8%', left: '68%', size: 9, delay: '1.3s' },
        { top: '30%', left: '83%', size: 10, delay: '2.4s' },
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

      <h1 className="cp-hero-title flex items-center gap-2.5 text-[46px] font-bold leading-none tracking-[-0.05em]" style={{ color: dare ? 'var(--ink)' : '#FFFFFF' }}>
        <span className={`flex size-10 items-center justify-center rounded-full shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)] ${dare ? 'bg-[var(--ink)]' : 'bg-white'}`}>
          <CircleMark size={24} animation="draw" delay={0.15} />
        </span>
        {title}
      </h1>
      {tagline && (
        <p className="cp-hero-title mt-2.5 text-[13px] font-bold" style={{ animationDelay: '80ms', color: dare ? 'rgba(23,24,29,0.62)' : 'rgba(212,219,250,0.85)' }}>
          {tagline}
        </p>
      )}
      {line && (
        <p className="cp-hero-title mt-1 max-w-[222px] text-[16.5px] font-medium leading-[1.3]" style={{ animationDelay: '140ms', color: dare ? 'var(--ink)' : '#FFFFFF' }}>
          {line}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
