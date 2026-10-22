'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { CircleQR } from '@/components/CircleQR'
import BodyPortal from '@/components/BodyPortal'
import { useBackToClose } from '@/hooks/useBackToClose'
import { buildUpiUri, isLikelyMobile } from '@/lib/upi'
import { claimTip, startTip, type PublicTipInfo, type TipRecord } from '@/lib/api/tips'

const AMOUNTS: (number | null)[] = [null, 21, 51, 101]
const INK = '#0F1014'
const MUTED = '#5F6168'
const NAVY = '#1F3A93'

type Stage = 'pick' | 'confirm' | 'waiting'

interface TipSheetProps {
  open: boolean
  onClose: () => void
  tip: PublicTipInfo
  /** Shown to the payer and in the UPI note, e.g. the pact title. */
  context?: string | null
  pactId?: number | null
  creatorName: string
  creatorAvatarUrl?: string | null
  /** Called once the tipper says they sent it (e.g. to attach the tip to an ask-to-watch). */
  onClaimed?: (tip: TipRecord) => void
  /** Paying a set price (e.g. ₹21 to watch a private pact): no amount choice. */
  fixedAmount?: number | null
}

/**
 * Tip a creator straight to their UPI. CirclePact never touches the money, so
 * each tip gets a code (CP-XXXX) that rides in the UPI note. After paying, the
 * tipper says "I sent it" and the creator confirms once it shows in their UPI
 * app. Only confirmed tips count anywhere public.
 */
export default function TipSheet({ open, onClose, tip, context, pactId, creatorName, creatorAvatarUrl, onClaimed, fixedAmount = null }: TipSheetProps) {
  const [amount, setAmount] = useState<number | null>(fixedAmount ?? 51)
  const [stage, setStage] = useState<Stage>('pick')
  const [record, setRecord] = useState<TipRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
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

  // A fresh code each time the sheet opens.
  useEffect(() => {
    if (!open) {
      setStage('pick')
      setRecord(null)
      return
    }
    let cancelled = false
    startTip({ creator_id: tip.user_id, pact_id: pactId ?? null, amount: fixedAmount ?? null })
      .then((created) => {
        if (!cancelled) setRecord(created)
      })
      .catch(() => {
        // The QR still works without a code; the creator just can't match it as easily.
      })
    return () => {
      cancelled = true
    }
  }, [open, tip.user_id, pactId, fixedAmount])

  const firstName = creatorName.split(' ')[0] || creatorName
  const code = record?.code
  const note = code ? `${code} tip${context ? ` for ${context}` : ''}` : `CirclePact tip${context ? ` for ${context}` : ''}`
  const uri = useMemo(() => buildUpiUri({ upiId: tip.upi_id, payeeName: tip.payee_name, note, amount }), [tip.upi_id, tip.payee_name, note, amount])

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

  const claim = async () => {
    if (!record) {
      setStage('waiting')
      return
    }
    setBusy(true)
    try {
      const claimed = await claimTip(record.id, amount)
      setRecord(claimed)
      onClaimed?.(claimed)
      setStage('waiting')
    } catch {
      toast.error("Couldn't send that to " + firstName + '. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BodyPortal>
    <div role="dialog" aria-modal="true" aria-label={fixedAmount ? `Pay ${firstName} to watch` : `Tip ${firstName}`} className="fixed inset-0 z-[90] flex items-end justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[28px] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" style={{ background: '#FFFFFF', color: INK, boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
        <div className="mx-auto mb-3 h-[5px] w-10 rounded-full" style={{ background: '#D9D9DE' }} />
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-[18px] font-extrabold" style={{ background: '#E8ECF7', color: NAVY }}>
            {creatorAvatarUrl && !avatarFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creatorAvatarUrl} alt="" onError={() => setAvatarFailed(true)} className="size-full object-cover" />
            ) : (
              firstName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: INK }}>{fixedAmount ? `₹${fixedAmount} to watch` : `Tip ${firstName}`}</div>
            <div className="mt-0.5 truncate text-[13.5px]" style={{ color: MUTED }}>{context ? `for ${context}` : `Straight to ${firstName}'s UPI`}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
            <X className="size-5" />
          </button>
        </div>

        {stage === 'pick' && (
          <>
            {fixedAmount ? (
              <div className="mt-4 rounded-[16px] px-4 py-3 text-[13.5px] leading-snug" style={{ background: '#F5F7FD', color: MUTED }}>
                Pay <span className="font-extrabold" style={{ color: INK }}>₹{fixedAmount}</span> to {firstName}, then tap <span className="font-extrabold" style={{ color: INK }}>I sent it</span>. {firstName} lets you in once it arrives.
              </div>
            ) : (
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
                    style={active ? { background: NAVY, color: '#FFFFFF' } : { background: '#F2F2F4', color: INK }}
                  >
                    {value == null ? 'Any' : `₹${value}`}
                  </button>
                )
              })}
            </div>
            )}

            <div className="mt-4 flex items-center gap-4 rounded-[20px] p-3" style={{ border: '1px solid #E6E6E9' }}>
              <div className="shrink-0 rounded-[12px] bg-white p-1.5">
                <CircleQR url={uri} size={mobile ? 104 : 148} label={`UPI QR code to tip ${firstName}`} />
              </div>
              <div className="min-w-0 text-[13px] leading-snug" style={{ color: MUTED }}>
                <span className="block text-[14px] font-extrabold" style={{ color: INK }}>{mobile ? 'Or scan from another phone' : 'Scan with any UPI app'}</span>
                {code ? (
                  <>
                    The payment note says <span className="font-extrabold" style={{ color: INK }}>{code}</span>, so {firstName} can match it.
                  </>
                ) : (
                  'GPay, PhonePe, Paytm or BHIM.'
                )}
              </div>
            </div>

            {mobile ? (
              <a
                href={uri}
                onClick={() => window.setTimeout(() => setStage('confirm'), 600)}
                className="mt-4 flex h-14 w-full items-center justify-center rounded-full text-[16px] font-extrabold"
                style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }}
              >
                {amount ? `Pay ₹${amount} with UPI app` : 'Pay with UPI app'}
              </a>
            ) : (
              <button type="button" onClick={() => setStage('confirm')} className="mt-4 h-14 w-full rounded-full text-[16px] font-extrabold" style={{ background: NAVY, color: '#FFFFFF' }}>
                I&apos;ve paid
              </button>
            )}

            <button type="button" onClick={() => void copyId()} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold" style={{ background: '#F2F2F4', color: INK }}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? 'Copied' : tip.upi_id}
            </button>
            {mobile && (
              <button type="button" onClick={() => setStage('confirm')} className="mt-1 h-11 w-full text-[13.5px] font-bold" style={{ color: NAVY }}>
                Paid another way? Tell {firstName}
              </button>
            )}
            <div className="mt-1 text-center text-[12px] leading-snug" style={{ color: MUTED }}>
              Goes straight to {firstName}&apos;s UPI. CirclePact never sees the money.{fixedAmount ? ' Sort out any problem with the payment directly with ' + firstName + '.' : ' A tip is a gift and doesn’t change anything in the pact.'}
            </div>
          </>
        )}

        {stage === 'confirm' && (
          <>
            <div className="mt-5 text-[18px] font-extrabold" style={{ color: INK }}>{fixedAmount ? 'Did your payment go through?' : 'Did your tip go through?'}</div>
            <div className="mt-1 text-[14px] leading-snug" style={{ color: MUTED }}>
              Check your UPI app. We&apos;ll ask {firstName} to confirm it arrived{code ? ` (${code})` : ''}.
            </div>
            <button type="button" onClick={() => void claim()} disabled={busy} className="mt-5 h-14 w-full rounded-full text-[16px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
              {busy ? 'Sending…' : amount ? `Yes, I sent ₹${amount}` : 'Yes, I sent it'}
            </button>
            <button type="button" onClick={() => setStage('pick')} className="mt-2 h-12 w-full rounded-full text-[14.5px] font-bold" style={{ background: '#F2F2F4', color: INK }}>
              Not yet, go back
            </button>
          </>
        )}

        {stage === 'waiting' && (
          <>
            <div className="mt-5 flex items-center gap-3 rounded-[18px] p-4" style={{ background: '#F5F7FD' }}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ border: `2px dashed ${NAVY}`, color: NAVY }}>
                <Clock className="size-[18px]" />
              </span>
              <div className="text-[13.5px] leading-snug" style={{ color: MUTED }}>
                <span className="block text-[15px] font-extrabold" style={{ color: INK }}>Waiting for {firstName}</span>
                {code ? `Ref ${code}. ` : ''}{fixedAmount ? `Once ${firstName} confirms it arrived, the moments open for you.` : `Once ${firstName} confirms it arrived, you show up as a supporter.`}
              </div>
            </div>
            <button type="button" onClick={onClose} className="mt-4 h-14 w-full rounded-full text-[16px] font-extrabold" style={{ background: '#17181D', color: '#FFFFFF' }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
    </BodyPortal>
  )
}
