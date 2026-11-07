'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/components/pact-ui/useCountUp'
import { useBackToClose } from '@/hooks/useBackToClose'
import { fireConfetti, stopConfetti, type MilestoneCelebrationData } from '@/lib/celebrations'
import { haptic } from '@/lib/motion'
import { MarkProgress } from '@/components/brand/CircleMark'

const STREAK_LINES: Record<number, string> = {
  3: 'A streak is forming.',
  7: 'A full week without missing a day.',
  14: 'Two weeks without missing a day.',
  30: 'A full month without missing a day.',
}

function copy(data: MilestoneCelebrationData): { title: string; line: string } {
  const { type, value } = data.milestone
  if (type === 'halfway') return { title: 'Halfway there', line: `Day ${data.day ?? value} of ${data.totalDays ?? ''}. The rest is the same as today.`.replace(' of .', '.') }
  if (type === 'final_day') return { title: 'Final day', line: 'The last day of your pact. Finish strong.' }
  if (type === 'comeback') {
    const missed = `${value} ${value === 1 ? 'day' : 'days'}`
    return data.milestone.within_48h
      ? { title: "You're back", line: `You missed ${missed} and came straight back, so ${value === 1 ? 'it costs' : 'they cost'} only half. Keep it going today.` }
      : { title: "You're back", line: `${missed} away, and you came back. That's the hard part. Day one of a new streak.` }
  }
  return { title: `${value}-day streak`, line: STREAK_LINES[value] ?? `${value} days in a row.` }
}

/**
 * Shown after the check-in screen, only at a real threshold the server reports:
 * a streak of 3, 7, 14, 30 days, or a pact's halfway and final day.
 */
export default function MilestoneSheet({ data, onClose }: { data: MilestoneCelebrationData; onClose: () => void }) {
  const reduce = useReducedMotion()
  const isStreak = data.milestone.type === 'streak'
  const isComeback = data.milestone.type === 'comeback'
  const target = isStreak ? data.milestone.value : 0
  const [count, setCount] = useState(0)
  const shown = useCountUp(count, 900)
  const { title, line } = copy(data)
  const dots = isStreak && data.milestone.value <= 7 ? data.milestone.value : 0
  const [filled, setFilled] = useState(reduce ? dots : 0)

  useBackToClose(true, onClose)

  useEffect(() => {
    const t = reduce ? 0 : 1
    const timers = [
      window.setTimeout(() => setCount(target), t * 500),
      window.setTimeout(() => {
        haptic(30)
        fireConfetti('small', { y: 0.55 })
      }, t * 650),
    ]
    for (let i = 1; i <= dots; i += 1) timers.push(window.setTimeout(() => setFilled(i), t * (550 + i * 110)))
    return () => {
      timers.forEach(window.clearTimeout)
      stopConfetti()
    }
    // The data is fixed for the life of this sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const progress = data.totalDays && data.day ? Math.min(1, data.day / data.totalDays) : 0.5

  return (
    <div role="dialog" aria-modal="true" aria-label={title} data-celebration-open className="fixed inset-0 z-[95] flex items-end justify-center">
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(23,24,29,0.5)' }}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="relative w-full max-w-md rounded-t-[28px] px-[22px] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3.5 text-center"
        style={{ background: 'var(--paper, #F4EFE4)', color: 'var(--ink, #17181D)' }}
        initial={{ y: reduce ? 0 : '105%' }}
        animate={{ y: 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="mx-auto mb-3.5 h-1 w-[38px] rounded-full" style={{ background: 'var(--seat-border, #CFC5B0)' }} aria-hidden="true" />

        <div className="relative mx-auto size-24" aria-hidden="true">
          {isStreak || isComeback ? (
            <>
              {!reduce && (
                <motion.span
                  className="absolute -inset-1.5 rounded-full"
                  style={{ border: '2px solid var(--navy, #1F3A93)' }}
                  initial={{ opacity: 0.7, scale: 0.7 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  transition={{ duration: 1.2, delay: 0.5, repeat: 1, ease: 'easeOut' }}
                />
              )}
              <motion.svg
                viewBox="0 0 24 24"
                className="size-24"
                style={{ originY: 0.9 }}
                initial={{ scale: reduce ? 1 : 0.2, opacity: reduce ? 1 : 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14, delay: reduce ? 0 : 0.35 }}
              >
                <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 .5 2 1.5 2.5 2 2 0-3-1-5 1-8z" fill="var(--like, #E11D48)" />
              </motion.svg>
            </>
          ) : (
            <span className="flex size-24 items-center justify-center">
              {/* How far through the pact: the pie fills to today; on the final day it closes. */}
              <MarkProgress value={progress} size={92} track="var(--hairline, #DCD3C1)" />
            </span>
          )}
        </div>

        <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.03em]">{isStreak ? `${shown}-day streak` : title}</h2>
        <p className="mt-0.5 text-[13px] text-[var(--muted,#5A5C63)]">{line}</p>

        {dots > 0 && (
          <div className="my-3.5 flex justify-center gap-2" aria-hidden="true">
            {Array.from({ length: dots }).map((_, i) => (
              <motion.span
                key={i}
                className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  border: `2px solid ${i < filled ? 'var(--navy, #1F3A93)' : 'var(--seat-border, #CFC5B0)'}`,
                  background: i < filled ? 'var(--navy, #1F3A93)' : 'transparent',
                  color: i < filled ? '#FFFFFF' : 'var(--muted, #5A5C63)',
                }}
                animate={i === filled - 1 && !reduce ? { scale: [1, 1.3, 1] } : undefined}
                transition={{ duration: 0.45 }}
              >
                {i + 1}
              </motion.span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-12 w-full rounded-full text-[15px] font-semibold text-white transition active:scale-[0.96]"
          style={{ background: 'var(--navy, #1F3A93)' }}
        >
          Nice
        </button>
      </motion.div>
    </div>
  )
}
