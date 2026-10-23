'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Camera, Check, X } from 'lucide-react'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import { useBackToClose } from '@/hooks/useBackToClose'
import { useTodayStatus, type TodayPact } from '@/hooks/useTodayStatus'

/**
 * The camera button: one tap to post today's moment. It sits raised in the
 * middle of the bottom nav, with a badge counting pacts still waiting today.
 * With one pact waiting it opens the camera straight away; with more, it asks
 * which pact first (waiting ones on top). With no pacts it starts a new one.
 */
export default function QuickPostButton({ onCreatePact }: { onCreatePact?: () => void }) {
  const router = useRouter()
  const { pacts, isLoading } = useTodayStatus()
  // The nav is its own fixed layer, so its sheets render on <body> instead.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [picking, setPicking] = useState(false)
  const [capture, setCapture] = useState<TodayPact | null>(null)
  useBackToClose(picking, () => setPicking(false))

  const waiting = pacts.filter((p) => !p.posted_today)
  const ordered = [...waiting, ...pacts.filter((p) => p.posted_today)]

  const open = () => {
    if (isLoading) return
    if (pacts.length === 0) return onCreatePact ? onCreatePact() : router.push('/pacts/create')
    if (waiting.length === 1) return setCapture(waiting[0])
    if (pacts.length === 1) return setCapture(pacts[0])
    setPicking(true)
  }

  return (
    <>
      <span className="relative flex flex-1 items-start justify-center">
        <button
          type="button"
          onClick={open}
          aria-label={waiting.length > 0 ? `Post a moment, ${waiting.length} ${waiting.length === 1 ? 'pact' : 'pacts'} waiting` : 'Post a moment'}
          className="relative -mt-[14px] flex size-[52px] items-center justify-center rounded-full transition active:scale-95"
          style={{ background: '#1F3A93', color: '#FFFFFF', boxShadow: '0 0 0 4px var(--paper), 0 10px 22px -8px rgba(31,58,147,0.7)' }}
        >
          <Camera className="size-6" strokeWidth={2.2} aria-hidden="true" />
          {waiting.length > 0 && (
            <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-[5px] text-[11px] font-extrabold" style={{ background: '#FFFFFF', color: '#1F3A93', boxShadow: '0 0 0 1.5px #1F3A93' }}>
              {waiting.length}
            </span>
          )}
        </button>
      </span>

      {mounted && picking && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Post to which pact" className="fixed inset-0 z-[85] flex items-end justify-center">
          <button type="button" aria-label="Close" onClick={() => setPicking(false)} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
          {/* Capped at 80% of the screen: with many pacts the list scrolls and the header stays put. */}
          <div className="relative flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" style={{ background: '#FBF8F1', color: '#17181D' }}>
            <div className="mx-auto mb-2 h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
            <div className="flex items-center justify-between">
              <div className="text-[19px] font-extrabold" style={{ color: '#17181D' }}>Post today&apos;s moment</div>
              <button type="button" onClick={() => setPicking(false)} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center" style={{ color: '#17181D' }}>
                <X className="size-5" />
              </button>
            </div>
            <div className="-mx-1 mt-2 flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-1 pb-1">
              {ordered.map((pact) => (
                <button
                  key={pact.id}
                  type="button"
                  onClick={() => {
                    setPicking(false)
                    setCapture(pact)
                  }}
                  className="flex min-h-[60px] items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-left"
                  style={{ background: '#FFFFFF', border: pact.posted_today ? '1px solid #E6E1D6' : '1.5px solid #1F3A93' }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold" style={{ color: '#17181D' }}>{pact.title}</span>
                    <span className="block truncate text-[12.5px]" style={{ color: pact.posted_today ? '#2E7D4F' : '#1F3A93' }}>
                      {pact.posted_today ? 'Posted today' : 'Waiting for today'}{pact.circle_name ? ` · ${pact.circle_name}` : ''}
                    </span>
                  </span>
                  {pact.posted_today ? (
                    <span className="flex size-8 items-center justify-center rounded-full" style={{ background: '#2E7D4F', color: '#FFFFFF' }}>
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-full" style={{ background: '#1F3A93', color: '#FFFFFF' }}>
                      <Camera className="size-[18px]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {mounted && capture && createPortal(<StoryCaptureSheet isOpen onClose={() => setCapture(null)} pactId={Number(capture.id)} pactTitle={capture.title} />, document.body)}
    </>
  )
}
