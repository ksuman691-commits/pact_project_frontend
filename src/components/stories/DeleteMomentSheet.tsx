'use client'

import { Trash2 } from 'lucide-react'

/** "Delete this moment?" confirmation, shared by the Moments viewer and the pact card. */
export default function DeleteMomentSheet({
  open,
  day,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean
  day?: number | null
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-moment-title" onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label="Keep this moment" className="absolute inset-0 bg-black/50" onClick={() => !busy && onCancel()} />
      <div className="relative w-full max-w-md rounded-t-[24px] p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:rounded-[24px]" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
        <span className="flex size-11 items-center justify-center rounded-full" style={{ background: '#FDECEA', color: '#B42318' }}>
          <Trash2 className="size-5" strokeWidth={2.4} />
        </span>
        <h2 id="delete-moment-title" className="mt-3 text-[19px] font-extrabold">Delete this moment?</h2>
        <p className="mt-2 text-[14.5px] leading-snug" style={{ color: 'var(--muted)' }}>
          It’s removed for everyone, with its replies and reactions. This can’t be undone.
          {day ? ` Day ${day} will count as not posted unless you have another moment for it.` : ''}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="h-12 rounded-full text-[15px] font-bold" style={{ border: '1.5px solid #DCD3C1' }}>
            Keep it
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="h-12 rounded-full text-[15px] font-extrabold text-white disabled:opacity-50" style={{ background: '#B42318' }}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
