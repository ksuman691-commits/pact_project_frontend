'use client'

import CircleMark from '@/components/brand/CircleMark'
import { Link2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { fireConfetti, stopConfetti } from '@/lib/celebrations'
import { EASE, haptic } from '@/lib/motion'

const MAX_DOTS = 30

/**
 * "Your pact is live": a full navy screen, deliberately a different register
 * from the rest of the flow. The title types in, Day 1 is stamped, and the days
 * ahead appear as empty dots to fill. The next step is inviting people.
 */
export default function PactLiveBeat({
  title,
  days,
  hasDay1,
  subtitle,
  inviteLabel,
  message,
  onInvite,
  onCopy,
  onOpen,
}: {
  title: string
  days: number
  hasDay1: boolean
  subtitle: string
  inviteLabel: string
  /** What gets shared, shown so people know what they're sending. */
  message?: string
  onInvite: () => void
  onCopy?: () => void
  onOpen: () => void
}) {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [typed, setTyped] = useState(reduce ? title : '')
  const dots = Math.min(Math.max(days, 1), MAX_DOTS)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (reduce) {
      setTyped(title)
      return
    }
    const timers: number[] = []
    Array.from(title).forEach((_, i) => timers.push(window.setTimeout(() => setTyped(title.slice(0, i + 1)), 350 + i * 32)))
    timers.push(
      window.setTimeout(() => {
        haptic(30)
        fireConfetti('medium', { light: true, y: 0.55 })
      }, 1150),
    )
    return () => {
      timers.forEach(window.clearTimeout)
      stopConfetti()
    }
  }, [title, reduce])

  if (!mounted) return null
  const rise = (delay: number) => ({
    initial: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: reduce ? 0 : delay, ease: EASE },
  })

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your pact is live"
      data-celebration-open
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center px-6 text-center text-white"
      style={{ background: 'var(--navy, #1F3A93)' }}
    >
      <CircleMark size={44} variant="disc" discColor="rgba(255,255,255,0.12)" animation="draw" className="mb-3" />
      <motion.div {...rise(0.05)} className="text-[12px] font-bold uppercase tracking-[0.14em] opacity-75">
        Your pact is live
      </motion.div>
      <h2 className="mb-4 mt-2.5 min-h-[64px] max-w-[300px] text-[26px] font-extrabold leading-[1.15] tracking-[-0.03em]" style={{ color: '#FFFFFF' }} aria-label={title}>
        {typed}
      </h2>

      <motion.div
        className="flex size-[92px] items-center justify-center rounded-full text-[28px] font-extrabold"
        style={{ border: `4px ${hasDay1 ? 'solid' : 'dashed'} rgba(255,255,255,${hasDay1 ? 1 : 0.55})`, opacity: hasDay1 ? 1 : 0.85 }}
        initial={reduce ? { scale: 1, rotate: -6 } : { scale: 2.6, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, opacity: hasDay1 ? 1 : 0.85 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: reduce ? 0 : 0.9 }}
        aria-hidden="true"
      >
        D1
      </motion.div>

      <div className="mx-auto mt-5 grid w-[240px] grid-cols-[repeat(15,1fr)] gap-[5px]" aria-hidden="true">
        {Array.from({ length: dots }).map((_, i) => (
          <motion.i
            key={i}
            className="block h-[10px] rounded-full"
            style={{ border: '1.5px solid rgba(255,255,255,0.4)', background: i === 0 && hasDay1 ? '#FFFFFF' : 'transparent', borderColor: i === 0 && hasDay1 ? '#FFFFFF' : undefined }}
            initial={reduce ? false : { opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: reduce ? 0 : 1.3 + i * 0.022 }}
          />
        ))}
      </div>

      <motion.div {...rise(1.9)} className="mb-4 mt-3 text-[12.5px] opacity-80">
        {subtitle} · {days} {days === 1 ? 'day' : 'days'}
      </motion.div>
      {message && (
        <motion.p
          {...rise(2.0)}
          className="mb-4 w-full max-w-[320px] rounded-[16px] px-4 py-3 text-left text-[13.5px] leading-[1.45]"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          {message}
        </motion.p>
      )}
      <motion.button
        type="button"
        onClick={onInvite}
        {...rise(2.1)}
        className="flex h-[52px] w-full max-w-[320px] items-center justify-center gap-2 rounded-full bg-white text-[16px] font-bold active:scale-[0.97]"
        style={{ color: 'var(--navy, #1F3A93)' }}
      >
        <Send className="size-[18px]" aria-hidden="true" />
        {inviteLabel}
      </motion.button>
      {onCopy && (
        <motion.button
          type="button"
          onClick={onCopy}
          {...rise(2.15)}
          className="mt-2.5 flex h-[52px] w-full max-w-[320px] items-center justify-center gap-2 rounded-full text-[16px] font-bold text-white active:scale-[0.97]"
          style={{ border: '1.5px solid rgba(255,255,255,0.85)' }}
        >
          <Link2 className="size-[18px]" aria-hidden="true" />
          Copy message
        </motion.button>
      )}
      <motion.button
        type="button"
        onClick={onOpen}
        {...rise(2.2)}
        className="mt-4 text-[15px] font-bold text-white underline decoration-white/60 underline-offset-4 active:opacity-70"
      >
        Go to pact
      </motion.button>
    </div>,
    document.body,
  )
}
