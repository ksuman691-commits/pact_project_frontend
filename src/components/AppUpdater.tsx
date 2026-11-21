'use client'

import { useEffect, useRef, useState } from 'react'

const MINE = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
const CHECK_EVERY_MS = 10 * 60_000
/** Back after this long away: reload straight away, before anything is tapped. */
const AWAY_MS = 30_000

async function liveBuild(): Promise<string | null> {
  try {
    const response = await fetch('/api/version', { cache: 'no-store' })
    if (!response.ok) return null
    const body = (await response.json()) as { build?: string }
    return body.build || null
  } catch {
    return null
  }
}

/**
 * Reload for `live`, at most once per 5 minutes per version, so a browser that
 * keeps serving the old page from its cache can never loop.
 */
function reloadFor(live: string): boolean {
  const key = `cp:reloaded:${live}`
  try {
    const last = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - last < 5 * 60_000) return false
    sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // No storage: still reload once; the guard just can't remember.
  }
  window.location.reload()
  return true
}

/** True while something is being made or answered: never reload under someone's fingers. */
function busy() {
  if (document.querySelector('[role="dialog"]')) return true
  const path = window.location.pathname
  return path.startsWith('/pacts/create') || path.startsWith('/circles/create') || path.startsWith('/auth') || path === '/consent'
}

/**
 * Phones keep a web app open in the background for days, so an open copy can
 * run an old version long after a new one is live. This checks the live version
 * when the app comes back to the front (and every 10 minutes while it's open).
 * Coming back after a while: it reloads at once. Otherwise it offers "Update"
 * and reloads by itself the next time the app comes back.
 */
export default function AppUpdater() {
  const [ready, setReady] = useState(false)
  const hiddenAt = useRef<number | null>(null)
  const stale = useRef<string | null>(null)

  useEffect(() => {
    if (MINE === 'dev') return

    const check = async (cameBack: boolean) => {
      const live = await liveBuild()
      if (!live || live === 'dev' || live === MINE) return
      stale.current = live
      if (cameBack && !busy() && reloadFor(live)) return
      setReady(true)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
        return
      }
      const away = hiddenAt.current != null && Date.now() - hiddenAt.current >= AWAY_MS
      hiddenAt.current = null
      if (stale.current && away && !busy() && reloadFor(stale.current)) return
      void check(away)
    }

    // A page restored from the browser's back-forward cache is the old copy too.
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) void check(true)
    }

    void check(true)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void check(false)
    }, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onShow)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onShow)
    }
  }, [])

  if (!ready) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[120] flex justify-center px-4">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-[var(--navy)] pl-4 pr-1.5 text-[14px] font-bold text-white"
        style={{ boxShadow: '0 0 0 2px #17181D, 0 8px 20px rgba(0,0,0,0.25)' }}
      >
        A new version of CirclePact is ready
        <span className="flex h-8 items-center rounded-full bg-white px-3 text-[13px] font-extrabold text-[var(--navy)]">Update</span>
      </button>
    </div>
  )
}
