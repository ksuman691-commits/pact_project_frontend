'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { MOMENT_POSTED_EVENT } from '@/lib/push'
import { pactService } from '@/services/api'
import type { CelebrationItem, CheckInCelebrationData, CheckInExtras } from '@/lib/celebrations'
import type { TodayPact } from '@/hooks/useTodayStatus'
import CheckInCelebration from './CheckInCelebration'
import MilestoneSheet from './MilestoneSheet'

/**
 * The one place celebrations are shown. Screens just post an event; this host
 * waits for the camera sheet to close, queues them so two never overlap, and
 * tells the reminder sheet to hold back until it is done.
 */
export default function CelebrationHost() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [queue, setQueue] = useState<CelebrationItem[]>([])
  // A short pause between two screens in a row: the first one's back-button cleanup is asynchronous
  // and would otherwise close the second the moment it opens. It also gives the moment room to breathe.
  const [cooling, setCooling] = useState(false)

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

      const base: CheckInCelebrationData = {
        kind: 'check-in',
        pactId,
        title: today.title,
        day: today.day ?? null,
        totalDays: today.total_days ?? null,
        streak: null,
        circle: null,
      }
      // The real numbers come from the server while the camera sheet closes. If they don't arrive,
      // the day alone is still shown: nothing is made up.
      const extrasPromise: Promise<CheckInExtras & { day?: number | null; total_days?: number | null }> = detail.celebration
        ? Promise.resolve(detail.celebration)
        : Promise.race([
            pactService
              .celebration(pactId)
              .then((response) => response.data ?? {})
              .catch(() => ({})),
            // Never keep someone waiting on a slow connection: show the day and move on.
            new Promise<Record<string, never>>((resolve) => window.setTimeout(() => resolve({}), 2500)),
          ])
      // Tell the reminder sheet to wait, right away, before the camera sheet closes.
      document.body.dataset.celebrating = '1'
      let tries = 0
      const check = () => {
        tries += 1
        if (!document.querySelector('[role="dialog"][aria-label="Post a moment"]') || tries > 240) {
          void extrasPromise.then((extras) => {
            const items: CelebrationItem[] = [
              {
                ...base,
                day: extras.day ?? base.day,
                totalDays: extras.total_days ?? base.totalDays,
                streak: extras.streak ?? null,
                circle: extras.circle ?? null,
              },
            ]
            if (extras.milestone) {
              items.push({ kind: 'milestone', pactId, title: base.title, day: extras.day ?? base.day, totalDays: extras.total_days ?? base.totalDays, milestone: extras.milestone })
            }
            setQueue((q) => [...q, ...items])
          })
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
    setCooling(true)
    window.setTimeout(() => setCooling(false), 450)
  }, [])

  const current = queue[0]
  if (!mounted || !current || cooling) return null
  const key = `${current.kind}-${current.pactId}-${queue.length}`
  return createPortal(
    current.kind === 'milestone' ? <MilestoneSheet key={key} data={current} onClose={close} /> : <CheckInCelebration key={key} data={current} onClose={close} />,
    document.body,
  )
}
