'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { MARK_RED, MARK_START, MARK_SWEEP, piePath } from '@/lib/circleMark'
import { PULL_EVENT } from '@/components/PullToRefresh'

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]
const easeInOut: [number, number, number, number] = [0.65, 0, 0.35, 1]

interface HeroMarkProps {
  size: number
  color?: string
  /** The page is loading: the mark keeps turning until it's done, then pops. */
  busy?: boolean
  /** Called at the moment of the pop, for the sparks around it. */
  onPop?: () => void
  className?: string
  style?: React.CSSProperties
}

/**
 * The big mark sunk into the coloured top of Dares, Pacts and Circles.
 *
 *   opening the page  it sweeps round into shape
 *   pulling down      the missing slice closes with your finger
 *   loading           it turns
 *   data in           it closes with a pop and a ring, then opens again
 *
 * Reduced motion: it just sits there.
 */
export default function HeroMark({ size, color = MARK_RED, busy = false, onPop, className, style }: HeroMarkProps) {
  const reduce = useReducedMotion()
  const [sweep, setSweep] = useState(reduce ? MARK_SWEEP : 0)
  const [rot, setRot] = useState(reduce ? 0 : -140)
  const [scale, setScale] = useState(reduce ? 1 : 0.82)
  const [burst, setBurst] = useState(0)

  const live = useRef({ rot: reduce ? 0 : -140, sweep: reduce ? MARK_SWEEP : 0, spinning: false, pulling: false, drawn: !!reduce })
  const controls = useRef<{ stop: () => void }[]>([])
  const raf = useRef<number | null>(null)
  const popRef = useRef(onPop)
  popRef.current = onPop

  const stopAll = () => {
    controls.current.forEach((c) => c.stop())
    controls.current = []
  }
  const tween = (from: number, to: number, duration: number, onUpdate: (v: number) => void, ease: any = easeOut) =>
    new Promise<void>((resolve) => {
      controls.current.push(animate(from, to, { duration, ease, onUpdate, onComplete: () => resolve() }))
    })
  const setR = (v: number) => {
    live.current.rot = v
    setRot(v)
  }
  const setS = (v: number) => {
    live.current.sweep = v
    setSweep(v)
  }

  const startSpin = () => {
    if (live.current.spinning) return
    live.current.spinning = true
    let last = performance.now()
    const step = (now: number) => {
      // About one turn a second, a touch faster than a clock hand so it reads as "working".
      setR(live.current.rot + (now - last) * 0.38)
      last = now
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const pop = async () => {
    stopAll()
    const from = live.current.sweep
    await tween(from, 360, 0.26, setS, easeInOut)
    popRef.current?.()
    tween(0, 1, 0.75, setBurst)
    await tween(0, 1, 0.34, (t) => setScale(1 + 0.12 * Math.sin(Math.PI * t)), 'linear')
    await new Promise((r) => setTimeout(r, 420))
    if (live.current.spinning || live.current.pulling) return
    await tween(360, MARK_SWEEP, 0.5, setS, easeInOut)
    setBurst(0)
  }

  const stopSpinThenPop = async () => {
    if (!live.current.spinning) return
    live.current.spinning = false
    if (raf.current != null) cancelAnimationFrame(raf.current)
    raf.current = null
    // Glide to upright so the slice ends where it belongs, then pop.
    const from = live.current.rot
    const to = Math.ceil((from + 90) / 360) * 360
    await tween(from, to, 0.55, setR)
    setR(0)
    await pop()
  }

  // Opening: sweep into shape.
  useEffect(() => {
    if (reduce) return
    ;(async () => {
      await Promise.all([
        tween(0, MARK_SWEEP, 1.05, setS),
        tween(-140, 0, 1.15, (v) => {
          if (!live.current.spinning) setR(v)
        }),
        tween(0.82, 1, 1.1, setScale),
      ])
      live.current.drawn = true
    })()
    return () => {
      stopAll()
      if (raf.current != null) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  // Loading from the page itself.
  useEffect(() => {
    if (reduce) return
    if (busy) startSpin()
    else void stopSpinThenPop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, reduce])

  // Pull to refresh.
  useEffect(() => {
    if (reduce) return
    const onPull = (event: Event) => {
      const { progress, refreshing } = (event as CustomEvent<{ progress: number; refreshing: boolean }>).detail || { progress: 0, refreshing: false }
      if (refreshing) {
        live.current.pulling = false
        setS(MARK_SWEEP + 30)
        startSpin()
        return
      }
      if (live.current.spinning) {
        // Refresh finished.
        void stopSpinThenPop()
        return
      }
      if (progress > 0) {
        live.current.pulling = true
        stopAll()
        setS(MARK_SWEEP + 45 * progress)
        setScale(1 + 0.07 * progress)
      } else if (live.current.pulling) {
        // Let go before the threshold: open back up.
        live.current.pulling = false
        tween(live.current.sweep, MARK_SWEEP, 0.35, setS)
        tween(1.07, 1, 0.35, setScale)
      }
    }
    window.addEventListener(PULL_EVENT, onPull)
    return () => window.removeEventListener(PULL_EVENT, onPull)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={`overflow-visible ${className ?? ''}`} style={style}>
      {burst > 0 && burst < 1 && (
        <>
          <circle cx="50" cy="50" r={50 + 34 * burst} fill="none" stroke={color} strokeWidth={5 * (1 - burst) + 0.5} opacity={1 - burst} />
          <circle cx="50" cy="50" r={50 + 18 * burst} fill="none" stroke={color} strokeWidth={2} opacity={(1 - burst) * 0.6} />
        </>
      )}
      <g transform={`rotate(${rot} 50 50) translate(50 50) scale(${scale}) translate(-50 -50)`}>
        <path d={piePath(50, 50, 50, sweep, MARK_START)} fill={color} />
      </g>
    </svg>
  )
}
