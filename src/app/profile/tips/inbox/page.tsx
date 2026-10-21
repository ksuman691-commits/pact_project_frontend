'use client'

import { ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSmartBack } from '@/hooks/useSmartBack'
import { useResolveTip, useTipInbox } from '@/hooks/useTips'
import { useAuthStore } from '@/store/auth'
import type { TipRecord } from '@/lib/api/tips'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'

function ago(value: string | null) {
  if (!value) return ''
  const minutes = Math.max(0, Math.round((Date.now() - new Date(`${value}${value.endsWith('Z') ? '' : 'Z'}`).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

function Face({ tip }: { tip: TipRecord }) {
  const name = tip.tipper?.full_name || tip.tipper?.username || '?'
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[15px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
      {tip.tipper?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tip.tipper.avatar_url} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

/**
 * Where a creator confirms tips. Each claim shows the code that was in the UPI
 * note, so it can be matched against the payment in GPay or PhonePe.
 */
export default function TipInboxPage() {
  const goBack = useSmartBack('/profile')
  const { user } = useAuthStore()
  const { data, isLoading } = useTipInbox(Boolean(user))
  const resolve = useResolveTip()

  const act = async (tip: TipRecord, action: 'confirm' | 'reject') => {
    try {
      await resolve.mutateAsync({ id: tip.id, action })
      toast.success(action === 'confirm' ? 'Confirmed. Thanks sent.' : 'Marked as not received')
    } catch {
      toast.error('Could not update that tip')
    }
  }

  const waiting = data?.waiting ?? []
  const resolved = data?.resolved ?? []

  return (
    <main className="min-h-screen pb-28" style={{ background: 'var(--paper)', color: INK }}>
      <header className="sticky top-0 z-30 flex h-14 items-center px-2" style={{ background: 'rgba(244,239,228,0.94)', backdropFilter: 'blur(12px)' }}>
        <button type="button" onClick={goBack} aria-label="Go back" className="flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex-1 text-center text-[16px] font-bold" style={{ color: INK }}>Tips received</div>
        <span className="size-11" />
      </header>

      <div className="mx-auto max-w-md px-4">
        <div className="mt-2 rounded-[20px] px-4 py-4" style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}>
          <div className="text-[13px] font-bold" style={{ color: MUTED }}>Confirmed so far</div>
          <div className="mt-1 text-[30px] font-extrabold tracking-[-0.03em]" style={{ color: INK }}>₹{(data?.confirmed_total ?? 0).toLocaleString('en-IN')}</div>
          <div className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
            Only tips you confirm count on your pacts and profile. Check the code in the payment note in your UPI app before you confirm.
          </div>
        </div>

        <div className="mt-6 text-[15px] font-extrabold" style={{ color: INK }}>To confirm{waiting.length ? ` · ${waiting.length}` : ''}</div>
        {isLoading ? (
          <div className="pact-shimmer mt-3 h-[120px] rounded-[20px]" aria-hidden="true" />
        ) : waiting.length === 0 ? (
          <div className="mt-3 rounded-[20px] px-5 py-7 text-center text-[14px]" style={{ border: `1.5px dashed ${LINE}`, color: MUTED }}>
            Nothing waiting. When someone says they tipped you, it shows up here.
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {waiting.map((tip) => {
              const name = tip.tipper?.full_name || tip.tipper?.username || 'Someone'
              return (
                <div key={tip.id} className="rounded-[20px] p-4" style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}>
                  <div className="flex items-center gap-3">
                    <Face tip={tip} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-extrabold" style={{ color: INK }}>
                        {name} {tip.amount ? `· ₹${tip.amount}` : ''}
                      </div>
                      <div className="truncate text-[13px]" style={{ color: MUTED }}>
                        {tip.pact_title ? `${tip.pact_title} · ` : ''}
                        {ago(tip.claimed_at)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-extrabold" style={{ background: '#E8ECF7', color: NAVY }}>{tip.code}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={resolve.isPending} onClick={() => void act(tip, 'reject')} className="h-11 rounded-full text-[14px] font-bold disabled:opacity-60" style={{ background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }}>
                      Didn&apos;t arrive
                    </button>
                    <button type="button" disabled={resolve.isPending} onClick={() => void act(tip, 'confirm')} className="h-11 rounded-full text-[14px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
                      Received
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {resolved.length > 0 && (
          <>
            <div className="mt-7 text-[15px] font-extrabold" style={{ color: INK }}>Earlier</div>
            <div className="mt-2 flex flex-col">
              {resolved.map((tip) => (
                <div key={tip.id} className="flex min-h-14 items-center gap-3 py-1.5">
                  <Face tip={tip} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-bold" style={{ color: INK }}>
                      {tip.tipper?.full_name || tip.tipper?.username} {tip.amount ? `· ₹${tip.amount}` : ''}
                    </div>
                    <div className="truncate text-[12.5px]" style={{ color: MUTED }}>{tip.code} · {ago(tip.resolved_at)}</div>
                  </div>
                  <span className="text-[12.5px] font-bold" style={{ color: tip.status === 'confirmed' ? '#2E7D4F' : MUTED }}>
                    {tip.status === 'confirmed' ? 'Received' : "Didn't arrive"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
