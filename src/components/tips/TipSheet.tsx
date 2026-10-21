'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { CircleQR } from '@/components/CircleQR'
import { useBackToClose } from '@/hooks/useBackToClose'
import { buildUpiUri, isLikelyMobile } from '@/lib/upi'
import type { PublicTipInfo } from '@/lib/api/tips'

const AMOUNTS: (number | null)[] = [null, 21, 51, 101]

interface TipSheetProps {
  open: boolean
  onClose: () => void
  tip: PublicTipInfo
  /** Shown to the payer and in the UPI note, e.g. the pact title. */
  context?: string | null
  creatorName: string
  creatorAvatarUrl?: string | null
}

/**
 * Tip a creator straight to their UPI ID. The QR and the "Pay with UPI app"
 * link carry the same upi://pay URI. CirclePact never touches the money.
 */
export default function TipSheet({ open, onClose, tip, context, creatorName, creatorAvatarUrl }: TipSheetProps) {
  const [amount, setAmount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [mobile, setMobile] = useState(false)
  useBackToClose(open, onClose)

  useEffect(() => setMobile(isLikelyMobile()), [])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const firstName = creatorName.split(' ')[0] || creatorName
  const uri = useMemo(
    () => buildUpiUri({ upiId: tip.upi_id, payeeName: tip.payee_name, note: context ? `CirclePact tip: ${context}` : 'CirclePact tip', amount }),
    [tip.upi_id, tip.payee_name, context, amount],
  )

  if (!open) return null

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(tip.upi_id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy the UPI ID')
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Tip ${firstName}`} className="fixed inset-0 z-[90] flex items-end justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
      <div
        className="relative w-full max-w-md rounded-t-[28px] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
        style={{ background: '#FFFFFF', color: '#0F1014', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}
      >
        <div className="mx-auto mb-3 h-[5px] w-10 rounded-full" style={{ background: '#D9D9DE' }} />
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-[18px] font-extrabold" style={{ background: '#E8ECF7', color: '#1F3A93' }}>
            {creatorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creatorAvatarUrl} alt="" className="size-full object-cover" />
            ) : (
              firstName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: '#0F1014' }}>Tip {firstName}</div>
            {context && <div className="mt-0.5 truncate text-[13.5px]" style={{ color: '#5F6168' }}>for {context}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex size-11 items-center justify-center rounded-full" style={{ color: '#0F1014' }}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Tip amount">
          {AMOUNTS.map((value) => {
            const active = amount === value
            return (
              <button
                key={value ?? 'any'}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAmount(value)}
                className="h-11 rounded-full text-[15px] font-extrabold"
                style={active ? { background: '#1F3A93', color: '#FFFFFF' } : { background: '#F2F2F4', color: '#0F1014' }}
              >
                {value == null ? 'Any' : `₹${value}`}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col items-center">
          <div className="rounded-[20px] p-3" style={{ background: '#FFFFFF', border: '1px solid #E6E6E9' }}>
            <CircleQR url={uri} size={mobile ? 168 : 208} label={`UPI QR code to tip ${firstName}`} />
          </div>
          <div className="mt-2 text-[12.5px]" style={{ color: '#5F6168' }}>Scan with GPay, PhonePe, Paytm or any UPI app</div>
        </div>

        {mobile && (
          <a
            href={uri}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-full text-[16px] font-extrabold"
            style={{ background: '#1F3A93', color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }}
          >
            {amount ? `Pay ₹${amount} with UPI app` : 'Pay with UPI app'}
          </a>
        )}

        <button
          type="button"
          onClick={() => void copyId()}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold"
          style={{ background: '#F2F2F4', color: '#0F1014' }}
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? 'Copied' : tip.upi_id}
        </button>

        <div className="mt-3 text-center text-[12px] leading-snug" style={{ color: '#5F6168' }}>
          Goes straight to {firstName}&apos;s UPI. CirclePact never sees or holds the money. A tip is a gift and doesn&apos;t change anything in the pact.
        </div>
      </div>
    </div>
  )
}
