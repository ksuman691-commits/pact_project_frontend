'use client'

import { useState } from 'react'
import { IndianRupee } from 'lucide-react'
import TipSheet from '@/components/tips/TipSheet'
import { useUserTipInfo } from '@/hooks/useTips'

interface TipButtonProps {
  creatorId: number | string | null | undefined
  creatorName: string
  creatorAvatarUrl?: string | null
  context?: string | null
  /** 'pill' = labelled button; 'outline' = navy-outline "Tip" for a profile's button row; 'stage' = round button over media; 'row' = coin in a card's action row. */
  variant?: 'pill' | 'outline' | 'stage' | 'row'
  /** Confirmed tips so far; shown next to the coin in the 'row' variant. */
  count?: number
  pactId?: number | null
  /** From the pact payload. false skips the lookup entirely; undefined asks the server. */
  tipsEnabled?: boolean
  className?: string
}

/** Renders nothing unless the creator has tips turned on. */
export default function TipButton({ creatorId, creatorName, creatorAvatarUrl, context, variant = 'pill', count = 0, pactId = null, tipsEnabled, className = '' }: TipButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: tip } = useUserTipInfo(tipsEnabled === false ? null : creatorId)
  if (!tip) return null
  const firstName = creatorName.split(' ')[0] || creatorName

  return (
    <>
      {variant === 'row' ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setOpen(true)
          }}
          aria-label={`Tip ${firstName}`}
          className={`flex h-11 items-center gap-1.5 px-1.5 text-[14px] font-bold transition active:scale-95 ${className}`}
          style={{ color: '#1F3A93' }}
        >
          <span className="flex size-[30px] items-center justify-center rounded-full" style={{ border: '1.8px solid #1F3A93' }}>
            <IndianRupee className="size-[15px]" strokeWidth={2.4} aria-hidden="true" />
          </span>
          {count > 0 && count}
        </button>
      ) : variant === 'outline' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Tip ${firstName}`}
          className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-[15px] font-extrabold transition active:scale-[0.98] ${className}`}
          style={{ background: 'transparent', color: '#1F3A93', border: '1.5px solid #1F3A93' }}
        >
          <IndianRupee className="size-4" strokeWidth={2.6} aria-hidden="true" />
          Tip
        </button>
      ) : variant === 'stage' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Tip ${firstName}`}
          className={`flex size-12 items-center justify-center rounded-full shadow-lg ${className}`}
          style={{ background: '#1F3A93', color: '#FFFFFF' }}
        >
          <IndianRupee className="size-5" strokeWidth={2.4} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-extrabold ${className}`}
          style={{ background: '#1F3A93', color: '#FFFFFF', boxShadow: '0 6px 16px rgba(31,58,147,0.25)' }}
        >
          <IndianRupee className="size-4" strokeWidth={2.6} aria-hidden="true" />
          Tip {firstName}
        </button>
      )}
      <TipSheet open={open} onClose={() => setOpen(false)} tip={tip} context={context} pactId={pactId} creatorName={creatorName} creatorAvatarUrl={creatorAvatarUrl} />
    </>
  )
}
