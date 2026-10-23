'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Circle, ImageIcon as Images, RefreshCw, RotateCcw, Square, X } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { cleanTitle } from '@/lib/titleCase'
import { CAMERA_FILTERS, canRecordWithFilters } from '@/lib/cameraFilters'
import { useAuthStore } from '@/store/auth'
import { useUserStats } from '@/hooks/useUserQueries'
import { usePactStoriesToday, usePostStory } from '@/hooks/useStories'
import {
  isImageFile,
  preparePhoto,
  isDurationAllowed,
  readVideoDuration,
  resolveVideoType,
  STORIES_COMING_SOON,
  STORY_LIMITS_TEXT,
  STORY_MAX_BYTES,
  STORY_MAX_SECONDS,
} from '@/lib/stories'

interface Clip {
  blob: Blob
  contentType: string
  /** Seconds for a video; 0 for a photo. */
  duration: number
  url: string
}

type Mode = 'photo' | 'video'
const MODE_KEY = 'cp-camera-mode'

function isPhotoClip(clip: { contentType: string }) {
  return clip.contentType.startsWith('image/')
}

interface StoryCaptureSheetProps {
  isOpen: boolean
  onClose: () => void
  pactId: number
  pactTitle?: string
  canJoin?: boolean
  onJoin?: () => Promise<boolean>
  /** Lets a page show the sheet in a fixed state for review screenshots. */
  initialClip?: Clip | null
  /**
   * Capture without posting: the preview's main button hands the clip back
   * (used by new pact, where the pact doesn't exist until the end).
   * A photo comes back with an image/* contentType and a duration of 0.
   */
  onCaptured?: (clip: { blob: Blob; contentType: string; duration: number }) => void
  /** Open straight on the live camera instead of the start screen. */
  autoStart?: boolean
  /** Shows "Skip, Start Without Day 1" under the shutter (new pact: Day 1 is optional). */
  onSkip?: () => void
}

type Step = 'idle' | 'live' | 'preview'

const CAMERA_BLOCKED = 'Camera is blocked. Allow camera access in your browser settings, or choose a photo or video from your library.'
const RECORDER_TYPES = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
const VIDEO_BITS_PER_SECOND = 2_500_000
const AUDIO_BITS_PER_SECOND = 64_000

function formatMb(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function canRecordInPage() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export default function StoryCaptureSheet({ isOpen, onClose, pactId, pactTitle: rawTitle, canJoin = false, onJoin, initialClip = null, onCaptured, autoStart = true, onSkip }: StoryCaptureSheetProps) {
  const pactTitle = rawTitle ? cleanTitle(rawTitle) : rawTitle
  const [step, setStep] = useState<Step>(initialClip ? 'preview' : 'idle')
  const [clip, setClip] = useState<Clip | null>(initialClip)
  const [notice, setNotice] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  // null until we know; the start screen waits for it so it doesn't flash before the camera.
  const [inPageSupported, setInPageSupported] = useState<boolean | null>(null)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [filterId, setFilterId] = useState('none')
  const [filtersSupported, setFiltersSupported] = useState(false)
  const [mode, setModeState] = useState<Mode>('video')
  const setMode = (next: Mode) => {
    setModeState(next)
    try {
      localStorage.setItem(MODE_KEY, next)
    } catch {
      // Remembering the mode is a nicety.
    }
  }
  const drawFrameRef = useRef<number | null>(null)
  const { user } = useAuthStore()
  const streak = Number(useUserStats(user?.id || 0).data?.data?.current_streak ?? 0)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const startedAtRef = useRef(0)
  const tickRef = useRef<number | null>(null)
  const stopTimerRef = useRef<number | null>(null)

  const today = usePactStoriesToday(pactId, isOpen)
  const { phase, progress, error, retryable, unavailable: postUnavailable, post, reset } = usePostStory(pactId)
  const comingSoon = !onCaptured && (today.unavailable || postUnavailable)
  const autoStarted = useRef(false)
  const openRef = useRef(isOpen)
  useEffect(() => {
    openRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    setInPageSupported(canRecordInPage())
    setFiltersSupported(canRecordWithFilters())
    try {
      if (localStorage.getItem(MODE_KEY) === 'photo') setModeState('photo')
    } catch {
      // Private mode: start on video.
    }
  }, [])

  const stopStream = useCallback(() => {
    if (drawFrameRef.current) cancelAnimationFrame(drawFrameRef.current)
    drawFrameRef.current = null
    if (tickRef.current) window.clearInterval(tickRef.current)
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current)
    tickRef.current = null
    stopTimerRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setRecording(false)
  }, [])

  const replaceClip = useCallback((next: Clip | null) => {
    setClip((previous) => {
      if (previous && previous !== initialClip) URL.revokeObjectURL(previous.url)
      return next
    })
  }, [initialClip])

  const closeSheet = useCallback(() => {
    openRef.current = false
    stopStream()
    replaceClip(null)
    setNotice(null)
    setStep('idle')
    reset()
    onClose()
  }, [onClose, replaceClip, reset, stopStream])

  useEffect(() => () => stopStream(), [stopStream])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const acceptPhoto = async (file: Blob & { name?: string }) => {
    setNotice(null)
    setChecking(true)
    const ready = await preparePhoto(file)
    setChecking(false)
    if (!ready) {
      setNotice("That photo couldn't be used. Try another one under 10 MB.")
      return
    }
    replaceClip({ blob: ready.blob, contentType: ready.contentType, duration: 0, url: URL.createObjectURL(ready.blob) })
    reset()
    setStep('preview')
  }

  const acceptBlob = async (blob: Blob & { name?: string }, knownDuration?: number) => {
    setNotice(null)
    if (isImageFile(blob)) {
      await acceptPhoto(blob)
      return
    }
    const contentType = resolveVideoType(blob)
    if (!contentType) {
      setNotice("That file type isn't supported. Use a photo, or an MP4, WebM or MOV video.")
      return
    }
    if (blob.size > STORY_MAX_BYTES) {
      setNotice(`That video is ${formatMb(blob.size)}. The limit is 30 MB.`)
      return
    }
    setChecking(true)
    const measured = await readVideoDuration(blob)
    setChecking(false)
    const duration = measured ?? knownDuration ?? null
    if (duration == null) {
      setNotice("Couldn't read how long that video is. Try another video or record a new one.")
      return
    }
    if (!isDurationAllowed(duration)) {
      setNotice('Moments can be 15 seconds at most')
      return
    }
    replaceClip({ blob, contentType, duration, url: URL.createObjectURL(blob) })
    reset()
    setStep('preview')
  }

  const onFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void acceptBlob(file)
  }

  const [streamVersion, setStreamVersion] = useState(0)
  const attachStream = (stream: MediaStream) => {
    streamRef.current = stream
    // The live screen may not be on screen yet; the effect below attaches it once it is.
    setStreamVersion((v) => v + 1)
  }

  useEffect(() => {
    const video = liveVideoRef.current
    const stream = streamRef.current
    if (step !== 'live' || !video || !stream || video.srcObject === stream) return
    video.srcObject = stream
    void video.play().catch(() => {})
  }, [step, streamVersion])

  // Back camera first. `ideal` (not `exact`) so devices without one, like a laptop, still open.
  const requestStream = (mode: 'environment' | 'user') =>
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
      audio: true,
    })

  const openLiveCamera = async () => {
    setNotice(null)
    try {
      const stream = await requestStream('environment')
      // Closed while the camera was starting: switch it straight back off.
      if (!openRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const actual = stream.getVideoTracks()[0]?.getSettings().facingMode
      setFacing(actual === 'user' ? 'user' : 'environment')
      setStep('live')
      attachStream(stream)
    } catch (err: any) {
      setNotice(err?.name === 'NotAllowedError' ? CAMERA_BLOCKED : "Couldn't open the camera here. Choose a photo or video from your library instead.")
    }
  }

  const flipCamera = async () => {
    if (recording) return
    const next = facing === 'environment' ? 'user' : 'environment'
    streamRef.current?.getTracks().forEach((track) => track.stop())
    try {
      attachStream(await requestStream(next))
      setFacing(next)
    } catch {
      try {
        attachStream(await requestStream(facing))
      } catch {
        setNotice("Couldn't switch cameras.")
        setStep('idle')
      }
    }
  }

  useEffect(() => {
    if (!isOpen) {
      autoStarted.current = false
      return
    }
    if (!autoStart || autoStarted.current || !inPageSupported || step !== 'idle') return
    autoStarted.current = true
    void openLiveCamera()
    // openLiveCamera is stable enough for a one-shot start; re-running it would reopen the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoStart, inPageSupported, step])

  /** A still from the live camera, with the chosen look and the selfie mirror baked in. */
  const takePhoto = () => {
    const video = liveVideoRef.current
    if (!video || !video.videoWidth) {
      setNotice('The camera is still starting. Try again in a second.')
      return
    }
    setNotice(null)
    const scale = Math.min(1, 2048 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const preset = CAMERA_FILTERS.find((f) => f.id === filterId)
    if (preset && preset.css !== 'none' && filtersSupported) ctx.filter = preset.css
    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setNotice("Couldn't take the photo. Try again.")
          return
        }
        stopStream()
        replaceClip({ blob, contentType: 'image/jpeg', duration: 0, url: URL.createObjectURL(blob) })
        reset()
        setStep('preview')
      },
      'image/jpeg',
      0.9,
    )
  }

  const finishRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  /** With a filter picked, record a canvas copy of the camera with the filter baked in. */
  const filteredStream = (stream: MediaStream): MediaStream => {
    const preset = CAMERA_FILTERS.find((f) => f.id === filterId)
    const video = liveVideoRef.current
    if (!preset || preset.css === 'none' || !filtersSupported || !video || !video.videoWidth) return stream
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return stream
    const draw = () => {
      ctx.filter = preset.css
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      drawFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
    const out = (canvas as any).captureStream(30) as MediaStream
    stream.getAudioTracks().forEach((track) => out.addTrack(track))
    return out
  }

  const startRecording = () => {
    const source = streamRef.current
    if (!source) return
    const stream = filteredStream(source)
    const mimeType = RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
    const recorderOptions: MediaRecorderOptions = {
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      ...(mimeType ? { mimeType } : {}),
    }
    const recorder = new MediaRecorder(stream, recorderOptions)
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      const seconds = (performance.now() - startedAtRef.current) / 1000
      const type = (recorder.mimeType || mimeType || 'video/webm').split(';')[0]
      stopStream()
      void acceptBlob(new Blob(chunks, { type }), seconds)
    }
    recorderRef.current = recorder
    startedAtRef.current = performance.now()
    setElapsed(0)
    recorder.start()
    setRecording(true)
    tickRef.current = window.setInterval(() => {
      setElapsed(Math.min(STORY_MAX_SECONDS, (performance.now() - startedAtRef.current) / 1000))
    }, 100)
    stopTimerRef.current = window.setTimeout(finishRecording, STORY_MAX_SECONDS * 1000)
  }

  // Retake goes straight back to the camera, not to the intro screen.
  const retake = () => {
    replaceClip(null)
    reset()
    setNotice(null)
    setStep('idle')
    if (inPageSupported) void openLiveCamera()
  }

  if (!isOpen) return null

  const busy = phase === 'requesting' || phase === 'uploading' || phase === 'saving'
  const ringRadius = 46
  const ringLength = 2 * Math.PI * ringRadius

  // Opening straight on the camera: show a dark "opening" screen, not the start
  // screen, until the camera is up or it fails (then the start screen explains why).
  const opening = autoStart && step === 'idle' && !notice && !comingSoon && inPageSupported !== false
  if (opening) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Opening camera" className="fixed inset-0 z-[80] flex flex-col bg-black text-white">
        <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button type="button" onClick={closeSheet} aria-label="Close camera" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[15px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }} aria-live="polite">Opening camera…</p>
        </div>
      </div>
    )
  }

  if (step === 'live') {
    return (
      <div role="dialog" aria-modal="true" aria-label="Record a moment" className="fixed inset-0 z-[80] bg-black text-white">
        <video
          ref={liveVideoRef}
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
          style={{ filter: CAMERA_FILTERS.find((f) => f.id === filterId)?.css ?? 'none' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0))' }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.65), rgba(0,0,0,0))' }} />

        <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Close camera"
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center pt-1 text-center" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            <LogoMark size={20} tone="cream" />
            {pactTitle && <div className="mt-1 max-w-full truncate text-[13px] font-semibold" style={{ color: 'rgba(244,239,228,0.92)' }}>{pactTitle}</div>}
            {streak > 0 && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-extrabold" style={{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 4-3 6-3 10a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 5 5 8a9 9 0 0 1-18 0c0-6 6-8 9-13z" /></svg>
                {streak}-day streak, keep it going
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void flipCamera()}
            disabled={recording}
            aria-label={facing === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
            className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </header>

        <input ref={cameraInputRef} type="file" accept="image/*,video/*" className="sr-only" onChange={(event) => { stopStream(); onFilePicked(event) }} tabIndex={-1} aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {filtersSupported && !recording && (
            <div className="flex w-full gap-2 overflow-x-auto px-4 scrollbar-hide" role="radiogroup" aria-label="Camera look">
              {CAMERA_FILTERS.map((preset) => {
                const on = preset.id === filterId
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setFilterId(preset.id)}
                    className="h-9 shrink-0 rounded-full px-3.5 text-[13px] font-extrabold"
                    style={on ? { background: '#FFFFFF', color: '#17181D' } : { background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}
                  >
                    {preset.name}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-[14px] font-semibold tabular-nums" aria-live="polite" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            {recording ? `${Math.ceil(STORY_MAX_SECONDS - elapsed)} s left` : notice ? notice : mode === 'photo' ? 'Tap to take a photo.' : `Tap to record. Stops at ${STORY_MAX_SECONDS} seconds.`}
          </p>
          <div className="flex w-full items-center justify-between px-9">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={recording}
            aria-label="Choose a photo or video from your library"
            className="flex size-[52px] items-center justify-center rounded-[14px] disabled:opacity-0"
            style={{ border: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
          >
            <Images className="h-5 w-5" aria-hidden="true" />
          </button>
          {mode === 'photo' ? (
            <div className="relative flex h-[104px] w-[104px] items-center justify-center">
              <span className="absolute inset-[4px] rounded-full" style={{ border: '5px solid #FFFFFF' }} aria-hidden="true" />
              <button
                type="button"
                onClick={takePhoto}
                aria-label="Take a photo"
                className="relative h-[76px] w-[76px] rounded-full transition active:scale-90"
                style={{ background: '#FFFFFF' }}
              />
            </div>
          ) : (
          <div className="relative flex h-[104px] w-[104px] items-center justify-center">
            <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="52" cy="52" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="5" />
              <circle cx="52" cy="52" r={ringRadius} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={ringLength} strokeDashoffset={ringLength * (1 - elapsed / STORY_MAX_SECONDS)} />
            </svg>
            <button
              type="button"
              onClick={recording ? finishRecording : startRecording}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full"
              style={{ background: recording ? '#D64545' : '#fff', color: recording ? '#fff' : '#17181D' }}
            >
              {recording ? <Square className="h-6 w-6" fill="currentColor" /> : <Circle className="h-7 w-7" fill="currentColor" />}
            </button>
          </div>
          )}
          <span className="size-[52px]" aria-hidden="true" />
          </div>
          {!recording && (
            <div className="flex gap-1 rounded-full p-1" role="radiogroup" aria-label="Photo or video" style={{ background: 'rgba(0,0,0,0.35)' }}>
              {(['photo', 'video'] as Mode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  onClick={() => setMode(option)}
                  className="h-9 rounded-full px-4 text-[13.5px] font-extrabold"
                  style={mode === option ? { background: '#FFFFFF', color: '#17181D' } : { color: '#FFFFFF' }}
                >
                  {option === 'photo' ? 'Photo' : 'Video'}
                </button>
              ))}
            </div>
          )}
          {onSkip && !recording && (
            <button type="button" onClick={() => { stopStream(); onSkip() }} className="min-h-11 px-4 text-[14px] font-bold underline underline-offset-4" style={{ color: '#FFFFFF', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
              Skip, Start Without Day 1
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Post a moment" className="fixed inset-0 z-[80] flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-[17px] font-bold tracking-[-0.02em]">Post a moment</p>
          {pactTitle && <p className="truncate text-[13px] text-[var(--muted)]">{pactTitle}</p>}
        </div>
        <button
          type="button"
          onClick={closeSheet}
          disabled={busy}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--ink)] disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <input ref={cameraInputRef} type="file" accept="image/*,video/*" className="sr-only" onChange={onFilePicked} tabIndex={-1} aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {step === 'idle' && (
          <>
            <p className="text-[15px] leading-relaxed text-[var(--ink)]">
              A photo or a video up to 15 seconds. It goes on today&apos;s day of your pact, for everyone who can watch it.
            </p>
            <p className="rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] text-[var(--muted)]">{STORY_LIMITS_TEXT}</p>

            {comingSoon ? (
              <p className="rounded-[6px] border border-dashed border-[var(--seat-border)] px-4 py-4 text-[14px] text-[var(--muted)]">
                {STORIES_COMING_SOON}. Posting opens once it&apos;s ready.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 pt-2">
                {inPageSupported && (
                  <button
                    type="button"
                    onClick={() => void openLiveCamera()}
                    disabled={checking}
                    className="flex h-[176px] w-[176px] flex-col items-center justify-center gap-2 rounded-full text-[17px] font-semibold disabled:opacity-60"
                    style={{ background: 'var(--navy)', color: '#fff' }}
                  >
                    <Circle className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
                    Open camera
                  </button>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={checking}
                    className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)]"
                  >
                    <Images className="h-4 w-4" aria-hidden="true" />
                    Choose from library
                  </button>
                </div>
              </div>
            )}
            {notice && (
              <p role="alert" className="rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] text-[var(--ink)]">
                {notice}
              </p>
            )}
          </>
        )}

        {step === 'preview' && clip && (
          <div className="flex flex-col items-center gap-4">
            {isPhotoClip(clip) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clip.url} alt="Your photo" className="max-h-[56vh] w-full max-w-[300px] rounded-[6px] bg-[var(--ink)] object-contain" />
            ) : (
              <video src={clip.url} autoPlay loop muted playsInline className="aspect-[9/16] w-full max-w-[300px] rounded-[6px] bg-[var(--ink)] object-cover" />
            )}
            <p className="text-[13px] tabular-nums text-[var(--muted)]">
              {isPhotoClip(clip) ? 'Photo' : `${clip.duration.toFixed(1)} s`} · {formatMb(clip.blob.size)}
            </p>

            {phase === 'done' ? (
              <div className="flex w-full flex-col items-center gap-3 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ border: '3px solid var(--navy)', color: 'var(--navy)' }}>
                  <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <p className="text-[16px] font-semibold">Moment posted.</p>
                <button type="button" onClick={closeSheet} className="h-12 w-full rounded-full text-[15px] font-semibold" style={{ background: 'var(--navy)', color: '#fff' }}>
                  Done
                </button>
              </div>
            ) : busy ? (
              <div className="flex w-full flex-col gap-2" aria-live="polite">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--hairline)]">
                  <div className="h-full rounded-full bg-[var(--navy)] transition-[width]" style={{ width: `${Math.round((phase === 'saving' ? 1 : progress) * 100)}%` }} />
                </div>
                <p className="text-[14px] text-[var(--muted)]">
                  {phase === 'requesting' ? 'Getting ready to upload…' : phase === 'uploading' ? `Uploading ${Math.round(progress * 100)}%` : 'Saving your moment…'}
                </p>
              </div>
            ) : (
              <>
                {phase === 'error' && error && isParticipantPermissionError(error) ? (
                  <div role="alert" className="w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] text-[var(--ink)]">
                    <p>Join this pact to post a moment</p>
                    <div className="mt-3 flex gap-3">
                      {canJoin && onJoin && <button type="button" onClick={async () => { const joined = await onJoin(); if (joined && clip) await post({ blob: clip.blob, contentType: clip.contentType, durationSeconds: clip.duration }) }} className="h-10 flex-1 rounded-full bg-[var(--navy)] text-sm font-semibold text-white">Join this pact</button>}
                      <button type="button" onClick={closeSheet} className="h-10 flex-1 rounded-full border border-[var(--hairline)] text-sm font-semibold">Close</button>
                    </div>
                  </div>
                ) : phase === 'error' && error && (
                  <p role="alert" className="w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] text-[var(--ink)]">
                    {error}
                  </p>
                )}
                {phase === 'error' && error && !isParticipantPermissionError(error) && !retryable ? (
                  <button type="button" onClick={closeSheet} className="h-12 w-full rounded-full border border-[var(--hairline)] text-[15px] font-semibold">Close</button>
                ) : !(phase === 'error' && error && isParticipantPermissionError(error)) && <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={retake}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] text-[15px] font-semibold text-[var(--navy)]"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Retake
                  </button>
                  <button
                    type="button"
                    disabled={comingSoon}
                    onClick={() => {
                      if (onCaptured) {
                        onCaptured({ blob: clip.blob, contentType: clip.contentType, duration: clip.duration })
                        return
                      }
                      void post({ blob: clip.blob, contentType: clip.contentType, durationSeconds: clip.duration })
                    }}
                    className="h-12 flex-1 rounded-full text-[15px] font-semibold disabled:bg-[var(--card-muted)] disabled:text-[var(--muted)]"
                    style={comingSoon ? undefined : { background: 'var(--navy)', color: '#fff' }}
                  >
                    {comingSoon ? STORIES_COMING_SOON : onCaptured ? 'Use this' : phase === 'error' ? 'Try again' : 'Post'}
                  </button>
                </div>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function isParticipantPermissionError(error: string) {
  const text = error.toLowerCase()
  return text.includes('only pact participants can post stories') || text.includes('only pact members can submit proof')
}
