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
 * the page loads, then pops with a ring and sparks and a sheen of light runs
 * across when the numbers land. Reduced motion keeps all of it still.
 */
export default function PageHero({ tone, title, tagline, line, busy = false, children }: PageHeroProps) {
  const dare = tone === 'dare'
  const [popKey, setPopKey] = useState(0)

  return (
    <section
      className={`cp-hero relative isolate overflow-hidden rounded-b-[34px] px-5 pb-5 pt-9 ${dare ? 'bg-[var(--dare)] text-[var(--ink)]' : 'bg-[var(--navy)] text-white'}`}
    >
      {/* Glow: light from the top left, a deeper pool bottom right. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background: dare
            ? 'radial-gradient(120% 75% at 0% 0%, rgba(255,255,255,0.6), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(245,150,0,0.5), transparent 60%)'
            : 'radial-gradient(110% 80% at 0% 0%, rgba(110,145,255,0.55), transparent 55%), radial-gradient(80% 70% at 100% 100%, rgba(6,14,60,0.85), transparent 60%)',
        }}
      />

      {/* The mark, sunk into the colour: faded at its edges like it's under water. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -z-10"
        style={{
          right: -92,
          top: -46,
          opacity: dare ? 0.55 : 0.5,
          mixBlendMode: dare ? 'multiply' : 'screen',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 55%, transparent 100%)',
          maskImage: 'radial-gradient(closest-side, #000 55%, transparent 100%)',
        }}
      >
        <span className="cp-hero-float block">
          <HeroMark size={300} color={dare ? '#E5363B' : '#FF5A5F'} busy={busy} onPop={() => setPopKey((k) => k + 1)} />
        </span>
      </span>

      {/* Sparks thrown out by the pop, from the mark's centre. */}
      {popKey > 0 && (
        <span key={popKey} aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: 58, top: 104 }}>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="cp-spark absolute rounded-full"
              style={{
                width: s.size,
                height: s.size,
                background: i % 3 === 0 ? '#E5363B' : dare ? '#17181D' : '#FFFFFF',
                animationDelay: `${s.delay}ms`,
                ['--dx' as string]: `${s.dx}px`,
                ['--dy' as string]: `${s.dy}px`,
              }}
            />
          ))}
        </span>
      )}

      {/* A sheen of light across the whole top when fresh numbers land. */}
      {popKey > 0 && <span key={`sheen-${popKey}`} aria-hidden="true" className="cp-hero-sheen pointer-events-none absolute inset-0 -z-10" />}

      {/* Slow twinkles. */}
      {[
        { top: '18%', left: '52%', size: 5, delay: '0s' },
        { top: '9%', left: '70%', size: 3.5, delay: '1.3s' },
        { top: '36%', left: '46%', size: 4, delay: '2.4s' },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="cp-hero-spark pointer-events-none absolute -z-10 rounded-full"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay, background: dare ? '#17181D' : '#FFFFFF' }}
        />
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
        <p className="cp-hero-title mt-1 max-w-[290px] text-[16.5px] font-medium leading-[1.3]" style={{ animationDelay: '140ms', color: dare ? 'var(--ink)' : '#FFFFFF' }}>
          {line}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
