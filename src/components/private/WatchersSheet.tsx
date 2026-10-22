'use client'

import { useEffect, useState } from 'react'
import { Lock, X } from 'lucide-react'
import PriceChooser from '@/components/private/PriceChooser'
import toast from 'react-hot-toast'
import { useBackToClose } from '@/hooks/useBackToClose'
import { useResolveWatcher, useSetPactPrivate, useUpdateWatchSettings, useWatchers } from '@/hooks/usePactAccess'
import type { AccessRow } from '@/lib/api/access'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'

function Face({ row }: { row: AccessRow }) {
  const name = row.user.full_name || row.user.username
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[14px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
      {row.user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.user.avatar_url} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

function TipLine({ row }: { row: AccessRow }) {
  if (!row.tip) return null
  const confirmed = row.tip.status === 'confirmed'
  return (
    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: confirmed ? '#E3F1E8' : '#E8ECF7', color: confirmed ? '#2E7D4F' : NAVY }}>
      ₹{row.tip.amount ?? ''} tip · {row.tip.code} · {confirmed ? 'received' : 'check your UPI'}
    </span>
  )
}

/**
 * The creator's control room for a pact: make it private, let people in,
 * turn them away or take access back.
 */
export default function WatchersSheet({ open, onClose, pactId, mediaLocked, watchPrice = null, watchAutoApprove = false, inCircle = false }: { open: boolean; onClose: () => void; pactId: number; mediaLocked: boolean; watchPrice?: number | null; watchAutoApprove?: boolean; inCircle?: boolean }) {
  useBackToClose(open, onClose)
  const watchers = useWatchers(pactId, open)
  const resolve = useResolveWatcher(pactId)
  const setPrivate = useSetPactPrivate(pactId)
  const saveSettings = useUpdateWatchSettings(pactId)
  const [price, setPrice] = useState<number | null>(watchPrice)
  const [auto, setAuto] = useState(watchAutoApprove)
  const [askKeep, setAskKeep] = useState(false)
  useEffect(() => {
    if (!open) return
    setAskKeep(false)
    setPrice(watchPrice)
    setAuto(watchAutoApprove)
  }, [open, watchPrice, watchAutoApprove])
  if (!open) return null
  const settingsChanged = price !== watchPrice || auto !== watchAutoApprove
  const saveWatch = async () => {
    try {
      await saveSettings.mutateAsync({ watch_price: price, watch_auto_approve: price != null && auto })
      toast.success(price != null ? `₹${price} to watch` : 'Free to ask')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not save the price')
      setPrice(watchPrice)
    }
  }

  const locked = watchers.data?.media_locked ?? mediaLocked
  const pending = watchers.data?.pending ?? []
  const approved = watchers.data?.approved ?? []

  const act = async (row: AccessRow, action: 'approve' | 'deny' | 'revoke') => {
    try {
      await resolve.mutateAsync({ userId: row.user.id, action })
    } catch {
      toast.error('Could not update that')
    }
  }

  const lock = async (next: boolean, keepMembers = true) => {
    setAskKeep(false)
    try {
      await setPrivate.mutateAsync({ locked: next, keepMembers })
      await watchers.refetch()
      toast.success(!next ? 'Pact is open again' : inCircle ? (keepMembers ? 'Private. Current circle members keep watching.' : 'Private. Everyone pays or asks from now.') : 'Pact is private')
    } catch {
      toast.error('Could not change that')
    }
  }
  // Locking a circle pact asks once whether the people already in the circle keep watching.
  const toggle = () => (!locked && inCircle ? setAskKeep(true) : void lock(!locked))

  return (
    <div role="dialog" aria-modal="true" aria-label="Who can watch" className="fixed inset-0 z-[90] flex items-end justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" style={{ background: '#FBF8F1', color: INK }}>
        <div className="mx-auto mb-2 h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-extrabold" style={{ color: INK }}>Who can watch</div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center" style={{ color: INK }}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-[18px] p-3.5" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: locked ? NAVY : '#EFEBE1', color: locked ? '#FFFFFF' : INK }}>
            <Lock className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold" style={{ color: INK }}>Private pact</div>
            <div className="text-[12.5px] leading-snug" style={{ color: MUTED }}>
              {locked ? 'Only you, people in the pact and people you let in see the moments.' : 'Anyone who can see the pact sees the moments.'}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={locked}
            aria-label="Private pact"
            onClick={toggle}
            disabled={setPrivate.isPending}
            className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-60"
            style={{ background: locked ? NAVY : '#D4D5D9' }}
          >
            <span className="absolute top-1 size-6 rounded-full transition-all" style={{ background: '#FFFFFF', left: locked ? 24 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        {askKeep && !locked && (
          <div className="mt-3 rounded-[18px] p-3.5" style={{ background: '#FFFFFF', border: `2px solid ${INK}` }}>
            <div className="text-[15px] font-extrabold" style={{ color: INK }}>People already in the circle</div>
            <div className="mt-0.5 text-[12.5px] leading-snug" style={{ color: MUTED }}>New people always ask or pay. Choose for everyone in the circle today.</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={setPrivate.isPending} onClick={() => void lock(true, true)} className="min-h-11 rounded-full px-2 text-[13.5px] font-extrabold disabled:opacity-60" style={{ background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }}>
                Keep them watching
              </button>
              <button type="button" disabled={setPrivate.isPending} onClick={() => void lock(true, false)} className="min-h-11 rounded-full px-2 text-[13.5px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
                Everyone pays
              </button>
            </div>
          </div>
        )}

        {locked && (
          <>
            <div className="mt-4 rounded-[18px] p-3.5" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
              <PriceChooser price={price} onPrice={setPrice} autoApprove={auto} onAutoApprove={setAuto} disabled={saveSettings.isPending} />
              {settingsChanged && (
                <button type="button" onClick={() => void saveWatch()} disabled={saveSettings.isPending} className="mt-3 h-11 w-full rounded-full text-[14.5px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
                  {saveSettings.isPending ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
            <div className="mt-5 text-[14.5px] font-extrabold" style={{ color: INK }}>Asking to watch{pending.length ? ` · ${pending.length}` : ''}</div>
            {pending.length === 0 ? (
              <div className="mt-2 rounded-[16px] px-4 py-5 text-center text-[13.5px]" style={{ border: `1.5px dashed ${LINE}`, color: MUTED }}>
                No one is waiting. Followers, circle members and visitors ask or pay here.
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {pending.map((row) => (
                  <div key={row.user.id} className="rounded-[18px] p-3" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
                    <div className="flex items-start gap-3">
                      <Face row={row} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold" style={{ color: INK }}>{row.user.full_name || row.user.username}</div>
                        <div className="truncate text-[12.5px]" style={{ color: MUTED }}>@{row.user.username}</div>
                        {row.note && <div className="mt-1 text-[13px]" style={{ color: INK }}>“{row.note}”</div>}
                        <TipLine row={row} />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" disabled={resolve.isPending} onClick={() => void act(row, 'deny')} className="h-10 rounded-full text-[13.5px] font-bold disabled:opacity-60" style={{ background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }}>
                        {row.tip ? 'Didn’t arrive' : 'Not now'}
                      </button>
                      <button type="button" disabled={resolve.isPending} onClick={() => void act(row, 'approve')} className="h-10 rounded-full text-[13.5px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
                        {row.tip ? `Received ₹${row.tip.amount ?? ''} · let in` : 'Let them watch'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 text-[14.5px] font-extrabold" style={{ color: INK }}>Can watch{approved.length ? ` · ${approved.length}` : ''}</div>
            <div className="mt-1 text-[12.5px]" style={{ color: MUTED }}>People in the pact always can. These are viewers you let in, from anywhere.</div>
            {approved.length === 0 ? (
              <div className="py-4 text-[13.5px]" style={{ color: MUTED }}>Nobody extra yet.</div>
            ) : (
              <div className="mt-2 flex flex-col">
                {approved.map((row) => (
                  <div key={row.user.id} className="flex min-h-14 items-center gap-3 py-1">
                    <Face row={row} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-bold" style={{ color: INK }}>{row.user.full_name || row.user.username}</div>
                      <TipLine row={row} />
                    </div>
                    <button type="button" onClick={() => void act(row, 'revoke')} disabled={resolve.isPending} className="h-9 rounded-full px-3 text-[13px] font-bold disabled:opacity-60" style={{ color: MUTED, border: `1px solid ${LINE}` }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
