'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, ExternalLink, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { CircleQR } from '@/components/CircleQR'
import { dareService } from '@/services/api'
import { useDareRewardStep } from '@/hooks/useDareMutations'
import { copyText } from '@/lib/circleInvite'
import { buildUpiUri, isLikelyMobile } from '@/lib/upi'
import { toErrorMessage } from '@/lib/errorMessages'

type Payment = { status: string; amount: number; code: string; upi_id: string; payee_name?: string | null }

/**
 * The creator pays the dare's reward to the person who did it, in their own
 * UPI app. CirclePact never holds the money: we hand over the UPI ID, the
 * amount and a short code for the payment note, then ask "did you send it?".
 * The person paid confirms it arrived on their side.
 */
export default function DareRewardPaySheet({
  dareId,
  payeeName,
  open,
  onClose,
}: {
  dareId: number
  payeeName: string
  open: boolean
  onClose: () => void
}) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const step = useDareRewardStep()
  const mobile = typeof window !== 'undefined' && isLikelyMobile()

  useEffect(() => {
    if (!open) return
    let live = true
    setError(null)
    dareService
      .rewardStart(dareId)
      .then((res) => live && setPayment(res.data))
      .catch((err) => live && setError(toErrorMessage(err, "Couldn't load their payment details.")))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      live = false
      document.removeEventListener('keydown', onKey)
    }
  }, [open, dareId, onClose])

  const uri = useMemo(
    () => (payment ? buildUpiUri({ upiId: payment.upi_id, payeeName: payment.payee_name || payeeName, note: `CirclePact dare ${payment.code}`, amount: payment.amount }) : ''),
    [payment, payeeName],
  )

  if (!open) return null

  const copy = async (text: string, what: string) => {
    if (await copyText(text)) toast.success(`${what} copied`)
  }

  const markSent = async () => {
    await step.mutateAsync({ dareId, step: 'sent' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Pay ${payeeName}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" style={{ background: 'rgba(23,24,29,0.52)' }} />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[22px] bg-[var(--card)] px-6 pb-8 pt-3 text-[var(--ink)]" style={{ boxShadow: '0 -12px 30px -12px rgba(23,24,29,0.35)' }}>
        <div className="mx-auto h-1 w-10 rounded-full bg-[var(--seat-border)]" aria-hidden="true" />
        {!payment && !error && (
          <div className="flex justify-center py-10"><Loader className="size-6 animate-spin text-[var(--navy)]" aria-label="Loading" /></div>
        )}
        {error && <p className="py-6 text-center text-[14px] text-[var(--muted)]">{error}</p>}
        {payment && (
          <>
            <div className="text-center">
              <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">Pay {payeeName} ₹{payment.amount}</h2>
              <p className="mt-1 text-[14px] leading-[1.45] text-[var(--muted)]">Send it in your UPI app, then tap I&apos;ve paid. CirclePact never holds the money.</p>
            </div>

            {mobile ? (
              <a href={uri} className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-6 text-[16px] font-semibold text-white">
                <ExternalLink className="size-4" strokeWidth={2.2} aria-hidden="true" />
                Open UPI app
              </a>
            ) : (
              <div className="mx-auto rounded-[12px] bg-white p-3" style={{ boxShadow: '0 1px 2px rgba(60,45,20,0.12)' }}>
                <CircleQR url={uri} size={176} label={`UPI QR to pay ${payeeName} ₹${payment.amount}`} />
                <p className="mt-2 text-center text-[12px] text-[var(--muted)]">Scan with any UPI app</p>
              </div>
            )}

            <dl className="divide-y divide-[var(--line)] rounded-[16px] border border-[var(--line)] bg-[var(--paper)] text-[14px]">
              <Row label="UPI ID" value={payment.upi_id} onCopy={() => copy(payment.upi_id, 'UPI ID')} />
              <Row label="Note" value={payment.code} hint="Put this in the payment note so they can match it" onCopy={() => copy(payment.code, 'Code')} />
            </dl>

            <button
              type="button"
              onClick={() => void markSent()}
              disabled={step.isPending}
              className="flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-[var(--navy)] px-6 text-[16px] font-semibold text-[var(--navy)] disabled:opacity-50"
            >
              {step.isPending ? 'Saving…' : "I've paid"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, hint, onCopy }: { label: string; value: string; hint?: string; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <dt className="text-[12px] font-semibold text-[var(--muted)]">{label}</dt>
        <dd className="truncate font-bold">{value}</dd>
        {hint && <p className="text-[12px] text-[var(--muted)]">{hint}</p>}
      </div>
      <button type="button" onClick={onCopy} aria-label={`Copy ${label}`} className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--navy)]">
        <Copy className="size-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}
