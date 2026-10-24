'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

/** Round icon button that runs `onRefresh` and spins until it settles. */
export default function RefreshButton({ onRefresh, label = 'Refresh', className = '' }: { onRefresh: () => Promise<unknown> | void; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onRefresh()
    } catch {
      // The page's own error state shows what went wrong.
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={busy}
      aria-label={label}
      title={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] transition active:scale-95 disabled:opacity-70 ${className}`}
    >
      <RefreshCw className={`size-[18px] ${busy ? 'animate-spin' : ''}`} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
