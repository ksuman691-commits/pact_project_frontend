'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useMyPacts } from '@/hooks/useMyPacts'
import { resolvePactCompletionViewState } from '@/lib/pactCompletionState'
import PactFinishedSheet, { type PactFinishedData } from './PactFinishedSheet'
import { dayMarks } from '@/lib/pactShareCard'

/** Pacts that ended longer ago than this are history, not news. */
const RECENT_DAYS = 10
const seenKey = (userId: number, pactId: number) => `cp:finished:${userId}:${pactId}`

function wasSeen(userId: number, pactId: number) {
  try {
    return window.localStorage.getItem(seenKey(userId, pactId)) != null
  } catch {
    return true
  }
}

function markSeen(userId: number, pactId: number) {
  try {
    window.localStorage.setItem(seenKey(userId, pactId), String(Date.now()))
  } catch {
    // Storage blocked: it may show again next time, which is harmless.
  }
}

/** The day after the pact's last day, local midnight. */
function endedAt(pact: any): number | null {
  if (!pact.start_date || !pact.duration_days) return null
  const start = new Date(`${String(pact.start_date).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime())) return null
  start.setDate(start.getDate() + Number(pact.duration_days))
  return start.getTime()
}

/**
 * Finds the newest pact you created that ended in the last 10 days and that this
 * device hasn't shown yet, and shows its finish screen on Home once nothing else
 * is open. Works from the server's result, or from the same 75% rule (rest days
 * included) while the server hasn't finalised it yet.
 */
export default function PactFinishedHost() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const userId = user?.id != null ? Number(user.id) : null
  const onHome = pathname === '/feed'
  const query = useMyPacts()
  const [showing, setShowing] = useState<PactFinishedData | null>(null)

  const candidate = useMemo<PactFinishedData | null>(() => {
    if (userId == null || typeof window === 'undefined') return null
    const rows: any[] = (query.data as any)?.data ?? []
    const now = Date.now()
    const finished = rows
      .filter((p) => Number(p.creator_id) === userId && p.completion_rule === 'moments_75')
      .map((p) => ({ p, view: resolvePactCompletionViewState(p), end: endedAt(p) }))
      .filter(({ view, end }) => view && view !== 'empty' && end != null && now - end < RECENT_DAYS * 86_400_000 && now >= end)
      .filter(({ p }) => !wasSeen(userId, Number(p.id)))
      .sort((a, b) => (b.end ?? 0) - (a.end ?? 0))[0]
    if (!finished) return null
    const { p, view } = finished
    return {
      pactId: Number(p.id),
      title: p.title,
      kept: view === 'completed' || view === 'provisional_completed',
      daysPosted: Number(p.days_completed ?? 0),
      restDays: Array.isArray(p.rest_days) ? p.rest_days.length : 0,
      daysNeeded: Number(p.days_required ?? 0),
      totalDays: Number(p.total_days ?? p.duration_days ?? 0),
      circleId: p.circle_id ?? null,
      circleName: p.circle_name ?? null,
      days: dayMarks(p),
      name: String(user?.full_name || user?.username || 'I').split(' ')[0],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, userId])

  useEffect(() => {
    if (!onHome || !candidate || showing || userId == null) return
    let tries = 0
    let timer = 0
    // Wait for Home to settle and for any other sheet or celebration to finish first.
    const check = () => {
      tries += 1
      const busy = document.body.dataset.celebrating === '1' || document.querySelector('[role="dialog"]')
      if (!busy) {
        markSeen(userId, candidate.pactId)
        setShowing(candidate)
        return
      }
      if (tries < 30) timer = window.setTimeout(check, 2000)
    }
    timer = window.setTimeout(check, 1500)
    return () => window.clearTimeout(timer)
  }, [onHome, candidate, showing, userId])

  if (!showing) return null
  const close = () => setShowing(null)
  const next = () => {
    const params = new URLSearchParams({ note: showing.title })
    if (showing.circleId) params.set('circleId', String(showing.circleId))
    const url = `/pacts/create?${params.toString()}`
    // Closing pops the sheet's history step; navigate after that pop lands, or it would undo the push.
    let done = false
    const go = () => {
      if (done) return
      done = true
      window.removeEventListener('popstate', go)
      router.push(url)
    }
    window.addEventListener('popstate', go)
    window.setTimeout(go, 400)
    setShowing(null)
  }
  return createPortal(<PactFinishedSheet data={showing} onClose={close} onNext={next} />, document.body)
}
