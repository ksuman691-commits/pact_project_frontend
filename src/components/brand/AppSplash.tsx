'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import CircleMark from './CircleMark'
import { useAuthStore } from '@/store/auth'

const MIN_MS = 1000 // long enough for the mark to draw in
const MAX_MS = 2600 // never hold the app back longer than this

/**
 * Launch splash for the installed app (opened from the home screen): the mark
 * draws in while the app signs in, then fades. A normal browser tab never sees
 * it, so shared links open straight away.
 */
export default function AppSplash() {
  const reduce = useReducedMotion()
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const [show, setShow] = useState(false)
  const [minDone, setMinDone] = useState(false)

  useEffect(() => {
    let standalone = false
    try {
      standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    } catch {
      standalone = false
    }
    if (!standalone) return
    setShow(true)
    const min = window.setTimeout(() => setMinDone(true), reduce ? 300 : MIN_MS)
    const max = window.setTimeout(() => setShow(false), MAX_MS)
    return () => {
      window.clearTimeout(min)
      window.clearTimeout(max)
    }
  }, [reduce])

  useEffect(() => {
    if (show && minDone && isInitialized) setShow(false)
  }, [show, minDone, isInitialized])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          aria-hidden="true"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5"
          style={{ background: 'var(--paper, #F4EFE4)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <CircleMark size={96} variant="disc" animation="draw" delay={0.08} />
          <motion.span
            className="text-[30px] font-bold leading-none tracking-[-0.045em]"
            style={{ color: 'var(--ink, #17181D)' }}
            initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.45, duration: 0.35 }}
          >
            CirclePact
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
