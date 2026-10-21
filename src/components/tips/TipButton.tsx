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
  /** 'pill' = labelled button; 'stage' = round button over a photo or video. */
  variant?: 'pill' | 'stage'
  className?: string
}

/** Renders nothing unless the creator has tips turned on. */
export default function TipButton({ creatorId, creatorName, creatorAvatarUrl, context, variant = 'pill', className = '' }: TipButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: tip } = useUserTipInfo(creatorId)
  if (!tip) return null
  const firstName = creatorName.split(' ')[0] || creatorName

  return (
    <>
      {variant === 'stage' ? (
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
      <TipSheet open={open} onClose={() => setOpen(false)} tip={tip} context={context} creatorName={creatorName} creatorAvatarUrl={creatorAvatarUrl} />
    </>
  )
}
