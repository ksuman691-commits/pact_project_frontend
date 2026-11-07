'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/components/pact-ui/useCountUp'
import { useBackToClose } from '@/hooks/useBackToClose'
import { fireConfetti, stopConfetti, type CheckInCelebrationData } from '@/lib/celebrations'
import { EASE, haptic } from '@/lib/motion'
import StreakFlame from './StreakFlame'
import CircleMark from '@/components/brand/CircleMark'

const AUTO_CLOSE_MS = 5000

/**
 * Shown right after a moment posts. The CirclePact mark draws in, today's
 * missing slice closes and a tick lands, and the real
 * numbers count up. It only shows what the app actually knows: the day always,
 * the streak and the circle's progress when the server sent them.
 */
export default function CheckInCelebration({ data, onClose }: { data: CheckInCelebrationData; onClose: () => void }) {
  const reduce = useReducedMotion()
  const day = data.day ?? null
  const [dayTarget, setDayTarget] = useState(day && day > 1 ? day - 1 : day ?? 0)
  const [streakTarget, setStreakTarget] = useState(data.streak?.before ?? 0)
  const [circleTarget, setCircleTarget] = useState(data.circle?.before ?? 0)
  const dayShown = useCountUp(dayTarget, 500)
  const streakShown = useCountUp(streakTarget, 500)
  const circleShown = useCountUp(circleTarget, 500)
  const [flamePop, setFlamePop] = useState(false)
  const [phase, setPhase] = useState<'draw' | 'close'>(reduce ? 'close' : 'draw')

  useBackToClose(true, onClose)

  useEffect(() => {
    const t = reduce ? 0 : 1
    const timers = [
      window.setTimeout(() => {
        haptic(10)
        fireConfetti('small', { y: 0.38 })
        if (day) setDayTarget(day)
      }, t * 1000),
      window.setTimeout(() => {
        if (data.streak) {
          setStreakTarget(data.streak.after)
          setFlamePop(true)
        }
      }, t * 1250),
      window.setTimeout(() => {
        if (data.circle) setCircleTarget(data.circle.after)
      }, t * 1500),
      window.setTimeout(onClose, AUTO_CLOSE_MS),
    ]
    return () => {
      timers.forEach(window.clearTimeout)
      stopConfetti()
    }
    // The data is fixed for the life of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const circle = data.circle
  const barBefore = circle && circle.total > 0 ? (circle.before / circle.total) * 100 : 0
  const barAfter = circle && circle.total > 0 ? (circle.after / circle.total) * 100 : 0

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Checked in"
      data-celebration-open
      onClick={onClose}
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--paper, #F4EFE4)', color: 'var(--ink, #17181D)' }}
      initial={{ opacity: reduce ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
    >
      <div className="relative flex size-[128px] items-center justify-center" aria-hidden="true">
        {/* The mark draws in, then today's missing slice closes with a tick. */}
        {phase === 'draw' ? (
          <CircleMark key="draw" size={112} animation="draw" delay={0.1} onDone={() => setPhase('close')} />
        ) : (
          <CircleMark key="close" size={112} animation="close" tick />
        )}
      </div>

      <div className="mt-[18px] text-[34px] font-extrabold tracking-[-0.03em]" aria-live="polite">
        {day ? (
          <>
            Day {dayShown}
            {data.totalDays ? ` of ${data.totalDays}` : ''}
          </>
        ) : (
          'Checked in'
        )}
      </div>
      {data.title && <div className="mt-1 max-w-[280px] truncate text-[14px] text-[var(--muted,#5A5C63)]">{data.title}</div>}

      {data.streak && (
        <div className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold">
          <StreakFlame pop={flamePop} />
          <span>
            <b>{streakShown}</b>-day streak
          </span>
        </div>
      )}

      {circle && circle.total > 0 && (
        <div className="mt-5 text-[12.5px] text-[var(--muted,#5A5C63)]">
          <b className="text-[var(--ink,#17181D)]">{circle.name || 'Your circle'}</b> · {circleShown} of {circle.total} showed up
          <div className="mx-auto mt-1.5 h-2 w-[200px] overflow-hidden rounded-full" style={{ background: 'var(--hairline, #DCD3C1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--navy, #1F3A93)' }}
              initial={{ width: `${barBefore}%` }}
              animate={{ width: `${reduce ? barAfter : circleTarget === circle.after ? barAfter : barBefore}%` }}
              transition={{ duration: 0.7, ease: EASE }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="mt-7 h-12 w-[200px] rounded-full text-[15px] font-semibold text-white transition active:scale-[0.96]"
        style={{ background: 'var(--navy, #1F3A93)' }}
      >
        Done
      </button>
    </motion.div>
  )
}
