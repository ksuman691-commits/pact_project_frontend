'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Circle, ImageIcon, RotateCcw, Square, Video, X } from 'lucide-react'
import { usePactStoriesToday, usePostStory } from '@/hooks/useStories'
import {
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
  duration: number
  url: string
}

interface StoryCaptureSheetProps {
  isOpen: boolean
  onClose: () => void
  pactId: number
  pactTitle?: string
  /** Lets a page show the sheet in a fixed state for review screenshots. */
  initialClip?: Clip | null
}

type Step = 'idle' | 'live' | 'preview'

const CAMERA_BLOCKED = 'Camera is blocked. Allow it in Chrome site settings, or choose a video from your gallery.'
const RECORDER_TYPES = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function canRecordInPage() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export default function StoryCaptureSheet({ isOpen, onClose, pactId, pactTitle, initialClip = null }: StoryCaptureSheetProps) {
  const [step, setStep] = useState<Step>(initialClip ? 'preview' : 'idle')
  const [clip, setClip] = useState<Clip | null>(initialClip)
  const [notice, setNotice] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [inPageSupported, setInPageSupported] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const startedAtRef = useRef(0)
  const tickRef = useRef<number | null>(null)
  const stopTimerRef = useRef<number | null>(null)

  const today = usePactStoriesToday(pactId, isOpen)
  const { phase, progress, error, unavailable: postUnavailable, post, reset } = usePostStory(pactId)
  const comingSoon = today.unavailable || postUnavailable

  useEffect(() => setInPageSupported(canRecordInPage()), [])

  const stopStream = useCallback(() => {
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

  const acceptBlob = async (blob: Blob & { name?: string }, knownDuration?: number) => {
    setNotice(null)
    const contentType = resolveVideoType(blob)
    if (!contentType) {
      setNotice("That file type isn't supported. Use an MP4, WebM or MOV video.")
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
      setNotice('Stories can be 15 seconds at most')
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

  const openLiveCamera = async () => {
    setNotice(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
      streamRef.current = stream
      setStep('live')
      requestAnimationFrame(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream
          void liveVideoRef.current.play().catch(() => {})
        }
      })
    } catch (err: any) {
      setNotice(err?.name === 'NotAllowedError' ? CAMERA_BLOCKED : "Couldn't open the camera here. Use Record a video, or choose one from your gallery.")
    }
  }

  const finishRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream) return
    const mimeType = RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
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

  const retake = () => {
    replaceClip(null)
    reset()
    setNotice(null)
    setStep('idle')
  }

  if (!isOpen) return null

  const busy = phase === 'requesting' || phase === 'uploading' || phase === 'saving'
  const ringRadius = 46
  const ringLength = 2 * Math.PI * ringRadius

  return (
    <div role="dialog" aria-modal="true" aria-label="Post today's story" className="fixed inset-0 z-[80] flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-[17px] font-bold tracking-[-0.02em]">Today&apos;s story</p>
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

      <input ref={cameraInputRef} type="file" accept="video/*" capture="environment" className="sr-only" onChange={onFilePicked} tabIndex={-1} aria-hidden="true" />
      <input ref={galleryInputRef} type="file" accept="video/*" className="sr-only" onChange={onFilePicked} tabIndex={-1} aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {step === 'idle' && (
          <>
            <p className="text-[15px] leading-relaxed text-[var(--ink)]">
              Record a short video of today&apos;s work. It shares your progress and disappears after 24 hours.
            </p>
            <p className="rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] text-[var(--muted)]">{STORY_LIMITS_TEXT}</p>

            {comingSoon ? (
              <p className="rounded-[6px] border border-dashed border-[var(--seat-border)] px-4 py-4 text-[14px] text-[var(--muted)]">
                {STORIES_COMING_SOON}. Posting opens once it&apos;s ready.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={checking}
                  className="flex h-[176px] w-[176px] flex-col items-center justify-center gap-2 rounded-full text-[17px] font-semibold disabled:opacity-60"
                  style={{ background: 'var(--navy)', color: '#fff' }}
                >
                  <Video className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
                  {checking ? 'Checking video…' : 'Record a video'}
                </button>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={checking}
                    className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)]"
                  >
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    Choose from gallery
                  </button>
                  {inPageSupported && (
                    <button
                      type="button"
                      onClick={() => void openLiveCamera()}
                      disabled={checking}
                      className="flex h-11 items-center gap-2 rounded-full border border-[var(--hairline)] px-5 text-[14px] font-semibold text-[var(--ink)]"
                    >
                      <Circle className="h-4 w-4" aria-hidden="true" />
                      Record here
                    </button>
                  )}
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

        {step === 'live' && (
          <div className="flex flex-col items-center gap-5">
            <video ref={liveVideoRef} muted playsInline className="aspect-[9/16] w-full max-w-[300px] rounded-[6px] bg-[var(--ink)] object-cover" />
            <div className="relative flex h-[104px] w-[104px] items-center justify-center">
              <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="52" cy="52" r={ringRadius} fill="none" stroke="var(--hairline)" strokeWidth="5" />
                <circle
                  cx="52"
                  cy="52"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--navy)"
                  strokeWidth="5"
                  strokeDasharray={ringLength}
                  strokeDashoffset={ringLength * (1 - elapsed / STORY_MAX_SECONDS)}
                />
              </svg>
              <button
                type="button"
                onClick={recording ? finishRecording : startRecording}
                aria-label={recording ? 'Stop recording' : 'Start recording'}
                className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full"
                style={{ background: 'var(--navy)', color: '#fff' }}
              >
                {recording ? <Square className="h-6 w-6" fill="currentColor" /> : <Circle className="h-7 w-7" fill="currentColor" />}
              </button>
            </div>
            <p className="text-[14px] tabular-nums text-[var(--muted)]" aria-live="polite">
              {recording ? `${Math.ceil(STORY_MAX_SECONDS - elapsed)} s left` : `Tap to record. Stops at ${STORY_MAX_SECONDS} seconds.`}
            </p>
            <button type="button" onClick={() => { stopStream(); setStep('idle') }} className="text-[14px] font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
              Back
            </button>
          </div>
        )}

        {step === 'preview' && clip && (
          <div className="flex flex-col items-center gap-4">
            <video src={clip.url} autoPlay loop muted playsInline className="aspect-[9/16] w-full max-w-[300px] rounded-[6px] bg-[var(--ink)] object-cover" />
            <p className="text-[13px] tabular-nums text-[var(--muted)]">
              {clip.duration.toFixed(1)} s · {formatMb(clip.blob.size)}
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
                  {phase === 'requesting' ? 'Getting ready to upload…' : phase === 'uploading' ? `Uploading ${Math.round(progress * 100)}%` : 'Saving your story…'}
                </p>
              </div>
            ) : (
              <>
                {phase === 'error' && error && (
                  <p role="alert" className="w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] text-[var(--ink)]">
                    {error}
                  </p>
                )}
                <div className="flex w-full gap-3">
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
                    onClick={() => void post({ blob: clip.blob, contentType: clip.contentType, durationSeconds: clip.duration })}
                    className="h-12 flex-1 rounded-full text-[15px] font-semibold disabled:bg-[var(--card-muted)] disabled:text-[var(--muted)]"
                    style={comingSoon ? undefined : { background: 'var(--navy)', color: '#fff' }}
                  >
                    {comingSoon ? STORIES_COMING_SOON : phase === 'error' ? 'Try again' : 'Post'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
