'use client'

import { motion, useReducedMotion } from 'framer-motion'

/** The streak flame. Red, like the like heart, so it reads as a reward and not as a button. */
export default function StreakFlame({ size = 22, pop = false }: { size?: number; pop?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ originY: 0.9 }}
      animate={reduce ? undefined : pop ? { scale: [1, 1.35, 1] } : { scale: [1, 1.05, 0.98, 1], rotate: [0, -2, 2, 0] }}
      transition={pop ? { duration: 0.45 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 .5 2 1.5 2.5 2 2 0-3-1-5 1-8z" fill="var(--like, #E11D48)" />
    </motion.svg>
  )
}
