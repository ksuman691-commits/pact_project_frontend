'use client'

import { useState } from 'react'
import { IndianRupee, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import TipSheet from '@/components/tips/TipSheet'
import { useAskToWatch, useWithdrawAsk } from '@/hooks/usePactAccess'
import { useUserTipInfo } from '@/hooks/useTips'

interface LockedMediaProps {
  pact: any
  /** 'card' sits in a feed card (4:3); 'page' fills the pact page's media area. */
  variant?: 'card' | 'page'
  className?: string
}

/**
 * What someone sees on a private pact they haven't been let into: the pact's
 * outline without the photos, and a way to ask. A tip can go with the ask so
 * the creator sees who's backing them.
 */
export default function LockedMedia({ pact, variant = 'card', className = '' }: LockedMediaProps) {
  const pactId = Number(pact?.id)
  const status: string = pact?.media_access || 'none'
  const creatorName = String(pact?.creator_full_name || pact?.creator_username || 'The creator')
  const firstName = creatorName.split(' ')[0]
  const moments = Number(pact?.proof_count ?? 0)
  const ask = useAskToWatch(pactId)
  const withdraw = useWithdrawAsk(pactId)
  const [tipOpen, setTipOpen] = useState(false)
  const tipsKnownOff = pact?.creator_tips_enabled === false
  const { data: tipInfo } = useUserTipInfo(tipsKnownOff ? null : pact?.creator_id)
  const pending = status === 'pending'
  const said_no = status === 'denied' || status === 'revoked'

  const askNow = async (tipId?: number) => {
    try {
      await ask.mutateAsync(tipId ? { tip_id: tipId } : {})
      toast.success(`Asked ${firstName}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't send that. Try again.")
    }
  }

  const stop = (event: React.MouseEvent) => event.stopPropagation()

  return (
    <div
      onClick={stop}
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden px-6 text-center ${variant === 'card' ? 'aspect-[4/3]' : 'h-full min-h-[280px]'} ${className}`}
      style={{ background: 'radial-gradient(120% 90% at 30% 20%, #2A3A6E 0%, #141A2E 55%, #0F1014 100%)', color: '#FFFFFF' }}
    >
      <span className="flex size-14 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.35)' }}>
        <Lock className="size-6" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <div className="mt-3 text-[19px] font-extrabold tracking-[-0.02em]" style={{ color: '#FFFFFF' }}>Private pact</div>
      <div className="mt-1 max-w-[280px] text-[13.5px] leading-snug" style={{ color: 'rgba(255,255,255,0.82)' }}>
        {moments > 0 ? `${moments} ${moments === 1 ? 'moment' : 'moments'} · ` : ''}
        {pending ? `You asked. ${firstName} decides who watches.` : said_no ? `${firstName} hasn't let you in.` : `${firstName} shares these with people they let in.`}
      </div>

      {pending ? (
        <div className="mt-4 flex flex-col items-center gap-1">
          <span className="flex h-11 items-center rounded-full px-5 text-[14px] font-extrabold" style={{ background: 'rgba(255,255,255,0.14)', color: '#FFFFFF' }}>
            Waiting for {firstName}
          </span>
          <button type="button" onClick={() => withdraw.mutate()} className="h-10 px-3 text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Cancel request
          </button>
        </div>
      ) : (
        <div className="mt-4 flex w-full max-w-[300px] gap-2">
          <button
            type="button"
            onClick={() => void askNow()}
            disabled={ask.isPending}
            className="h-11 flex-1 rounded-full text-[14.5px] font-extrabold disabled:opacity-60"
            style={{ background: '#FFFFFF', color: '#1F3A93' }}
          >
            {said_no ? 'Ask again' : 'Ask to watch'}
          </button>
          {tipInfo && (
            <button
              type="button"
              onClick={() => setTipOpen(true)}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-full text-[14.5px] font-extrabold"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,0.45)' }}
            >
              <IndianRupee className="size-4" strokeWidth={2.6} aria-hidden="true" />
              Tip &amp; ask
            </button>
          )}
        </div>
      )}

      {tipInfo && (
        <TipSheet
          open={tipOpen}
          onClose={() => setTipOpen(false)}
          tip={tipInfo}
          context={pact?.title}
          pactId={pactId}
          creatorName={creatorName}
          creatorAvatarUrl={pact?.creator_avatar_url || pact?.creatorAvatarUrl}
          onClaimed={(tip) => void askNow(tip.id)}
        />
      )}
    </div>
  )
}
