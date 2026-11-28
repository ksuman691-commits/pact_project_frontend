'use client'

import { useEffect, useRef } from 'react'

// History steps left by overlays that just closed, popped together on the next
// tick. An overlay opening in the same tick (a picker handing over to the
// camera, or React Strict Mode remounting in development) takes over one of
// those steps instead of the pop landing on it and closing it straight away.
let pendingSteps = 0
let pendingTimer: number | null = null

// Overlays can sit inside each other (the dare proof screen opens the camera
// inside it). The step an overlay removes when it closes by itself must not count
// as Back for the one still open: that was closing the whole dare proof screen the
// moment you tapped "Use this", so the photo was never sent.
let ownPops = 0
let watching = false

function watchOwnPops() {
  if (watching) return
  watching = true
  window.addEventListener('popstate', () => {
    if (ownPops > 0) window.setTimeout(() => (ownPops = Math.max(0, ownPops - 1)), 0)
  })
}

function schedulePop() {
  if (pendingTimer !== null) return
  pendingTimer = window.setTimeout(() => {
    const steps = pendingSteps
    pendingSteps = 0
    pendingTimer = null
    if (steps > 0 && window.history.state?.__overlay) {
      ownPops += 1
      window.history.go(-steps)
    }
  }, 0)
}

/**
 * Makes the phone's back button (and the browser back gesture) close a
 * full-screen overlay instead of leaving the page underneath it.
 *
 * Opening pushes one history entry (copying the current state so Next's own
 * bookkeeping survives). Back pops it and closes the overlay. Closing the
 * overlay any other way (X button, swipe, finishing the last story) removes
 * the entry again so the history never gains stray steps.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    watchOwnPops()
    let owned = true
    if (pendingSteps > 0 && window.history.state?.__overlay) {
      pendingSteps -= 1
    } else {
      window.history.pushState({ ...(window.history.state || {}), __overlay: true }, '')
    }

    const onPop = () => {
      // Our own clean-up step, not the person pressing Back.
      if (ownPops > 0) return
      owned = false
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      if (!owned || !window.history.state?.__overlay) return
      pendingSteps += 1
      schedulePop()
    }
  }, [open])
}
