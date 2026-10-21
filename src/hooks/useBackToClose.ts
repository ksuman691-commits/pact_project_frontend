'use client'

import { useEffect, useRef } from 'react'

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
    let owned = true
    window.history.pushState({ ...(window.history.state || {}), __overlay: true }, '')

    const onPop = () => {
      owned = false
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      if (owned && window.history.state?.__overlay) window.history.back()
    }
  }, [open])
}
