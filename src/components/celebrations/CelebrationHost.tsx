'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { MOMENT_POSTED_EVENT } from '@/lib/push'
import type { CheckInCelebrationData, CheckInExtras } from '@/lib/celebrations'
import type { TodayPact } from '@/hooks/useTodayStatus'
import CheckInCelebration from './CheckInCelebration'

/**
 * The one place celebrations are shown. Screens just post an event; this host
 * waits for the camera sheet to close, queues them so two never overlap, and
 * tells the reminder sheet to hold back until it is done.
 */
export default function CelebrationHost() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [queue, setQueue] = useState<CheckInCelebrationData[]>([])

  // A pending celebration must survive the signed-in user object being refreshed, so the timer lives in a ref
  // and is only cleared when the host itself goes away.
  const waitTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (waitTimer.current) window.clearTimeout(waitTimer.current)
      delete document.body.dataset.celebrating
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const onPosted = (event: Event) => {
      const detail = (event as CustomEvent).detail ?? {}
      const pactId = Number(detail.pactId)
      // Read today's list now, before it refetches: only the first moment of the day is a check-in.
      const today = queryClient
        .getQueriesData<TodayPact[]>({ queryKey: ['me-today'] })
        .flatMap(([, data]) => (Array.isArray(data) ? data : []))
        .find((p) => p.id === pactId)
      if (!today || today.posted_today) return

      const extras: CheckInExtras = detail.celebration ?? {}
      const item: CheckInCelebrationData = {
        pactId,
        title: today.title,
        day: today.day ?? null,
        totalDays: today.total_days ?? null,
        streak: extras.streak ?? null,
        circle: extras.circle ?? null,
      }
      // Tell the reminder sheet to wait, right away, before the camera sheet closes.
      document.body.dataset.celebrating = '1'
      let tries = 0
      const check = () => {
        tries += 1
        if (!document.querySelector('[role="dialog"][aria-label="Post a moment"]') || tries > 240) {
          setQueue((q) => [...q, item])
          return
        }
        waitTimer.current = window.setTimeout(check, 250)
      }
      waitTimer.current = window.setTimeout(check, 400)
    }
    window.addEventListener(MOMENT_POSTED_EVENT, onPosted)
    return () => window.removeEventListener(MOMENT_POSTED_EVENT, onPosted)
  }, [user?.id, queryClient])

  const close = useCallback(() => {
    setQueue((q) => {
      const next = q.slice(1)
      if (next.length === 0) delete document.body.dataset.celebrating
      return next
    })
  }, [])

  const current = queue[0]
  if (!mounted || !current) return null
  return createPortal(<CheckInCelebration key={`${current.pactId}-${queue.length}`} data={current} onClose={close} />, document.body)
}
