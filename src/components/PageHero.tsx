'use client'

import CircleMark from '@/components/brand/CircleMark'

interface PageHeroProps {
  /** Yellow for dares, navy for pacts and circles. */
  tone: 'dare' | 'navy'
  title: string
  /** One live line under the title: what's happening right now. */
  line?: React.ReactNode
  /** Big faint shape drawn behind the title. Defaults to the brand mark. */
  watermark?: React.ReactNode
  children?: React.ReactNode
}

/**
 * The coloured top of Dares, Pacts and Circles. Same idea as the "Dare sent."
 * screen: the whole top of the page is the colour, the title is big, and the
 * numbers and main action sit inside it. Behind it, a soft glow and a slowly
 * drifting oversized mark give it some life (still when reduced motion is on).
 */
export default function PageHero({ tone, title, line, watermark, children }: PageHeroProps) {
  const dare = tone === 'dare'
  return (
    <section
      className={`cp-hero relative isolate overflow-hidden rounded-b-[32px] px-5 pb-4 pt-8 ${dare ? 'bg-[var(--dare)] text-[var(--ink)]' : 'bg-[var(--navy)] text-white'}`}
    >
      {/* Glow: light from the top left, a deeper pool bottom right. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: dare
            ? 'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(245,160,0,0.45), transparent 60%)'
            : 'radial-gradient(110% 80% at 0% 0%, rgba(120,150,255,0.45), transparent 55%), radial-gradient(80% 70% at 100% 100%, rgba(8,18,70,0.75), transparent 60%)',
        }}
      />
      {/* Oversized mark drifting behind the title. */}
      <span aria-hidden="true" className="cp-hero-drift pointer-events-none absolute -right-14 -top-10 -z-10" style={{ opacity: dare ? 0.13 : 0.12 }}>
        {watermark ?? <CircleMark size={240} color={dare ? '#17181D' : '#FFFFFF'} />}
      </span>
      {/* A few sparks. */}
      {[
        { top: '22%', left: '58%', size: 6, delay: '0s' },
        { top: '12%', left: '78%', size: 4, delay: '1.2s' },
        { top: '40%', left: '88%', size: 5, delay: '2.1s' },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="cp-hero-spark pointer-events-none absolute -z-10 rounded-full"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay, background: dare ? '#17181D' : '#FFFFFF' }}
        />
      ))}

      <h1 className="flex items-center gap-2.5 text-[44px] font-bold leading-none tracking-[-0.05em]" style={{ color: dare ? 'var(--ink)' : '#FFFFFF' }}>
        <span className={`flex size-9 items-center justify-center rounded-full ${dare ? 'bg-[var(--ink)]' : 'bg-white'}`}>
          <CircleMark size={22} />
        </span>
        {title}
      </h1>
      {line && <p className={`mt-2 text-[15.5px] font-medium leading-[1.35] ${dare ? 'text-[var(--ink)]' : 'text-[#D4DBFA]'}`}>{line}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
