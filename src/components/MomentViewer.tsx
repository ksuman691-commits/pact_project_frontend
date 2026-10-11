'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Play, Volume2, VolumeX, X } from 'lucide-react'
import CheerButton from '@/components/CheerButton'

export interface ViewerMoment {
  id: number | string
  url?: string
  type?: string
  description?: string
  day?: number
  uploadedAt?: string
  username?: string
  authorName?: string
}

interface MomentViewerProps {
  moments: ViewerMoment[]
  startIndex: number
  pactId: number
  cheerCount: number
  canCheer: boolean
  hasCheered: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
  onComment: () => void
}

const PHOTO_DURATION_MS = 5000
const HOLD_MS = 220

export default function MomentViewer({ moments, startIndex, pactId, cheerCount, canCheer, hasCheered, onClose, onIndexChange, onComment }: MomentViewerProps) {
  const [index, setIndex] = useState(startIndex)
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [fraction, setFraction] = useState(0)
  const [playRejected, setPlayRejected] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const holdTimer = useRef<number | null>(null)
  const held = useRef(false)
  const startedAt = useRef(Date.now())
  const startingFraction = useRef(0)
  const historyOwned = useRef(false)
  const moment = moments[index]
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const close = useCallback(() => {
    if (historyOwned.current && window.history.state?.momentViewer) {
      window.history.back()
      return
    }
    onClose()
  }, [onClose])

  const go = useCallback((delta: number) => {
    const next = index + delta
    if (next < 0 || next >= moments.length) return
    setIndex(next)
    onIndexChange(next)
  }, [index, moments.length, onIndexChange])

  const closeRef = useRef(close)
  const goRef = useRef(go)
  closeRef.current = close
  goRef.current = go

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
      if (event.key === 'Escape') closeRef.current()
      if (event.key === 'ArrowRight') goRef.current(1)
      if (event.key === 'ArrowLeft') goRef.current(-1)
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, []) // The viewer owns exactly one history entry for its lifetime.

  useEffect(() => {
    setFraction(0)
    setPaused(false)
    setPlayRejected(false)
    setPhotoFailed(false)
    startedAt.current = Date.now()
    startingFraction.current = 0
    const video = videoRef.current
    if (video) {
      video.muted = muted
      void video.play().then(() => setPlayRejected(false)).catch(() => setPlayRejected(true))
    }
  }, [index, muted])

  useEffect(() => {
    if (moment?.type === 'video' || paused) return
    const timer = window.setInterval(() => {
      const nextFraction = startingFraction.current + (Date.now() - startedAt.current) / PHOTO_DURATION_MS
      setFraction(Math.min(1, nextFraction))
      if (nextFraction >= 1) {
        if (index === moments.length - 1) close()
        else go(1)
      }
    }, 80)
    return () => window.clearInterval(timer)
  }, [close, go, index, moment?.type, moments.length, paused])

  const pause = () => {
    setPaused(true)
    videoRef.current?.pause()
    if (moment?.type !== 'video') {
      startingFraction.current = fraction
      startedAt.current = Date.now()
    }
  }

  const resume = () => {
    setPaused(false)
    if (moment?.type === 'video') void videoRef.current?.play().catch(() => setPlayRejected(true))
    else startedAt.current = Date.now()
  }

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setSwipeStart({ x: event.clientX, y: event.clientY })
    held.current = false
    holdTimer.current = window.setTimeout(() => {
      held.current = true
      pause()
    }, HOLD_MS)
  }

  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    if (!swipeStart) return
    const dx = event.clientX - swipeStart.x
    const dy = event.clientY - swipeStart.y
    setSwipeStart(null)
    if (held.current) {
      held.current = false
      resume()
      return
    }
    if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0) close()
      return
    }
    if (Math.abs(dx) > 60) {
      go(dx < 0 ? 1 : -1)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    if (x < rect.width / 3) go(-1)
    else if (x > rect.width * 2 / 3) go(1)
  }

  if (!moment) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Moment viewer" className="fixed inset-0 z-[100] flex flex-col bg-black text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex gap-1.5 px-3 pt-2" aria-label={`Moment ${index + 1} of ${moments.length}`}>
        {moments.map((item, i) => (
          <span key={item.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
            <span className="block h-full bg-white transition-[width] duration-100" style={{ width: `${i < index ? 100 : i === index ? Math.round(fraction * 100) : 0}%` }} />
          </span>
        ))}
      </div>
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" aria-label="Close moment viewer" onClick={close} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15"><X className="size-6" /></button>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{moment.authorName || moment.username || 'Member'}</p>
            <p className="text-[12px] text-white/70">Day {moment.day ?? index + 1}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {moment.type === 'video' && (
            <button type="button" aria-label={muted ? 'Unmute video' : 'Mute video'} onClick={() => setMuted((value) => !value)} className="flex size-11 items-center justify-center rounded-full bg-white/15">
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          )}
        </div>
      </header>
      <div
        className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden"
        onPointerDown={pointerDown}
        onPointerUp={pointerUp}
        onPointerCancel={() => { if (holdTimer.current) clearTimeout(holdTimer.current); held.current = false; resume() }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {moment.type === 'video' ? (
          <video
            key={moment.id}
            ref={videoRef}
            src={moment.url}
            autoPlay
            loop
            playsInline
            preload="auto"
            muted={muted}
            className="max-h-full w-full object-contain"
            onTimeUpdate={(event) => { const v = event.currentTarget; if (v.duration > 0) setFraction(v.currentTime / v.duration) }}
            onPlay={() => setPlayRejected(false)}
            onPause={() => { if (!paused) setPaused(true) }}
            onError={() => setPlayRejected(true)}
          />
        ) : moment.url && !photoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={moment.url} alt={moment.description || 'Shared moment'} className="max-h-full max-w-full object-contain" onError={() => setPhotoFailed(true)} />
        ) : <span className="absolute inset-0 bg-[#F4EFE4]" aria-label="Moment image unavailable" />}
        {playRejected && moment.type === 'video' && (
          <button type="button" aria-label="Play video moment" onPointerDown={(event) => event.stopPropagation()} onClick={() => { const video = videoRef.current; if (video) { video.muted = muted; void video.play().then(() => setPlayRejected(false)).catch(() => setPlayRejected(true)) } }} className="absolute flex size-14 items-center justify-center rounded-full bg-white/90 text-black"><Play className="ml-1 size-6 fill-current" /></button>
        )}
      </div>
      {moment.description && <p className="shrink-0 px-5 pb-2 text-center text-sm text-white/85">{moment.description}</p>}
      <footer className="flex shrink-0 items-center justify-center gap-5 px-5 pb-4 pt-2">
        <CheerButton pactId={pactId} canCheer={canCheer} hasCheered={hasCheered} variant="stage" cheerCount={cheerCount} />
        <button type="button" onClick={onComment} aria-label="Comment on this moment" className="flex size-12 items-center justify-center rounded-full bg-white/15"><MessageCircle className="size-5" /></button>
      </footer>
    </div>
  )
}
