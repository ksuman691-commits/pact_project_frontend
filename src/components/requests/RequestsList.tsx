'use client'

// Shared by /requests and the Requests tab in Notifications.

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAccessInbox, useCircleRequests } from '@/hooks/usePactAccess'
import { useTipInbox } from '@/hooks/useTips'
import { useAuthStore } from '@/store/auth'
import { resolveWatcher, type AccessPerson, type AccessRow, type CircleJoinAsk } from '@/lib/api/access'
import { circleJoinRequestService } from '@/services/api'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'

function Face({ person }: { person: AccessPerson }) {
  const name = person.full_name || person.username
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[15px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
      {person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatar_url} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[16px] font-extrabold" style={{ color: INK }}>
        {title}
        {count ? ` · ${count}` : ''}
      </h2>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] px-4 py-4 text-center text-[13.5px]" style={{ border: `1.5px dashed ${LINE}`, color: MUTED }}>
      {text}
    </div>
  )
}

/**
 * One place for everyone waiting on the creator: people asking (or paying) to
 * watch private pacts, wherever they came from; people asking to join private
 * circles; and tips to confirm.
 */
export function RequestsList() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const watch = useAccessInbox(Boolean(user))
  const circles = useCircleRequests(Boolean(user))
  const tips = useTipInbox(Boolean(user))
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['access'] }),
      queryClient.invalidateQueries({ queryKey: ['pacts'] }),
      queryClient.invalidateQueries({ queryKey: ['tips'] }),
    ])

  const actWatch = async (row: AccessRow, action: 'approve' | 'deny') => {
    const key = `w${row.pact_id}-${row.user.id}`
    setBusy(key)
    try {
      await resolveWatcher(row.pact_id, row.user.id, action)
      await refresh()
      toast.success(action === 'approve' ? `${(row.user.full_name || row.user.username).split(' ')[0]} can watch now` : 'Done')
    } catch {
      toast.error('Could not update that')
    } finally {
      setBusy(null)
    }
  }

  const actCircle = async (row: CircleJoinAsk, action: 'approve' | 'reject') => {
    const key = `c${row.id}`
    setBusy(key)
    try {
      if (action === 'approve') await circleJoinRequestService.approve(row.circle_id, row.id)
      else await circleJoinRequestService.reject(row.circle_id, row.id)
      await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: ['circles'] })])
      toast.success(action === 'approve' ? `Added to ${row.circle_name}` : 'Done')
    } catch {
      toast.error('Could not update that')
    } finally {
      setBusy(null)
    }
  }

  const watchRows = watch.data?.pending ?? []
  const circleRows = circles.data?.pending ?? []
  const tipCount = Array.isArray((tips.data as any)?.waiting) ? (tips.data as any).waiting.length : 0

  return (
    <div>
        <Section title="To Watch" count={watchRows.length}>
          {watchRows.length === 0 ? (
            <Empty text="No one is waiting to watch your private pacts." />
          ) : (
            watchRows.map((row) => {
              const key = `w${row.pact_id}-${row.user.id}`
              const paid = row.tip != null
              return (
                <div key={key} className="rounded-[18px] p-3" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
                  <div className="flex items-start gap-3">
                    <Face person={row.user} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold" style={{ color: INK }}>{row.user.full_name || row.user.username}</div>
                      <Link href={`/pacts/${row.pact_id}?watchers=1`} className="block truncate text-[12.5px] font-semibold" style={{ color: NAVY }}>
                        {row.pact_title || 'Your pact'}
                      </Link>
                      {row.note && <div className="mt-1 text-[13px]" style={{ color: INK }}>“{row.note}”</div>}
                      {paid && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: '#E8ECF7', color: NAVY }}>
                          <IndianRupee className="size-3" strokeWidth={2.6} />
                          {row.tip?.amount ?? ''} · {row.tip?.code} · check your UPI
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={busy === key} onClick={() => void actWatch(row, 'deny')} className="h-10 rounded-full text-[13.5px] font-bold disabled:opacity-60" style={{ background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }}>
                      {paid ? 'Didn’t arrive' : 'Not now'}
                    </button>
                    <button type="button" disabled={busy === key} onClick={() => void actWatch(row, 'approve')} className="h-10 rounded-full text-[13.5px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
                      {paid ? `Received ₹${row.tip?.amount ?? ''} · let in` : 'Let them watch'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </Section>

        <Section title="To Join A Circle" count={circleRows.length}>
          {circleRows.length === 0 ? (
            <Empty text="No one is asking to join your private circles." />
          ) : (
            circleRows.map((row) => {
              const key = `c${row.id}`
              return (
                <div key={key} className="rounded-[18px] p-3" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
                  <div className="flex items-center gap-3">
                    <Face person={row.user} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold" style={{ color: INK }}>{row.user.full_name || row.user.username}</div>
                      <Link href={`/circles/${row.circle_id}`} className="block truncate text-[12.5px] font-semibold" style={{ color: NAVY }}>
                        {row.circle_name}
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={busy === key} onClick={() => void actCircle(row, 'reject')} className="h-10 rounded-full text-[13.5px] font-bold disabled:opacity-60" style={{ background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }}>
                      Not now
                    </button>
                    <button type="button" disabled={busy === key} onClick={() => void actCircle(row, 'approve')} className="h-10 rounded-full text-[13.5px] font-extrabold disabled:opacity-60" style={{ background: NAVY, color: '#FFFFFF' }}>
                      Let them in
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </Section>

        <Section title="Tips To Confirm" count={tipCount}>
          <Link href="/profile/tips/inbox" className="flex min-h-14 items-center gap-3 rounded-[18px] px-4 py-3" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: NAVY, color: '#FFFFFF' }}>
              <IndianRupee className="size-5" strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1 text-[14.5px] font-bold" style={{ color: INK }}>
              {tipCount > 0 ? `${tipCount} waiting. Check your UPI app, then confirm.` : 'All tips confirmed'}
            </span>
            <ChevronRight className="size-5 shrink-0" style={{ color: MUTED }} />
          </Link>
        </Section>
    </div>
  )
}
