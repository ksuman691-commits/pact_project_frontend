'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Eye, Flag, Send, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import DeleteMomentSheet from './DeleteMomentSheet'
import ReportMomentSheet from './ReportMomentSheet'
import { reactToStory, replyToStory, STORY_REACTIONS } from '@/lib/api/stories'
import { useAuthStore } from '@/store/auth'
import { useDeleteMoment, useMarkStorySeen, useStoryViewers } from '@/hooks/useStories'
import { useBackToClose } from '@/hooks/useBackToClose'
import { isPhotoStory, monogram, postedAgo, STORIES_COMING_SOON, type PactStory } from '@/lib/stories'
import { RingFace } from './StoryRing'

interface StoryViewerProps {
  open: boolean
  onClose: () => void
  stories: PactStory[]
  startIndex?: number
  circleId?: number | null
  circleName?: string | null
  isLoading?: boolean
  unavailable?: boolean
}

const HOLD_MS = 220
const SEEN_AFTER_SECONDS = 1

export default function StoryViewer({ open, onClose, stories, startIndex = 0, circleId, circleName, isLoading, unavailable }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex)
  const [fraction, setFraction] = useState(0)
  const [paused, setPaused] = useState(false)
  const [broken, setBroken] = useState(false)
  const [viewersOpen, setViewersOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reporting, setReporting] = useState(false)
  const { remove: removeMoment, deleting } = useDeleteMoment()
  const [composing, setComposing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [sendError, setSendError] = useState(false)
  // Fill the screen like Instagram; a landscape photo or video is shown whole instead of cropped.
  const [fitWhole, setFitWhole] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const holdTimer = useRef<number | null>(null)
  const heldRef = useRef(false)
  // Time a photo has been on screen, for its progress bar and "seen".
  const photoElapsed = useRef(0)
  const markSeen = useMarkStorySeen()
  useBackToClose(open, onClose)

  useEffect(() => {
    if (open) setIndex(Math.min(startIndex, Math.max(0, stories.length - 1)))
  }, [open, startIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setFraction(0)
    setBroken(false)
    setFitWhole(false)
    setPaused(false)
    setViewersOpen(false)
    setComposing(false)
    setReplyText('')
    setSent(null)
    setSendError(false)
  }, [index])

  const story = stories[index]
  const photo = !!story && isPhotoStory(story)
  const isOwn = !!story && user?.id != null && story.user_id === user.id
  const viewersQuery = useStoryViewers(story?.id ?? null, open && isOwn)
  const viewers = viewersQuery.data?.viewers ?? []
  const replies = viewersQuery.data?.replies ?? []

  const reportIfWatched = useCallback(() => {
    if (!story) return
    if (photo) {
      if (photoElapsed.current >= SEEN_AFTER_SECONDS * 1000) markSeen(story.id)
      return
    }
    const video = videoRef.current
    if (video && video.currentTime >= SEEN_AFTER_SECONDS) markSeen(story.id)
  }, [markSeen, story, photo])

  const close = useCallback(() => {
    reportIfWatched()
    onClose()
  }, [onClose, reportIfWatched])

  // Leaving for another page: close first (which also removes the history entry the
  // overlay added) and push the page once that back step has landed. Pushing at the
  // same time as the back step would cancel the navigation.
  const goTo = (href: string) => (event: React.MouseEvent) => {
    event.preventDefault()
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.removeEventListener('popstate', finish)
      router.push(href)
    }
    window.addEventListener('popstate', finish)
    window.setTimeout(finish, 700)
    close()
  }

  const go = useCallback(
    (delta: number) => {
      reportIfWatched()
      const next = index + delta
      if (next < 0) {
        if (videoRef.current) videoRef.current.currentTime = 0
        return
      }
      if (next >= stories.length) {
        onClose()
        return
      }
      setIndex(next)
    },
    [index, onClose, reportIfWatched, stories.length],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close, go])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused || viewersOpen || composing || confirmDelete || reporting) video.pause()
    else void video.play().catch(() => {})
  }, [paused, viewersOpen, composing, confirmDelete, reporting, index])

  // A photo stays up until you tap on (its bar shows full); it counts as seen after a second.
  useEffect(() => {
    photoElapsed.current = 0
  }, [index])
  useEffect(() => {
    if (!open || !photo || broken) return
    setFraction(1)
    const timer = window.setTimeout(() => {
      photoElapsed.current = SEEN_AFTER_SECONDS * 1000
      if (story) markSeen(story.id)
    }, SEEN_AFTER_SECONDS * 1000)
    return () => window.clearTimeout(timer)
  }, [open, photo, broken, index, markSeen, story])

  const sendReaction = async (emoji: string) => {
    if (!story) return
    setSendError(false)
    setSent(emoji)
    try {
      await reactToStory(story.id, emoji)
    } catch {
      setSent(null)
      setSendError(true)
    }
  }

  const sendReply = async () => {
    const text = replyText.trim()
    if (!story || !text) return
    setSendError(false)
    try {
      await replyToStory(story.id, text)
      setReplyText('')
      setSent('✓')
      setComposing(false)
    } catch {
      setSendError(true)
    }
  }

  if (!open) return null

  const onPointerDown = () => {
    heldRef.current = false
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true
      setPaused(true)
    }, HOLD_MS)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    if (heldRef.current) {
      heldRef.current = false
      setPaused(false)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    go(event.clientX - rect.left < rect.width / 3 ? -1 : 1)
  }

  const emptyText = unavailable ? `${STORIES_COMING_SOON}.` : isLoading ? 'Loading moments…' : 'No moments yet today.'

  return (
    <div role="dialog" aria-modal="true" aria-label="Moments" className="fixed inset-0 z-[90] flex flex-col bg-black text-[var(--paper)]">
      {/* The moment fills the whole screen, edge to edge; the top bar and the reply bar float over it. */}
      {story ? (
        <div
          className="absolute inset-0 touch-none select-none overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setPaused(false)}
          onContextMenu={(event) => event.preventDefault()}
        >
          {broken ? (
            <p className="flex h-full items-center justify-center px-8 text-center text-[15px]">This {photo ? 'photo' : 'video'} couldn&apos;t load. Tap to go on.</p>
          ) : photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={story.id}
              src={story.video_url}
              alt={`${story.name || 'Member'}'s moment`}
              draggable={false}
              className={`h-full w-full ${fitWhole ? 'object-contain' : 'object-cover'}`}
              onLoad={(event) => setFitWhole(event.currentTarget.naturalWidth > event.currentTarget.naturalHeight)}
              onError={() => setBroken(true)}
            />
          ) : (
            <video
              key={story.id}
              ref={videoRef}
              src={story.video_url}
              autoPlay
              playsInline
              className={`h-full w-full ${fitWhole ? 'object-contain' : 'object-cover'}`}
              onLoadedMetadata={(event) => setFitWhole(event.currentTarget.videoWidth > event.currentTarget.videoHeight)}
              onTimeUpdate={(event) => {
                const v = event.currentTarget
                const total = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : story.duration_seconds || 0
                if (total > 0) setFraction(Math.min(1, v.currentTime / total))
              }}
              onEnded={() => {
                markSeen(story.id)
                go(1)
              }}
              onError={() => setBroken(true)}
            />
          )}
          {paused && <span className="sr-only">Paused</span>}
          {/* Shade top and bottom so the white text over the photo stays readable. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/65 to-transparent" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-[15px]">{emptyText}</div>
      )}

      <div className="relative z-10 flex gap-1 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]" aria-hidden="true">
        {stories.map((s, i) => (
          <span key={s.id} className="h-[2.5px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }}>
            <span className="block h-full rounded-full bg-white" style={{ width: `${i < index ? 100 : i === index ? Math.round(fraction * 100) : 0}%` }} />
          </span>
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-between gap-2 py-2 pl-3 pr-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
        {/* Their photo and name are one link to their profile. */}
        {story && story.username && !isOwn ? (
          <Link href={`/profile/${encodeURIComponent(story.username)}`} onClick={goTo(`/profile/${encodeURIComponent(story.username)}`)} className="flex min-w-0 items-center gap-2.5">
            <RingFace name={story.name} imageUrl={story.avatar_url} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-bold text-white">{story.name || 'Member'}</span>
              {postedAgo(story.created_at) && <span className="block text-[12px] text-white/80">{postedAgo(story.created_at)}</span>}
            </span>
          </Link>
        ) : story ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <RingFace name={story.name} imageUrl={story.avatar_url} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-bold text-white">{story.name || 'Member'}</span>
              {postedAgo(story.created_at) && <span className="block text-[12px] text-white/80">{postedAgo(story.created_at)}</span>}
            </span>
          </div>
        ) : (
          <span />
        )}
        <div className="flex min-w-0 shrink-0 items-center">
          {circleId != null && circleName && (
            <Link href={`/circles/${circleId}`} onClick={goTo(`/circles/${circleId}`)} className="mr-1 flex h-9 max-w-[120px] items-center gap-1.5 rounded-full px-1.5 text-[12px] font-semibold text-white" aria-label={`Open ${circleName}`}>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold" style={{ border: '1.5px solid #fff' }} aria-hidden="true">
                {monogram(circleName)}
              </span>
              <span className="truncate">{circleName}</span>
            </Link>
          )}
          {story && !isOwn && story.pact_id != null && story.proof_id != null && (
            // Small, like Instagram's: the moment is what you look at.
            <button type="button" onClick={() => setReporting(true)} aria-label="Report this moment" className="flex size-10 items-center justify-center rounded-full text-white/85">
              <Flag className="size-4" strokeWidth={2.2} />
            </button>
          )}
          <button type="button" onClick={close} aria-label="Close moments" className="flex size-10 shrink-0 items-center justify-center rounded-full text-white">
            <X className="size-6" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Fills the middle so the reply bar sits at the bottom. */}
      <div className="flex-1" aria-hidden="true" />

      {/* Which pact it's from: one quiet link above the reply bar. */}
      {story && !isOwn && story.pact_id != null && story.pact_title && (
        <div className="relative z-10 px-4 pb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          <Link href={`/pacts/${story.pact_id}`} onClick={goTo(`/pacts/${story.pact_id}`)} className="inline-flex min-h-[36px] max-w-full items-center gap-0.5 text-[14px] font-extrabold text-white">
            <span className="truncate">{story.pact_title}</span>
            <ChevronRight className="size-4 shrink-0" strokeWidth={2.8} aria-hidden="true" />
          </Link>
        </div>
      )}

      {story && !isOwn && (
        <div className="relative z-10 flex flex-col gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {sendError && <div className="text-[12px]" style={{ color: '#F6B8B8' }}>Could not send. Try again.</div>}
          <div className="flex items-center gap-2">
            <input
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              onFocus={() => setComposing(true)}
              onBlur={() => !replyText && setComposing(false)}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === 'Enter') void sendReply()
              }}
              maxLength={300}
              placeholder={`Reply to ${(story.name || 'them').split(' ')[0]}…`}
              aria-label="Reply to this moment"
              className="h-11 min-w-0 flex-1 rounded-full border px-4 text-[16px] outline-none placeholder:text-white/60"
              style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            />
            {replyText.trim() ? (
              <button type="button" onClick={() => void sendReply()} aria-label="Send reply" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-white">
                <Send className="size-5" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex shrink-0 items-center">
                {STORY_REACTIONS.slice(0, 4).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => void sendReaction(emoji)}
                    aria-label={`React ${emoji}`}
                    className={`flex size-11 items-center justify-center rounded-full text-[22px] transition active:scale-90 ${sent === emoji ? 'bg-white/20' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {sent === '✓' && <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>Reply sent</div>}
        </div>
      )}

      {isOwn && (
        <div className="relative z-10 flex items-center pr-2">
        <button
          type="button"
          onClick={() => setViewersOpen(true)}
          aria-label={`${viewers.length} ${viewers.length === 1 ? 'view' : 'views'}. See who viewed`}
          className="flex min-h-[56px] items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-left"
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span className="text-[14px] font-semibold">
            {viewersQuery.isLoading ? 'Views' : viewers.length === 0 ? 'No views yet' : `${viewers.length} ${viewers.length === 1 ? 'view' : 'views'}`}
          </span>
          {viewers.length > 0 && (
            <span className="ml-1 flex -space-x-2">
              {viewers.slice(0, 4).map((v) => (
                <span key={v.user_id} className="rounded-full" style={{ boxShadow: '0 0 0 2px var(--ink)' }}>
                  <RingFace name={v.name} imageUrl={v.avatar_url} size={26} />
                </span>
              ))}
            </span>
          )}
        </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete this moment"
            className="ml-auto flex size-12 items-center justify-center rounded-full pb-[max(0rem,env(safe-area-inset-bottom))]"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {reporting && story?.pact_id != null && story.proof_id != null && (
        <ReportMomentSheet pactId={story.pact_id} proofId={story.proof_id} onClose={() => setReporting(false)} />
      )}
      <DeleteMomentSheet
        open={confirmDelete && !!story}
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!story || story.pact_id == null) return
          const ok = await removeMoment({ pactId: story.pact_id, storyId: story.id })
          setConfirmDelete(false)
          if (ok) {
            toast.success('Moment deleted')
            onClose()
          }
        }}
      />

      {viewersOpen && (
        <div className="fixed inset-0 z-[95] flex items-end" role="dialog" aria-modal="true" aria-label="Viewers">
          <button type="button" aria-label="Close viewers" className="absolute inset-0 bg-black/50" onClick={() => setViewersOpen(false)} />
          <div className="relative mx-auto flex max-h-[65vh] w-full max-w-md flex-col rounded-t-[16px] bg-[var(--paper)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-[var(--ink)]">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-[17px] font-bold tracking-[-0.01em]">Viewed by {viewers.length}</h3>
              <button type="button" onClick={() => setViewersOpen(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewers.length === 0 ? (
              <div className="py-6 text-[14px] text-[var(--muted)]">Nobody has watched this yet. People in your circle will show up here.</div>
            ) : (
              <ul className="flex flex-col overflow-y-auto">
                {viewers.map((v) => (
                  <li key={v.user_id} className="flex min-h-[56px] items-center gap-3 border-b border-[var(--hairline)] last:border-b-0">
                    <RingFace name={v.name} imageUrl={v.avatar_url} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold">{v.name || v.username || 'Member'}</div>
                      {v.username && <div className="truncate text-[12.5px] text-[var(--muted)]">@{v.username}</div>}
                    </div>
                    {v.reaction && <span className="shrink-0 text-[20px]" aria-label={`Reacted ${v.reaction}`}>{v.reaction}</span>}
                    <span className="shrink-0 text-[12px] text-[var(--muted)]">{postedAgo(v.viewed_at) || ''}</span>
                  </li>
                ))}
              </ul>
            )}
            {replies.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--hairline)] pt-3">
                <h4 className="text-[13px] font-bold text-[var(--muted)]">Replies</h4>
                {replies.map((r) => (
                  <div key={r.id} className="flex items-start gap-2.5">
                    <RingFace name={r.name} imageUrl={r.avatar_url} size={28} />
                    <div className="min-w-0 flex-1 text-[14px]">
                      <span className="font-semibold">{(r.name || 'Member').split(' ')[0]}</span>{' '}
                      <span>{r.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
