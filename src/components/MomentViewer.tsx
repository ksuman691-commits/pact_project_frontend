'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, Flag, MessageCircle, Play, Send, Trash2, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import DeleteMomentSheet from '@/components/stories/DeleteMomentSheet'
import ReportMomentSheet from '@/components/stories/ReportMomentSheet'
import { useDeleteMoment } from '@/hooks/useStories'
import { useAuthStore } from '@/store/auth'
import LikeButton from '@/components/LikeButton'

export interface ViewerMoment {
  id: number | string
  url?: string
  type?: string
  description?: string
  day?: number
  uploadedAt?: string
  username?: string
  authorName?: string
  avatarUrl?: string
  userId?: number | string
}

interface MomentViewerProps {
  moments: ViewerMoment[]
  startIndex: number
  pactId: number
  /** The pact's name, shown in the top bar. */
  title?: string
  likeCount: number
  liked: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
  onComment: () => void
}

const INK = '#17181D'
const MUTED = '#5A5C63'
const PAPER = '#F3EEE4'

function when(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return sameDay ? `Today · ${time}` : `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · ${time}`
}

function Avatar({ moment }: { moment: ViewerMoment }) {
  const [broken, setBroken] = useState(false)
  const letter = (moment.authorName || moment.username || 'M').charAt(0).toUpperCase()
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-extrabold text-white" style={{ background: '#1F3A93' }}>
      {moment.avatarUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={moment.avatarUrl} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        letter
      )}
    </span>
  )
}

/** A video in the feed: plays (muted until you ask) while it's on screen, loops, pauses when scrolled away. */
function FeedVideo({ src, muted, onToggleSound }: { src?: string; muted: boolean; onToggleSound: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) void video.play().then(() => setBlocked(false)).catch(() => setBlocked(true))
        else video.pause()
      },
      { threshold: [0, 0.6, 1] },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (ref.current) ref.current.muted = muted
  }, [muted])
  return (
    <div className="relative size-full">
      <video ref={ref} src={src} playsInline loop muted={muted} preload="metadata" className="size-full object-cover" onClick={onToggleSound} />
      <button
        type="button"
        onClick={onToggleSound}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full text-white"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      {blocked && (
        <button
          type="button"
          aria-label="Play video"
          onClick={() => void ref.current?.play().then(() => setBlocked(false)).catch(() => {})}
          className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"
        >
          <Play className="ml-1 size-6 fill-current" />
        </button>
      )}
    </div>
  )
}

/**
 * A pact's moments as a scrolling feed of big posts, one per day, like
 * Instagram: who posted it and which day on top, the photo or video full
 * width, then like / comment / share and the caption. Opens at the moment
 * you tapped. Nothing moves on by itself.
 */
export default function MomentViewer({ moments, startIndex, pactId, title, likeCount, liked, onClose, onIndexChange, onComment }: MomentViewerProps) {
  const me = useAuthStore((state) => state.user)
  const { remove: removeMoment, deleting } = useDeleteMoment()
  const [muted, setMuted] = useState(true)
  const [failed, setFailed] = useState<Set<string>>(() => new Set())
  const [deleteTarget, setDeleteTarget] = useState<ViewerMoment | null>(null)
  const [reportTarget, setReportTarget] = useState<ViewerMoment | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())
  const historyOwned = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onIndexRef = useRef(onIndexChange)
  onIndexRef.current = onIndexChange

  const close = useCallback(() => {
    if (historyOwned.current && window.history.state?.momentViewer) {
      window.history.back()
      return
    }
    onClose()
  }, [onClose])

  // One history entry for the viewer's lifetime, so the phone's back button closes it.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.history.pushState({ ...(window.history.state || {}), momentViewer: true }, '')
    historyOwned.current = true
    const onPopState = () => {
      historyOwned.current = false
      onCloseRef.current()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Open at the moment that was tapped.
  useEffect(() => {
    const el = itemRefs.current.get(startIndex)
    if (el && scrollRef.current) scrollRef.current.scrollTop = el.offsetTop - 8
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Tell the page which moment is on screen (it highlights that day).
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (best) onIndexRef.current(Number((best.target as HTMLElement).dataset.index))
      },
      { root, threshold: [0.5, 0.75] },
    )
    itemRefs.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [moments.length])

  const share = async () => {
    const url = `${window.location.origin}/pacts/${pactId}`
    try {
      if (navigator.share) await navigator.share({ url, title: title || 'CirclePact' })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied')
      }
    } catch {
      // Closing the share sheet is not an error.
    }
  }

  if (moments.length === 0) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Moments" className="fixed inset-0 z-[100] flex flex-col" style={{ background: PAPER, color: INK, paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2" style={{ borderColor: '#E3DACA', background: PAPER }}>
        <button type="button" aria-label="Close moments" onClick={close} className="flex size-11 items-center justify-center rounded-full">
          <ChevronLeft className="size-6" />
        </button>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-extrabold tracking-[-0.02em]">{title || 'Moments'}</div>
          <div className="text-[12px] font-semibold" style={{ color: MUTED }}>
            {moments.length} {moments.length === 1 ? 'moment' : 'moments'}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {moments.map((moment, i) => {
          const mine = me?.id != null && moment.userId != null && Number(moment.userId) === me.id
          const broken = moment.url ? failed.has(moment.url) : true
          const stamp = when(moment.uploadedAt)
          return (
            <article
              key={moment.id}
              data-index={i}
              ref={(el) => {
                if (el) itemRefs.current.set(i, el)
                else itemRefs.current.delete(i)
              }}
              className="pb-5 pt-3"
              aria-label={`Day ${moment.day ?? i + 1}`}
            >
              <div className="flex items-center gap-2.5 px-4 pb-2.5">
                <Avatar moment={moment} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{moment.authorName || moment.username || 'Member'}</div>
                  <div className="truncate text-[12px] font-semibold" style={{ color: MUTED }}>
                    Day {moment.day ?? i + 1}
                    {stamp ? ` · ${stamp}` : ''}
                  </div>
                </div>
                {typeof moment.id === 'number' && mine && (
                  <button type="button" aria-label={`Delete day ${moment.day ?? i + 1} moment`} onClick={() => setDeleteTarget(moment)} className="flex size-11 items-center justify-center rounded-full" style={{ color: MUTED }}>
                    <Trash2 className="size-5" />
                  </button>
                )}
                {typeof moment.id === 'number' && !mine && me?.id != null && (
                  <button type="button" aria-label="Report this moment" onClick={() => setReportTarget(moment)} className="flex size-11 items-center justify-center rounded-full" style={{ color: MUTED }}>
                    <Flag className="size-5" />
                  </button>
                )}
              </div>

              <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '4 / 5' }}>
                {moment.type === 'video' ? (
                  <FeedVideo src={moment.url} muted={muted} onToggleSound={() => setMuted((m) => !m)} />
                ) : !broken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={moment.url}
                    alt={moment.description || `Day ${moment.day ?? i + 1} moment`}
                    loading={Math.abs(i - startIndex) <= 1 ? 'eager' : 'lazy'}
                    className="size-full object-cover"
                    onError={() => moment.url && setFailed((prev) => new Set(prev).add(moment.url as string))}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[14px] text-white/80">This photo couldn&apos;t load.</div>
                )}
              </div>

              <div className="flex items-center gap-1 px-2.5 pt-1.5">
                <LikeButton pactId={pactId} count={likeCount} liked={liked} variant="row" />
                <button type="button" onClick={onComment} aria-label="Comments" className="flex size-11 items-center justify-center rounded-full">
                  <MessageCircle className="size-6" />
                </button>
                <button type="button" onClick={() => void share()} aria-label="Share this pact" className="flex size-11 items-center justify-center rounded-full">
                  <Send className="size-6" />
                </button>
                {moments.length > 1 && (
                  <span className="ml-auto pr-1.5 text-[12.5px] font-semibold tabular-nums" style={{ color: MUTED }}>
                    {i + 1} / {moments.length}
                  </span>
                )}
              </div>
              {moment.description && (
                <p className="px-4 pt-1 text-[14px] leading-snug">
                  <span className="font-bold">{moment.authorName || moment.username || 'Member'}</span> {moment.description}
                </p>
              )}
            </article>
          )
        })}
      </div>

      {reportTarget && typeof reportTarget.id === 'number' && (
        <ReportMomentSheet pactId={pactId} proofId={reportTarget.id} onClose={() => setReportTarget(null)} />
      )}
      <DeleteMomentSheet
        open={deleteTarget != null}
        day={deleteTarget?.day ?? null}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          const target = deleteTarget
          if (!target || typeof target.id !== 'number') return
          const ok = await removeMoment({ pactId, proofId: target.id })
          setDeleteTarget(null)
          if (ok) {
            toast.success('Moment deleted')
            if (moments.length <= 1) close()
          }
        }}
      />
    </div>
  )
}
