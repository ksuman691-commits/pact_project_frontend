'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useMarkStorySeen } from '@/hooks/useStories'
import { monogram, postedAgo, STORIES_COMING_SOON, type PactStory } from '@/lib/stories'
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const holdTimer = useRef<number | null>(null)
  const heldRef = useRef(false)
  const markSeen = useMarkStorySeen()

  useEffect(() => {
    if (open) setIndex(Math.min(startIndex, Math.max(0, stories.length - 1)))
  }, [open, startIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setFraction(0)
    setBroken(false)
    setPaused(false)
  }, [index])

  const story = stories[index]

  const reportIfWatched = useCallback(() => {
    const video = videoRef.current
    if (story && video && video.currentTime >= SEEN_AFTER_SECONDS) markSeen(story.id)
  }, [markSeen, story])

  const close = useCallback(() => {
    reportIfWatched()
    onClose()
  }, [onClose, reportIfWatched])

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
    if (paused) video.pause()
    else void video.play().catch(() => {})
  }, [paused, index])

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

  const emptyText = unavailable ? `${STORIES_COMING_SOON}.` : isLoading ? 'Loading stories…' : 'No stories yet today.'

  return (
    <div role="dialog" aria-modal="true" aria-label="Stories" className="fixed inset-0 z-[90] flex flex-col bg-[var(--ink)] text-[var(--paper)]">
      <div className="flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]" aria-hidden="true">
        {stories.map((s, i) => (
          <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(244,239,228,0.3)' }}>
            <span className="block h-full rounded-full bg-[var(--paper)]" style={{ width: `${i < index ? 100 : i === index ? Math.round(fraction * 100) : 0}%` }} />
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {story && <RingFace name={story.name} imageUrl={story.avatar_url} size={36} />}
          <div className="min-w-0">
            {story && <p className="truncate text-[14px] font-semibold">{story.name || 'Member'}</p>}
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(244,239,228,0.75)' }}>
              {story && postedAgo(story.created_at) && <span>posted {postedAgo(story.created_at)}</span>}
              {circleId != null && circleName && (
                <Link href={`/circles/${circleId}`} onClick={close} className="flex items-center gap-1.5 font-semibold text-[var(--paper)]">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold"
                    style={{ border: '1.5px solid var(--paper)' }}
                    aria-hidden="true"
                  >
                    {monogram(circleName)}
                  </span>
                  <span className="truncate">{circleName}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={close} aria-label="Close stories" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
          <X className="h-6 w-6" />
        </button>
      </div>

      {story ? (
        <div
          className="relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setPaused(false)}
          onContextMenu={(event) => event.preventDefault()}
        >
          {broken ? (
            <p className="px-8 text-center text-[15px]">This video couldn&apos;t load. Tap to go on.</p>
          ) : (
            <video
              key={story.id}
              ref={videoRef}
              src={story.video_url}
              autoPlay
              playsInline
              className="h-full w-full object-contain"
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
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-[15px]">{emptyText}</div>
      )}
    </div>
  )
}
