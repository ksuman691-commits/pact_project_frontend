'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Lock, LogOut, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { joinRequestService, pactService } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'
import { useBackToClose } from '@/hooks/useBackToClose'

type PactLike = {
  id: number | string
  title?: string
  description?: string | null
  status?: string
  media_locked?: boolean
  watch_price?: number | null
  join_count?: number
  current_day?: number | null
  total_days?: number | null
  duration_days?: number | null
  end_date?: string | null
}

type Sheet = null | 'menu' | 'edit' | 'extend'
const EXTEND_OPTIONS = [7, 14, 21, 30]

function serverReason(error: any, fallback: string): string {
  return error?.response?.data?.detail && typeof error.response.data.detail === 'string' ? error.response.data.detail : fallback
}

function addDays(iso: string | null | undefined, days: number): string | null {
  if (!iso) return null
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/**
 * The "⋯" menu on a pact.
 * Creator: Edit, Extend, Delete. Someone who joined: Leave.
 * Paid pacts (people paid to watch) keep what people paid for: title typo fixes only, no extending,
 * no deleting. The server has the final say and its message is shown as-is.
 */
export default function PactOwnerMenu({ pact, role = 'creator' }: { pact: PactLike; role?: 'creator' | 'member' }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [confirming, setConfirming] = useState<null | 'delete' | 'leave'>(null)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(pact.title ?? '')
  const [details, setDetails] = useState(pact.description ?? '')
  const [extra, setExtra] = useState(7)

  const pactId = Number(pact.id)
  const isPaid = Boolean(pact.media_locked && pact.watch_price)
  const running = (pact.status ?? 'active') === 'active' && pact.current_day != null
  const others = Math.max(Number(pact.join_count ?? 0) - 1, 0)
  const total = Number(pact.total_days ?? pact.duration_days ?? 0)

  useBackToClose(sheet !== null, () => setSheet(null))
  useEffect(() => {
    if (sheet === 'edit') {
      setTitle(pact.title ?? '')
      setDetails(pact.description ?? '')
    }
  }, [sheet, pact.title, pact.description])

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all }),
      queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
      queryClient.invalidateQueries({ queryKey: ['me-today'] }),
    ])

  const run = async (work: () => Promise<unknown>, done: string, fallback: string) => {
    setBusy(true)
    try {
      await work()
      await refresh()
      toast.success(done)
      setSheet(null)
      return true
    } catch (error: any) {
      toast.error(serverReason(error, fallback))
      return false
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = () => {
    const nextTitle = title.trim()
    if (!nextTitle) return toast.error('A pact needs a title.')
    const body: Record<string, string> = {}
    if (nextTitle !== (pact.title ?? '').trim()) body.title = nextTitle
    if (!isPaid && details !== (pact.description ?? '')) body.description = details
    if (Object.keys(body).length === 0) return setSheet(null)
    void run(() => pactService.update(pactId, body), 'Pact updated', "Couldn't save. Try again.")
  }

  const saveExtend = () =>
    void run(() => pactService.extend(pactId, extra), `Extended by ${extra} days`, "Couldn't extend this pact. Try again.")

  const remove = async () => {
    setBusy(true)
    try {
      await pactService.remove(pactId)
      queryClient.removeQueries({ queryKey: queryKeys.pacts.detail(pactId) })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all }),
        queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
        queryClient.invalidateQueries({ queryKey: ['my-watching'] }),
      ])
      toast.success('Pact deleted')
      router.replace('/pacts')
    } catch (error: any) {
      toast.error(serverReason(error, "Couldn't delete this pact. Try again."))
      setBusy(false)
      setConfirming(null)
      setSheet(null)
    }
  }

  const leave = async () => {
    const ok = await run(() => joinRequestService.leavePact(pactId), 'You left this pact', "Couldn't leave this pact. Try again.")
    setConfirming(null)
    if (ok) router.replace('/pacts')
  }

  const row = 'flex min-h-12 w-full items-center gap-3 py-2 text-left text-[16px] font-extrabold'
  const lockedRow = (Icon: any, label: string, why: string) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 size-5 shrink-0 text-[var(--muted)]" strokeWidth={2} aria-hidden="true" />
      <div>
        <p className="text-[16px] font-extrabold text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 text-[13.5px] leading-[1.45] text-[var(--muted)]">{why}</p>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setSheet('menu')}
        aria-label="Pact options"
        className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--ink)]"
      >
        <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={sheet === 'edit' ? 'Edit pact' : sheet === 'extend' ? 'Extend pact' : 'Pact options'}>
          <button type="button" aria-label="Close" onClick={() => setSheet(null)} className="absolute inset-0 cursor-default" style={{ background: 'rgba(23,24,29,0.52)' }} />
          <div className="relative w-full max-w-md rounded-t-[22px] bg-[var(--card)] px-6 pb-8 pt-3 text-[var(--ink)]" style={{ boxShadow: '0 -12px 30px -12px rgba(23,24,29,0.35)' }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--seat-border)]" aria-hidden="true" />

            {sheet === 'menu' && role === 'member' && (
              <button type="button" onClick={() => setConfirming('leave')} className={row} style={{ color: '#B3261E' }}>
                <LogOut className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                Leave pact
              </button>
            )}

            {sheet === 'menu' && role === 'creator' && (
              <>
                <button type="button" onClick={() => setSheet('edit')} className={row}>
                  <Pencil className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                  Edit title and details
                </button>
                {!running
                  ? lockedRow(CalendarPlus, 'Extend', 'This pact has ended. Start a new one to keep going.')
                  : isPaid
                    ? lockedRow(CalendarPlus, 'Extend', 'People paid to watch this pact as it is, so its length stays.')
                    : (
                      <button type="button" onClick={() => setSheet('extend')} className={row}>
                        <CalendarPlus className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                        Extend
                      </button>
                    )}
                {isPaid ? (
                  lockedRow(Lock, 'Delete pact', "Paid pacts can't be deleted. People pay to watch them, so they stay up.")
                ) : (
                  <button type="button" onClick={() => setConfirming('delete')} className={row} style={{ color: '#B3261E' }}>
                    <Trash2 className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                    Delete pact
                  </button>
                )}
              </>
            )}

            {sheet === 'edit' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveEdit()
                }}
              >
                <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">Edit pact</h2>
                {isPaid && <p className="mt-1 text-[13px] leading-[1.45] text-[var(--muted)]">People paid to watch this pact, so you can fix small typos in the title only.</p>}
                <label className="mt-4 block text-[13px] font-bold text-[var(--muted)]" htmlFor="pact-title">Title</label>
                <input id="pact-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-1.5 h-12 w-full rounded-2xl border border-[var(--hairline)] bg-white px-3.5 text-[16px] font-semibold" />
                <label className="mt-3 block text-[13px] font-bold text-[var(--muted)]" htmlFor="pact-details">Details</label>
                <textarea
                  id="pact-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={isPaid}
                  rows={3}
                  placeholder="What counts, the rule, anything that helps people keep you honest"
                  className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--hairline)] bg-white px-3.5 py-3 text-[16px] disabled:opacity-60"
                />
                <button type="submit" disabled={busy} className="mt-4 h-12 w-full rounded-full bg-[var(--navy)] text-[15px] font-extrabold text-white disabled:opacity-60">
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </form>
            )}

            {sheet === 'extend' && (
              <div>
                <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">Extend this pact</h2>
                <p className="mt-1 text-[13.5px] text-[var(--muted)]">Keep going without starting over. Your streak and moments stay.</p>
                <div className="mt-4 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Days to add">
                  {EXTEND_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={extra === n}
                      onClick={() => setExtra(n)}
                      className={`h-11 rounded-full text-[14px] font-extrabold ${extra === n ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13.5px] font-semibold">
                  {total ? `${total} → ${total + extra} days` : `+${extra} days`}
                  {addDays(pact.end_date, extra) ? ` · now ends ${addDays(pact.end_date, extra)}` : ''}
                </p>
                <button type="button" onClick={saveExtend} disabled={busy} className="mt-4 h-12 w-full rounded-full bg-[var(--navy)] text-[15px] font-extrabold text-white disabled:opacity-60">
                  {busy ? 'Extending…' : `Add ${extra} days`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirming === 'delete'}
        onClose={() => (busy ? undefined : setConfirming(null))}
        onConfirm={() => void remove()}
        title="Delete this pact?"
        description={`"${pact.title ?? 'This pact'}" and all its moments, comments and likes will be gone for good.${
          others > 0 ? ` ${others} ${others === 1 ? 'person' : 'people'} joined, and they'll be told.` : ''
        }`}
        confirmLabel="Delete pact"
        destructive
        loading={busy}
      />
      <ConfirmModal
        isOpen={confirming === 'leave'}
        onClose={() => (busy ? undefined : setConfirming(null))}
        onConfirm={() => void leave()}
        title="Leave this pact?"
        description="Days you've already missed stay on your CP Score. Leaving within a week of joining counts as quitting (−2)."
        confirmLabel="Leave pact"
        destructive
        loading={busy}
      />
    </>
  )
}
