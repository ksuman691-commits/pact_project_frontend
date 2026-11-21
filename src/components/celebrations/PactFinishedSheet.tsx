'use client'

import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { RotateCcw, Share2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import CircleMark, { MarkProgress } from '@/components/brand/CircleMark'
import { useBackToClose } from '@/hooks/useBackToClose'
import { fireConfetti, stopConfetti } from '@/lib/celebrations'
import { EASE, haptic } from '@/lib/motion'

export interface PactFinishedData {
  pactId: number
  title: string
  kept: boolean
  daysPosted: number
  restDays: number
  daysNeeded: number
  totalDays: number
  circleId: number | null
  circleName: string | null
}

function Stat({ value, label, delay }: { value: number; label: string; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="flex flex-1 flex-col items-start rounded-[16px] px-3 py-2.5"
      style={{ background: '#2A4AAC', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), 0 2px 0 rgba(10,20,70,0.55)' }}
      initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : delay, ease: EASE }}
    >
      <span className="text-[26px] font-extrabold leading-none tracking-[-0.03em] text-white">{value}</span>
      <span className="mt-1 text-[12px] font-semibold" style={{ color: '#D4DBFA' }}>
        {label}
      </span>
    </motion.div>
  )
}

/**
 * Shown once, the next time someone opens Home after their pact's last day:
 * the circle closes (kept) or shows how far it got (not kept), the real numbers,
 * and the next step. No guilt either way.
 */
export default function PactFinishedSheet({ data, onClose, onNext }: { data: PactFinishedData; onClose: () => void; onNext: () => void }) {
  const reduce = useReducedMotion()
  useBackToClose(true, onClose)

  const counted = data.daysPosted + data.restDays
  const share = Math.min(1, data.daysNeeded ? counted / data.daysNeeded : 0)

  useEffect(() => {
    if (!data.kept) return
    const timer = window.setTimeout(() => {
      haptic(40)
      fireConfetti('big', { light: true, y: 0.4 })
    }, reduce ? 0 : 900)
    return () => {
      window.clearTimeout(timer)
      stopConfetti()
    }
  }, [data.kept, reduce])

  const onShare = async () => {
    const url = `${window.location.origin}/pacts/${data.pactId}`
    const text = data.kept
      ? `I kept my pact on CirclePact: ${data.title}. ${data.daysPosted} of ${data.totalDays} days.`
      : `${data.daysPosted} days of ${data.title} on CirclePact. Going again.`
    try {
      if (navigator.share) await navigator.share({ title: data.title, text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        toast.success('Link copied')
      }
    } catch {
      // Closed the share sheet: nothing to do.
    }
  }

  const heading = data.kept ? 'You kept it.' : 'Your pact ended.'
  const days = (n: number, word = 'day') => `${n} ${word}${n === 1 ? '' : 's'}`
  const posted = `${days(data.daysPosted)} posted${data.restDays ? ` and ${days(data.restDays, 'rest day')}` : ''}`
  const line = data.kept
    ? `${posted}; you needed ${data.daysNeeded}. ${data.circleName ? `Everyone in ${data.circleName} saw you do it.` : 'Every one of them was you showing up.'}`
    : `${posted}; ${data.daysNeeded} needed to finish. Those days still count toward your CP Score. Go again while it's fresh.`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={data.kept ? `You kept ${data.title}` : `${data.title} ended`}
      data-celebration-open
      className="fixed inset-0 z-[96] flex flex-col overflow-hidden text-white"
      style={{ background: 'linear-gradient(180deg, #2546A6 0%, #1F3A93 55%, #18307D 100%)' }}
    >
      <div className="flex justify-end px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }}>
          <X className="size-5" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <div className="flex flex-1 flex-col justify-center">
        <div className="flex justify-center" aria-hidden="true">
          {data.kept ? (
            <span className="rounded-full p-2.5" style={{ background: '#FFFFFF', boxShadow: '0 0 0 2px #17181D' }}>
              <CircleMark size={112} animation="close" tick />
            </span>
          ) : (
            <span className="flex size-[132px] items-center justify-center rounded-full" style={{ background: '#FFFFFF', boxShadow: '0 0 0 2px #17181D' }}>
              <MarkProgress value={share} size={110} track="rgba(23,24,29,0.12)" />
            </span>
          )}
        </div>

        <motion.p
          className="mt-6 text-center text-[13px] font-bold"
          style={{ color: data.kept ? 'var(--dare)' : '#D4DBFA' }}
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.5 }}
        >
          {data.kept ? 'Pact finished' : 'Pact ended'}
        </motion.p>
        <motion.h2
          className="mt-1 text-center text-[38px] font-extrabold leading-[1.05] tracking-[-0.04em]"
          style={{ color: '#FFFFFF' }}
          initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.6, ease: EASE }}
        >
          {heading}
        </motion.h2>
        <p className="mt-2 line-clamp-2 text-center text-[17px] font-bold">{data.title}</p>
        <p className="mt-0.5 text-center text-[12.5px] font-semibold" style={{ color: '#D4DBFA' }}>{days(data.totalDays)}{data.circleName ? ` · ${data.circleName}` : ''}</p>
        <p className="mx-auto mt-2 max-w-[310px] text-center text-[14px] leading-[1.4]" style={{ color: '#D4DBFA' }}>
          {line}
        </p>

        <div className="mt-6 flex gap-2.5">
          <Stat value={data.daysPosted} label={data.daysPosted === 1 ? "Day posted" : "Days posted"} delay={0.8} />
          {data.restDays > 0 && <Stat value={data.restDays} label={data.restDays === 1 ? "Rest day" : "Rest days"} delay={0.9} />}
          <Stat value={data.daysNeeded} label="Needed" delay={1} />
        </div>

        </div>

        <div className="flex flex-col gap-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          <button
            type="button"
            onClick={onNext}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-white text-[16px] font-extrabold text-[var(--navy)] transition active:scale-[0.98]"
            style={{ boxShadow: '0 0 0 2px #17181D' }}
          >
            {!data.kept && <RotateCcw className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />}
            {data.kept ? 'Start the next one' : 'Go again'}
          </button>
          <button
            type="button"
            onClick={() => void onShare()}
            className="flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white"
            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.7)' }}
          >
            <Share2 className="size-4" strokeWidth={2.4} aria-hidden="true" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
