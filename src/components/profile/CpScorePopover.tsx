'use client'

import Link from 'next/link'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'
import { CountUp } from '@/components/HeroStats'
import { CP_METALS, cpMetal } from '@/components/hero/HeroBadges'
import type { CpScore } from '@/lib/api/cpScore'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const SOFT = '#ECE6D8'
const UP = { background: '#E6F2EA', color: '#22663F' }
const DOWN = { background: '#F8E3DF', color: '#A23B2A' }
const FLAT = { background: '#F3EEE4', color: INK }

/** The score as a metal ring that fills up when the pop-up opens. */
function MetalRing({ score, size = 128 }: { score: number; size?: number }) {
  const reduce = useReducedMotion()
  const metal = CP_METALS[cpMetal(score)]
  const gid = useId().replace(/:/g, '')
  const target = Math.max(0, Math.min(100, score)) / 100
  const [shown, setShown] = useState(reduce ? target : 0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target))
    return () => cancelAnimationFrame(id)
  }, [target])
  const r = 56
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
        <defs>
          <linearGradient id={`r${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={metal.mid} />
            <stop offset="1" stopColor={metal.dark} />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke={SOFT} strokeWidth={11} />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={`url(#r${gid})`}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          transform="rotate(-90 64 64)"
          style={{ transition: reduce ? undefined : 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] font-extrabold leading-none tracking-[-0.05em] tabular-nums" style={{ color: INK }}>
          <CountUp value={Math.round(score)} />
        </span>
        <span className="text-[12px] font-semibold" style={{ color: MUTED }}>of 100</span>
      </div>
    </div>
  )
}

function Trend({ points }: { points: NonNullable<CpScore['trend']> }) {
  if (points.length < 2) return null
  const width = 300
  const height = 72
  const scores = points.map((p) => p.score)
  const lo = Math.max(0, Math.min(...scores) - 6)
  const hi = Math.min(100, Math.max(...scores) + 6)
  const span = Math.max(1, hi - lo)
  const xy = points.map((p, i) => [(i / (points.length - 1)) * width, height - 4 - ((p.score - lo) / span) * (height - 12)])
  const d = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const first = points[0]
  const last = points[points.length - 1]
  const [ex, ey] = xy[xy.length - 1]
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] font-bold" style={{ color: INK }}>
        <span>Last 90 days</span>
        <span style={{ color: MUTED }}>
          {first.score} → {last.score}
        </span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Score over the last 90 days, from ${first.score} to ${last.score}`} className="mt-1.5 block overflow-visible">
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="#E7E1D3" strokeWidth="1" />
        <path d={d} fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="cp-draw-line" />
        <circle cx={ex} cy={ey} r={4} fill={last.score >= first.score ? '#22C55E' : '#E5363B'} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-0.5 flex justify-between text-[11.5px] font-semibold" style={{ color: MUTED }}>
        <span>{new Date(`${first.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function Stat({ label, value, tone, delay }: { label: string; value: React.ReactNode; tone: React.CSSProperties; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between rounded-[12px] px-2.5 py-[7px]"
      style={{ background: tone.background }}
    >
      <span className="text-[12px] font-semibold" style={{ color: tone.color }}>{label}</span>
      <span className="text-[15px] font-extrabold tabular-nums" style={{ color: tone.color }}>{value}</span>
    </motion.div>
  )
}

function delta(n: number) {
  return `${n > 0 ? '▲' : n < 0 ? '▼' : ''}${Math.abs(n)}`
}

/**
 * A quick look at your CP Score, opened from the Pacts tile: the score as a
 * metal ring, how it moved, the 90-day line, and the breakdown on request.
 * Sits just under the tile it came from; the full page stays one tap away.
 */
export default function CpScorePopover({
  open,
  onClose,
  data,
  anchorKey,
  fullHref,
}: {
  open: boolean
  onClose: () => void
  data: CpScore | undefined
  /** `data-stat` of the tile to point at. */
  anchorKey: string
  fullHref: string
}) {
  const reduce = useReducedMotion()
  const [pos, setPos] = useState<{ top: number; arrowX: number; maxH: number } | null>(null)
  const [breakdown, setBreakdown] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const tile = document.querySelector<HTMLElement>(`[data-stat="${anchorKey}"]`)
      const vh = window.innerHeight
      if (!tile) {
        setPos({ top: Math.max(16, vh - 560), arrowX: -1, maxH: Math.min(560, vh - 32) })
        return
      }
      const rect = tile.getBoundingClientRect()
      const top = rect.bottom + 10
      const room = vh - top - 12
      // Not enough room under the tile: rise from the bottom instead.
      if (room < 340) setPos({ top: Math.max(16, vh - Math.min(560, vh - 32) - 12), arrowX: -1, maxH: Math.min(560, vh - 32) })
      else setPos({ top, arrowX: rect.left + rect.width / 2, maxH: room })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, anchorKey])

  useEffect(() => {
    if (!open) return
    setBreakdown(false)
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!breakdown || !scrollRef.current) return
    const el = scrollRef.current
    const id = window.setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }), 60)
    return () => window.clearTimeout(id)
  }, [breakdown, reduce])

  const ready = data && data.status !== 'unavailable' && data.status !== 'building' && data.score != null
  const score = ready ? Math.round(data!.score as number) : null
  const metal = CP_METALS[cpMetal(score)]
  const trend = data?.trend ?? []
  const change90 = trend.length > 1 ? Math.round(trend[trend.length - 1].score - trend[0].score) : null
  const high90 = trend.length ? Math.round(Math.max(...trend.map((t) => t.score))) : null
  const month = data?.change_30d ?? null
  const nextLine =
    score == null
      ? null
      : score >= 75
        ? 'Gold clock earned. Stay at 75 or above to keep it.'
        : score >= 50
          ? `${75 - score} ${75 - score === 1 ? 'point' : 'points'} to the Gold clock.`
          : `${50 - score} ${50 - score === 1 ? 'point' : 'points'} to the Silver clock.`
  const band = data?.is_new ? 'New' : data?.band

  return (
    <AnimatePresence>
      {open && pos && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(14,24,64,0.5)' }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Your CP Score"
            className="absolute left-3 right-3 mx-auto max-w-[420px]"
            style={{ top: pos.top, transformOrigin: pos.arrowX > 0 ? `${pos.arrowX}px 0` : '50% 100%' }}
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {pos.arrowX > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 size-[18px] rotate-45 rounded-[3px]"
                style={{ left: `calc(${pos.arrowX}px - 12px - 9px - max(0px, (100vw - 24px - 420px) / 2))`, background: '#FFFDF8' }}
              />
            )}
            <div
              ref={scrollRef}
              className="relative flex flex-col gap-3.5 overflow-y-auto rounded-[24px] px-4 pb-4 pt-3.5"
              style={{ maxHeight: pos.maxH, background: '#FFFDF8', boxShadow: '0 20px 50px rgba(10,20,60,0.35)', color: INK }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-extrabold tracking-[-0.02em]">Your CP Score</span>
                {score != null && (
                  <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: metal.pillBg, color: metal.pillFg }}>
                    {metal.name}
                    {band ? ` · ${band}` : ''}
                  </span>
                )}
                <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="-mr-2 ml-auto flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
                  <X className="size-5" />
                </button>
              </div>

              {!data ? (
                <div className="mx-auto size-[128px] rounded-full pact-shimmer" aria-hidden="true" />
              ) : data.status === 'unavailable' ? (
                <p className="text-[14px]" style={{ color: MUTED }}>Couldn&apos;t load your score right now. Try again in a minute.</p>
              ) : data.status === 'building' ? (
                <p className="text-[14px] leading-snug" style={{ color: MUTED }}>
                  Day {data.building_day ?? 0} of {data.building_days ?? 7}. Your score shows after your first week.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3.5">
                    <MetalRing score={score as number} />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Stat label="This month" value={month ? delta(month) : '0'} tone={month == null || month === 0 ? FLAT : month > 0 ? UP : DOWN} delay={0.45} />
                      {change90 != null && <Stat label="90 days" value={delta(change90)} tone={change90 === 0 ? FLAT : change90 > 0 ? UP : DOWN} delay={0.58} />}
                      {high90 != null && <Stat label="90-day high" value={high90} tone={FLAT} delay={0.71} />}
                    </div>
                  </div>

                  <Trend points={trend} />

                  {data.status === 'resting' ? (
                    <p className="rounded-[14px] px-3 py-2.5 text-[12.5px] font-semibold leading-snug" style={{ background: '#F3EEE4', color: MUTED }}>
                      No pacts in the last 90 days, so your score is kept as it was. Start a pact to move it again.
                    </p>
                  ) : (
                    nextLine && (
                      <p className="rounded-[14px] px-3 py-2.5 text-[12.5px] font-bold leading-snug" style={{ background: metal.pillBg, color: metal.pillFg }}>
                        {nextLine}
                      </p>
                    )
                  )}

                  {(data.parts ?? []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBreakdown((b) => !b)}
                      aria-expanded={breakdown}
                      className="mx-auto -my-1 flex min-h-11 items-center gap-1 rounded-full px-3 text-[12.5px] font-bold"
                      style={{ color: NAVY }}
                    >
                      {breakdown ? 'Hide breakdown' : 'See breakdown'}
                      <ChevronDown className="size-4 transition-transform" style={{ transform: breakdown ? 'rotate(180deg)' : undefined }} aria-hidden="true" />
                    </button>
                  )}

                  <AnimatePresence initial={false}>
                    {breakdown && (
                      <motion.div
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-3.5 border-t pt-3.5" style={{ borderColor: SOFT }}>
                          {(data.parts ?? []).map((part, i) => (
                            <div key={part.key} className="flex flex-col gap-1.5">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[14px] font-extrabold">{part.name}</span>
                                <span className="text-[13px] font-extrabold">
                                  {part.got}
                                  <span className="font-semibold" style={{ color: MUTED }}> of {part.max}</span>
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: SOFT }} aria-hidden="true">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: NAVY, transformOrigin: 'left', width: `${Math.round((part.got / Math.max(1, part.max)) * 100)}%` }}
                                  initial={reduce ? false : { scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                />
                              </div>
                              <span className="text-[12px] leading-snug" style={{ color: MUTED }}>{part.why}</span>
                            </div>
                          ))}
                          {(data.penalty ?? 0) > 0 && (
                            <p className="rounded-[12px] px-3 py-2 text-[12px] font-semibold" style={DOWN}>
                              −{data.penalty} for things that bring it down.
                            </p>
                          )}
                          <p className="text-[12px] leading-snug" style={{ color: MUTED }}>
                            How reliably you do what you say, from the last 90 days. Everyone who visits your profile sees it.{' '}
                            <Link href={fullHref} onClick={onClose} className="font-bold underline underline-offset-2" style={{ color: NAVY }}>
                              What&apos;s moving it
                            </Link>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
