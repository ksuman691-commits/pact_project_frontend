'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Native scroll-snap only turns the page once a swipe passes the halfway point,
 * so a short thumb swipe slides back. When a swipe ends, a deliberate short
 * swipe (40 px+) or a quick flick moves one slide that way. Passive listeners
 * only: native scrolling still does the work and nothing is blocked.
 */
export function useSnapSwipe(scrollerRef: RefObject<HTMLElement | null>, slideCount: number, enabled = true) {
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!enabled || !scroller || slideCount <= 1) return
    let startX = 0
    let startY = 0
    let startAt = 0
    let startIndex = 0
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch || event.touches.length > 1) return
      startX = touch.clientX
      startY = touch.clientY
      startAt = performance.now()
      startIndex = Math.round(scroller.scrollLeft / Math.max(1, scroller.clientWidth))
    }
    const onEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!touch || !startAt) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      const elapsed = Math.max(1, performance.now() - startAt)
      startAt = 0
      if (Math.abs(dx) < 24 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      const flick = Math.abs(dx) / elapsed > 0.3
      if (Math.abs(dx) < 40 && !flick) return
      const target = Math.max(0, Math.min(slideCount - 1, startIndex + (dx < 0 ? 1 : -1)))
      if (target === startIndex) return
      requestAnimationFrame(() => {
        scroller.scrollTo({ left: target * scroller.clientWidth, behavior: 'smooth' })
      })
    }
    scroller.addEventListener('touchstart', onStart, { passive: true })
    scroller.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      scroller.removeEventListener('touchstart', onStart)
      scroller.removeEventListener('touchend', onEnd)
    }
  }, [scrollerRef, slideCount, enabled])
}
