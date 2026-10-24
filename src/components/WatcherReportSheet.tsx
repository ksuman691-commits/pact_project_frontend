'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportWatcher } from '@/lib/api/access'

const REASONS = ['Vulgar Or Abusive Comments', 'Harassing Me Or Others', 'Spam Or Ads', 'Something Else']

function formatWhen(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/**
 * Creator reports someone who paid to watch. First report warns them; a second
 * one made 24+ hours later removes them from the pact.
 */
export default function WatcherReportSheet({
  pactId,
  watcherId,
  watcherName,
  isSecondReport,
  onClose,
  onDone,
}: {
  pactId: number
  watcherId: number
  watcherName: string
  isSecondReport: boolean
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState(REASONS[0])
  const [busy, setBusy] = useState(false)
  const first = watcherName.trim().split(/\s+/)[0] || 'them'

  const submit = async () => {
    setBusy(true)
    try {
      const result = await reportWatcher(pactId, watcherId, reason)
      toast.success(result.action === 'removed' ? `${first} was removed from this pact.` : `Reported. ${first} was told.`)
      onDone()
      onClose()
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      if (detail && typeof detail === 'object') {
        toast.error(`You reported ${first} recently. You can report again after ${formatWhen(detail.can_report_again_at)}.`)
        onDone()
        onClose()
      } else {
        toast.error(typeof detail === 'string' ? detail : "Couldn't send that report. Try again.")
        setBusy(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 px-3 pb-3" role="dialog" aria-modal="true" aria-label={`Report ${watcherName}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative z-10 w-full max-w-md rounded-[26px] border border-[var(--line)] bg-[var(--card)] px-[18px] pb-4 pt-5 text-[var(--ink)] shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-[var(--muted)]">
          <X className="size-5" />
        </button>
        <h2 className="pr-10 text-[20px] font-extrabold tracking-[-0.02em]">{isSecondReport ? `Report ${watcherName} Again` : `Report ${watcherName}`}</h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[var(--muted)]">
          {isSecondReport ? 'It has been more than 24 hours since the first report.' : `Pick a reason. ${first} is told they were reported and why.`}
        </p>
        {isSecondReport && (
          <div className="mt-4 rounded-[14px] border border-[#E8C4B8] bg-[#FBEAE4] p-3.5 text-[13.5px] leading-[1.5]">
            <b className="text-[#8A2A0F]">This removes {first}.</b> They lose access to this pact&apos;s moments and cannot ask to watch it again. They are told why.
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Reason">
          {REASONS.map((item) => {
            const on = reason === item
            return (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setReason(item)}
                className={`flex h-12 items-center justify-between rounded-[14px] px-3.5 text-[14px] font-bold ${on ? 'border-2 border-[var(--navy)] bg-[#E8ECF8] font-extrabold text-[var(--navy)]' : 'border border-[var(--line)]'}`}
              >
                {item}
                {on && <Check className="size-[18px]" strokeWidth={3} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        {!isSecondReport && (
          <div className="mt-4 rounded-[14px] border border-[var(--line)] bg-[var(--paper)] p-3 text-[13px] leading-[1.5]">
            <b>How it works.</b> This is a warning. If you report {first} again after 24 hours, they are removed from this pact and cannot join it again.
          </div>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className={`mt-5 h-12 w-full rounded-full text-[15px] font-extrabold text-white disabled:opacity-60 ${isSecondReport ? 'bg-[#8A2A0F]' : 'bg-[var(--navy)]'}`}
        >
          {busy ? 'Sending…' : isSecondReport ? 'Report And Remove' : 'Send Report'}
        </button>
        <button type="button" onClick={onClose} className="mt-1 h-11 w-full text-[14px] font-bold text-[var(--muted)]">
          Cancel
        </button>
      </div>
    </div>
  )
}
