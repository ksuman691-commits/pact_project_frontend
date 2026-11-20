'use client'

import { useEffect, useRef, useState } from 'react'
import { Scissors, X } from 'lucide-react'
import { filmstrip, trimVideo } from '@/lib/camera/trimVideo'
import { STORY_MAX_SECONDS } from '@/lib/stories'

const FRAMES = 9
// A hair under the limit, so the trimmed file never reads as 15.1 seconds.
const WINDOW = STORY_MAX_SECONDS - 0.2

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/**
 * A video longer than 15 seconds: pick which 15 seconds to keep. The clip
 * loops inside the window as you drag it along the filmstrip, like Instagram
 * and Snapchat; "Use these 15 seconds" cuts it on the phone.
 */
export default function TrimSheet({
  blob,
  duration,
  onDone,
  onCancel,
}: {
  blob: Blob
  duration: number
  onDone: (clip: { blob: Blob; contentType: string; duration: number }) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [frames, setFrames] = useState<string[]>([])
  const [start, setStart] = useState(0)
  const [busy, setBusy] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; start: number } | null>(null)
  const maxStart = Math.max(0, duration - WINDOW)
  const windowShare = Math.min(1, WINDOW / duration)

  // Made and released in the same effect, so a remount never leaves a dead address.
  useEffect(() => {
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  useEffect(() => {
    if (!url) return
    let alive = true
    filmstrip(url, FRAMES).then((f) => alive && setFrames(f))
    return () => {
      alive = false
    }
  }, [url])

  // Loop the preview inside the window.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = start
    void video.play().catch(() => {})
    const onTime = () => {
      if (video.currentTime >= start + WINDOW || video.currentTime < start - 0.3) video.currentTime = start
    }
    video.addEventListener('timeupdate', onTime)
    return () => video.removeEventListener('timeupdate', onTime)
  }, [start, url])

  const moveTo = (clientX: number) => {
    const track = trackRef.current
    if (!track || !drag.current) return
    const width = track.getBoundingClientRect().width
    const delta = ((clientX - drag.current.x) / width) * duration
    setStart(Math.min(maxStart, Math.max(0, drag.current.start + delta)))
  }

  const cut = async () => {
    if (!url) return
    setBusy(0)
    setFailed(false)
    videoRef.current?.pause()
    try {
      const clip = await trimVideo(url, start, WINDOW, (f) => setBusy(f))
      onDone(clip)
    } catch (err) {
      console.warn('[trim] failed', err)
      setFailed(true)
      setBusy(null)
      void videoRef.current?.play().catch(() => {})
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose 15 seconds" className="fixed inset-0 z-[85] flex flex-col bg-black text-white">
      <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onCancel} disabled={busy != null} aria-label="Cancel" className="flex size-11 items-center justify-center rounded-full disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <X className="size-5" />
        </button>
        <div className="text-center">
          <div className="text-[16px] font-bold">Pick your 15 seconds</div>
          <div className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.7)' }}>This video is {fmt(duration)} long</div>
        </div>
        <span className="size-11" />
      </header>

      <div className="relative mx-4 mt-4 flex-1 overflow-hidden rounded-[22px] bg-[#111]">
        <video ref={videoRef} src={url ?? undefined} playsInline muted={busy != null} className="absolute inset-0 size-full object-contain" />
        {busy != null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(0,0,0,0.55)' }} role="status" aria-live="polite">
            <div className="h-1.5 w-48 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}>
              <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${Math.round(busy * 100)}%` }} />
            </div>
            <p className="text-[14px] font-semibold">Cutting your clip… {Math.round(busy * 100)}%</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-2 flex justify-between text-[12.5px] font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <span>{fmt(start)}</span>
          <span>Drag the frame</span>
          <span>{fmt(Math.min(duration, start + WINDOW))}</span>
        </div>
        <div
          ref={trackRef}
          className="relative h-16 touch-none select-none overflow-hidden rounded-[12px]"
          style={{ background: '#222' }}
          onPointerDown={(e) => {
            if (busy != null) return
            e.currentTarget.setPointerCapture?.(e.pointerId)
            // Tapping outside the window jumps it there first.
            const rect = e.currentTarget.getBoundingClientRect()
            const at = ((e.clientX - rect.left) / rect.width) * duration
            const inside = at >= start && at <= start + WINDOW
            const next = inside ? start : Math.min(maxStart, Math.max(0, at - WINDOW / 2))
            setStart(next)
            drag.current = { x: e.clientX, start: next }
          }}
          onPointerMove={(e) => moveTo(e.clientX)}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          role="slider"
          aria-label="Where the 15 seconds start"
          aria-valuemin={0}
          aria-valuemax={Math.round(maxStart)}
          aria-valuenow={Math.round(start)}
          aria-valuetext={`From ${fmt(start)} to ${fmt(start + WINDOW)}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setStart((s) => Math.max(0, s - 1))
            if (e.key === 'ArrowRight') setStart((s) => Math.min(maxStart, s + 1))
          }}
        >
          <div className="pointer-events-none absolute inset-0 flex">
            {frames.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={f} alt="" draggable={false} className="h-full min-w-0 flex-1 object-cover" />
            ))}
          </div>
          {/* Dim what's left out; frame what's kept. */}
          <div className="pointer-events-none absolute inset-y-0 left-0" style={{ width: `${(start / duration) * 100}%`, background: 'rgba(0,0,0,0.6)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0" style={{ width: `${Math.max(0, 100 - ((start + WINDOW) / duration) * 100)}%`, background: 'rgba(0,0,0,0.6)' }} />
          <div
            className="pointer-events-none absolute inset-y-0 rounded-[12px]"
            style={{ left: `${(start / duration) * 100}%`, width: `${windowShare * 100}%`, boxShadow: 'inset 0 0 0 3px #FFD23F, 0 0 0 1.5px #17181D' }}
          >
            <span className="absolute inset-y-3 left-1 w-1 rounded-full bg-[#FFD23F]" />
            <span className="absolute inset-y-3 right-1 w-1 rounded-full bg-[#FFD23F]" />
          </div>
        </div>
        {failed && <p className="mt-2 text-center text-[13px] font-semibold" style={{ color: '#FF8A80' }}>Couldn&apos;t cut that clip here. Try again, or record a new one.</p>}
        <button
          type="button"
          onClick={() => void cut()}
          disabled={busy != null}
          className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-bold text-[#17181D] transition active:scale-[0.98] disabled:opacity-60"
        >
          <Scissors className="size-5" strokeWidth={2.2} aria-hidden="true" />
          Use these 15 seconds
        </button>
      </div>
    </div>
  )
}
