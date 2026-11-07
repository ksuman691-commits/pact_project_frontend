'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { MARK_DARK, MARK_ON_DISC, MARK_RED, MARK_START, MARK_SWEEP, piePath } from '@/lib/circleMark'

/*
 * The CirclePact mark and its animations. Everything is drawn in a 100×100
 * box: the red pie has radius 50 on its own ("mark"), or sits on a dark disc
 * ("disc", the full logo / app icon).
 *
 *   <CircleMark />                 still mark
 *   <CircleMark animation="draw" /> sweeps round and stops one slice short (app open, empty states)
 *   <CircleMark animation="close" /> the missing slice fills in with a pop (a day done)
 *   <MarkTicker />                 loading: the gap steps round like a clock hand
 *   <MarkProgress value={0.6} />   a pie showing how far along something is
 */

type Variant = 'mark' | 'disc'

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]

function Frame({
  size,
  variant,
  color,
  discColor,
  rotate = 0,
  scale = 1,
  d,
  title,
  className,
  style,
  children,
  overlay,
}: {
  size: number
  variant: Variant
  color: string
  discColor: string
  rotate?: number
  scale?: number
  d: string
  title?: string
  className?: string
  style?: CSSProperties
  children?: React.ReactNode
  overlay?: React.ReactNode
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 overflow-visible ${className ?? ''}`}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {variant === 'disc' && <circle cx="50" cy="50" r="50" fill={discColor} />}
      {children}
      <g transform={`rotate(${rotate} 50 50) translate(50 50) scale(${scale}) translate(-50 -50)`}>
        <path d={d} fill={color} />
      </g>
      {overlay}
    </svg>
  )
}

export interface CircleMarkProps {
  size?: number
  variant?: Variant
  color?: string
  discColor?: string
  /** 'draw' sweeps in on mount; 'close' fills the slice (plays when `play` turns true, default on mount). */
  animation?: 'none' | 'draw' | 'close'
  play?: boolean
  delay?: number
  /** For 'close': open the slice again afterwards (default: stay closed). */
  reopen?: boolean
  /** For 'close': draw a white tick on the closed circle. */
  tick?: boolean
  onDone?: () => void
  title?: string
  className?: string
  style?: CSSProperties
}

export default function CircleMark({
  size = 24,
  variant = 'mark',
  color = MARK_RED,
  discColor = MARK_DARK,
  animation = 'none',
  play = true,
  delay = 0,
  reopen = false,
  tick = false,
  onDone,
  title,
  className,
  style,
}: CircleMarkProps) {
  const reduce = useReducedMotion()
  const r = variant === 'disc' ? 50 * MARK_ON_DISC : 50
  const startSweep = animation === 'draw' && !reduce ? 0 : MARK_SWEEP
  const [sweep, setSweep] = useState(startSweep)
  const [scale, setScale] = useState(1)
  const [burst, setBurst] = useState(0)
  const [tickShown, setTickShown] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (animation === 'none' || !play) return
    if (reduce) {
      setSweep(animation === 'close' && !reopen ? 360 : MARK_SWEEP)
      if (animation === 'close' && tick && !reopen) setTickShown(true)
      doneRef.current?.()
      return
    }
    let cancelled = false
    const controls: { stop: () => void }[] = []
    const run = (from: number, to: number, duration: number, onUpdate: (v: number) => void, ease: any = easeOut) =>
      new Promise<void>((resolve) => {
        controls.push(animate(from, to, { duration, ease, onUpdate, onComplete: () => resolve() }))
      })
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))
    ;(async () => {
      await wait(delay * 1000)
      if (cancelled) return
      if (animation === 'draw') {
        await run(0, MARK_SWEEP, 0.62, setSweep)
        if (cancelled) return
        await run(0, 1, 0.22, (t) => setScale(1 + 0.06 * Math.sin(Math.PI * t)), 'linear')
      } else {
        await run(MARK_SWEEP, 360, 0.28, setSweep, [0.65, 0, 0.35, 1])
        if (cancelled) return
        run(0, 1, 0.55, setBurst)
        if (tick) setTickShown(true)
        await run(0, 1, 0.3, (t) => setScale(1 + 0.14 * Math.sin(Math.PI * t)), 'linear')
        if (reopen && !cancelled) {
          await wait(650)
          setTickShown(false)
          await run(360, MARK_SWEEP, 0.42, setSweep, [0.65, 0, 0.35, 1])
        }
      }
      if (!cancelled) doneRef.current?.()
    })()
    return () => {
      cancelled = true
      controls.forEach((c) => c.stop())
    }
  }, [animation, play, reduce, delay, reopen, tick])

  return (
    <Frame
      size={size}
      variant={variant}
      color={color}
      discColor={discColor}
      scale={scale}
      d={piePath(50, 50, r, sweep, MARK_START)}
      title={title}
      className={className}
      style={style}
      overlay={
        tickShown ? (
        <path
          d={`M${50 - r * 0.42} ${50 + r * 0.02} L${50 - r * 0.1} ${50 + r * 0.34} L${50 + r * 0.45} ${50 - r * 0.3}`}
          fill="none"
          stroke="#fff"
          strokeWidth={r * 0.16}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: `scale(${scale})`, transformOrigin: '50px 50px' }}
        />
        ) : null
      }
    >
      {burst > 0 && burst < 1 && (
        <circle cx="50" cy="50" r={r + 28 * burst} fill="none" stroke={color} strokeWidth={4 * (1 - burst) + 1} opacity={1 - burst} />
      )}
    </Frame>
  )
}

/** Loading: the gap steps round like a clock hand, eight ticks to go once round. */
export function MarkTicker({
  size = 28,
  variant = 'mark',
  color = MARK_RED,
  label = 'Loading',
  className,
  style,
}: {
  size?: number
  variant?: Variant
  color?: string
  label?: string
  className?: string
  style?: CSSProperties
}) {
  const r = variant === 'disc' ? 50 * MARK_ON_DISC : 50
  return (
    <span role="status" aria-label={label} className={`inline-flex shrink-0 ${className ?? ''}`} style={style}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="overflow-visible">
        {variant === 'disc' && <circle cx="50" cy="50" r="50" fill={MARK_DARK} />}
        <g className="cp-mark-tick">
          <path d={piePath(50, 50, r, MARK_SWEEP)} fill={color} />
        </g>
      </svg>
    </span>
  )
}

/**
 * How far along something is, as a pie filling clockwise from 12 o'clock over
 * a faint track. 1 = a closed circle. Animates from 0 on mount (or between values).
 */
export function MarkProgress({
  value,
  size = 16,
  color = MARK_RED,
  track = 'rgba(23,24,29,0.12)',
  animateIn = true,
  title,
  className,
  style,
}: {
  value: number
  size?: number
  color?: string
  track?: string
  animateIn?: boolean
  title?: string
  className?: string
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()
  const target = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const [shown, setShown] = useState(animateIn && !reduce ? 0 : target)
  const shownRef = useRef(shown)
  shownRef.current = shown
  useEffect(() => {
    if (reduce) {
      setShown(target)
      return
    }
    const c = animate(shownRef.current, target, { duration: 0.7, ease: easeOut, onUpdate: setShown })
    return () => c.stop()
  }, [target, reduce])
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 ${className ?? ''}`}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <circle cx="50" cy="50" r="50" fill={track} />
      <path d={piePath(50, 50, 50, shown * 360, 90, true)} fill={color} />
    </svg>
  )
}

/** Pull to refresh: the gap closes as you pull (0–1). */
export function MarkPull({ progress, size = 28, color = MARK_RED }: { progress: number; size?: number; color?: string }) {
  const p = Math.max(0, Math.min(1, progress))
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="overflow-visible">
      <g transform={`translate(50 50) scale(${1 + 0.06 * p}) translate(-50 -50)`}>
        <path d={piePath(50, 50, 50, MARK_SWEEP + 45 * p)} fill={color} />
      </g>
    </svg>
  )
}
