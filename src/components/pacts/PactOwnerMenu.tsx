'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Lock, MoreHorizontal, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { pactService } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'

type PactLike = { id: number | string; title?: string; media_locked?: boolean; watch_price?: number | null; join_count?: number }

/**
 * Creator-only "⋯" menu on a pact. Today it holds Delete pact.
 *
 * A pact that is priced to watch can't be deleted, so the row explains why
 * instead of offering a button that can't work. The server has the final say:
 * it also refuses pacts that were paid for earlier, even if the price has since
 * been removed, and the message it sends back is shown as-is.
 */
export default function PactOwnerMenu({ pact }: { pact: PactLike }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const pactId = Number(pact.id)
  const isPaid = Boolean(pact.media_locked && pact.watch_price)
  const others = Math.max(Number(pact.join_count ?? 0) - 1, 0)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const remove = async () => {
    setDeleting(true)
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
      toast.error(error?.response?.data?.detail || "Couldn't delete this pact. Try again.")
      setDeleting(false)
      setConfirming(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pact options"
        className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--ink)]"
      >
        <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Pact options">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" style={{ background: 'rgba(23,24,29,0.52)' }} />
          <div className="relative w-full max-w-md rounded-t-[22px] bg-[var(--card)] px-6 pb-8 pt-3 text-[var(--ink)]" style={{ boxShadow: '0 -12px 30px -12px rgba(23,24,29,0.35)' }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--seat-border)]" aria-hidden="true" />
            {isPaid ? (
              <div className="flex items-start gap-3 py-2">
                <Lock className="mt-0.5 size-5 shrink-0 text-[var(--muted)]" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="text-[16px] font-extrabold text-[var(--muted)]">Delete pact</p>
                  <p className="mt-0.5 text-[13.5px] leading-[1.45] text-[var(--muted)]">Paid pacts can&apos;t be deleted. People pay to watch them, so they stay up.</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-[16px] font-extrabold"
                style={{ color: '#B3261E' }}
              >
                <Trash2 className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
                Delete pact
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirming}
        onClose={() => (deleting ? undefined : setConfirming(false))}
        onConfirm={() => void remove()}
        title="Delete this pact?"
        description={`"${pact.title ?? 'This pact'}" and all its moments, comments and likes will be gone for good.${
          others > 0 ? ` ${others} ${others === 1 ? 'person' : 'people'} joined, and they'll be told.` : ''
        }`}
        confirmLabel="Delete pact"
        destructive
        loading={deleting}
      />
    </>
  )
}
