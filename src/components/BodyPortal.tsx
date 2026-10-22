'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders a sheet or modal on document.body.
 *
 * A `position: fixed` overlay is only fixed to the screen if no ancestor has a
 * transform, filter or backdrop-filter. Feed cards have all three (framer
 * motion, .pact-card blur), so a sheet opened from inside a card got trapped
 * in the card: clipped, and with page scroll locked it froze the screen.
 * Clicks inside still bubble through React to the card, so they're stopped
 * here to keep a tap in the sheet from opening the pact.
 */
export default function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <div style={{ display: 'contents' }} onClick={(event) => event.stopPropagation()}>
      {children}
    </div>,
    document.body,
  )
}
