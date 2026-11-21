'use client'

import { useEffect, useState } from 'react'

/** The current time, refreshed every `everyMs` while `active`, so countdowns and "live" labels stay true. */
export function useNow(everyMs = 60_000, active = true) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(id)
  }, [everyMs, active])
  return now
}
