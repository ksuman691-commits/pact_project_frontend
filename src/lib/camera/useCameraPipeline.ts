'use client'

import { useEffect, useRef, useState } from 'react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import type { LookParams } from '@/lib/cameraFilters'
import { LookRenderer } from '@/lib/camera/lookRenderer'
import { drawFaceEffect, loadFaceTracker, poseFrom, type FaceEffectId, type FacePose } from '@/lib/camera/faceEffects'

/** Longest side of what's drawn and recorded. */
const MAX_SIDE = 1280

/**
 * Some phones (seen on Android 10, Chrome 157) draw the WebGL look with a
 * black diagonal wedge across the top, though the camera itself is fine.
 * We compare a tiny thumbnail of the drawn frame with the raw camera now and
 * then; if WebGL has blacked out a real part of the picture, this phone
 * switches to the plain 2D drawing (with the look's CSS filter) for good.
 */
const GL_BROKEN_KEY = 'cp_camera_gl_broken'
const CHECK_W = 36
const CHECK_H = 64

function glKnownBroken(): boolean {
  try {
    return window.localStorage.getItem(GL_BROKEN_KEY) === '1'
  } catch {
    return false
  }
}

function rememberGlBroken() {
  try {
    window.localStorage.setItem(GL_BROKEN_KEY, '1')
  } catch {
    // Private mode: it's only remembered for this session.
  }
}

/** Share of the thumbnail that is black in the drawn frame but clearly lit in the camera. */
function blackedOutShare(drawn: Uint8ClampedArray, camera: Uint8ClampedArray): number {
  let bad = 0
  const n = drawn.length / 4
  for (let i = 0; i < drawn.length; i += 4) {
    const out = drawn[i] * 0.299 + drawn[i + 1] * 0.587 + drawn[i + 2] * 0.114
    const src = camera[i] * 0.299 + camera[i + 1] * 0.587 + camera[i + 2] * 0.114
    if (out < 12 && src > 90) bad++
  }
  return bad / n
}

function supportsCanvasFilter(ctx: CanvasRenderingContext2D): boolean {
  return typeof (ctx as any).filter === 'string'
}

export type EffectStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Camera → look (GPU) → face sticker → one canvas. That canvas is what's on
 * screen, what a photo is taken from and what's recorded, so the moment
 * looks exactly like the preview. `ready` turns false if anything here
 * can't run, and the camera falls back to the plain video.
 */
export function useCameraPipeline({
  videoRef,
  active,
  look,
  lookCss = 'none',
  mirror,
  effect,
  streak,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  active: boolean
  look: LookParams
  /** The same look as a CSS filter, used where WebGL can't be trusted. */
  lookCss?: string
  mirror: boolean
  effect: FaceEffectId
  streak: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)
  const [effectStatus, setEffectStatus] = useState<EffectStatus>('idle')
  const [faceFound, setFaceFound] = useState(true)
  const live = useRef({ look, lookCss, mirror, effect, streak, effectSince: 0 })
  const trackerRef = useRef<FaceLandmarker | null>(null)

  useEffect(() => {
    if (live.current.effect !== effect) live.current.effectSince = performance.now()
    live.current = { ...live.current, look, lookCss, mirror, effect, streak }
  }, [look, lookCss, mirror, effect, streak])

  // Load the face tracker the first time an effect is picked.
  useEffect(() => {
    if (effect === 'none' || trackerRef.current) return
    let cancelled = false
    setEffectStatus('loading')
    loadFaceTracker()
      .then((tracker) => {
        if (cancelled) return
        trackerRef.current = tracker
        setEffectStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setEffectStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [effect])

  useEffect(() => {
    if (!active) {
      setReady(false)
      return
    }
    let renderer = glKnownBroken() ? null : LookRenderer.create()
    // Tiny canvases for the WebGL health check.
    const checkA = document.createElement('canvas')
    const checkB = document.createElement('canvas')
    checkA.width = checkB.width = CHECK_W
    checkA.height = checkB.height = CHECK_H
    const ctxA = checkA.getContext('2d', { willReadFrequently: true })
    const ctxB = checkB.getContext('2d', { willReadFrequently: true })
    let frameNo = 0
    let strikes = 0
    let raf = 0
    let pose: FacePose | null = null
    let missed = 0
    let lastVideoTime = -1
    let lastStamp = 0
    let drewOnce = false
    // Face tracking runs on the main thread. If it's slow on this phone, track
    // every 2nd–4th camera frame and reuse the last pose in between, so the
    // camera and the recording stay smooth.
    let trackMs = 0
    let skip = 0

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const video = videoRef.current
      const out = canvasRef.current
      if (!video || !out || video.readyState < 2 || !video.videoWidth) return
      const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight))
      const w = Math.round(video.videoWidth * scale)
      const h = Math.round(video.videoHeight * scale)
      if (out.width !== w || out.height !== h) {
        out.width = w
        out.height = h
      }
      const ctx = out.getContext('2d')
      if (!ctx) return
      const { look: lk, lookCss: css, mirror: mr, effect: fx, streak: st, effectSince } = live.current
      frameNo++
      try {
        if (renderer) {
          renderer.render(video, w, h, lk, mr)
          ctx.drawImage(renderer.canvas, 0, 0, w, h)
          // Every 10th frame: has WebGL blacked out part of a lit picture?
          if (frameNo % 10 === 0 && ctxA && ctxB) {
            ctxA.drawImage(out, 0, 0, CHECK_W, CHECK_H)
            ctxB.save()
            if (mr) {
              ctxB.translate(CHECK_W, 0)
              ctxB.scale(-1, 1)
            }
            ctxB.drawImage(video, 0, 0, CHECK_W, CHECK_H)
            ctxB.restore()
            const share = blackedOutShare(ctxA.getImageData(0, 0, CHECK_W, CHECK_H).data, ctxB.getImageData(0, 0, CHECK_W, CHECK_H).data)
            strikes = share > 0.08 ? strikes + 1 : 0
            if (strikes >= 2) {
              renderer.dispose()
              renderer = null
              rememberGlBroken()
            }
          }
        }
        if (!renderer) {
          ctx.save()
          if (mr) {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
          }
          if (css && css !== 'none' && supportsCanvasFilter(ctx)) ctx.filter = css
          ctx.drawImage(video, 0, 0, w, h)
          ctx.restore()
        }
      } catch {
        return
      }

      const tracker = trackerRef.current
      if (fx !== 'none' && tracker) {
        // Only look for the face on a new camera frame; reuse the last pose in between.
        if (video.currentTime !== lastVideoTime && skip-- <= 0) {
          lastVideoTime = video.currentTime
          try {
            const stamp = Math.max(lastStamp + 1, performance.now())
            lastStamp = stamp
            const started = performance.now()
            const found = tracker.detectForVideo(video, stamp).faceLandmarks?.[0]
            trackMs = trackMs * 0.8 + (performance.now() - started) * 0.2
            skip = Math.min(3, Math.floor(trackMs / 18))
            if (found) {
              pose = poseFrom(found, w, h, mr, pose)
              missed = 0
            } else if (++missed > 6) {
              pose = null
            }
          } catch {
            pose = null
          }
          const seen = pose != null
          setFaceFound((was) => (was === seen ? was : seen))
        }
        if (pose) drawFaceEffect(ctx, fx, pose, (performance.now() - effectSince) / 1000, { streak: st })
      }

      if (!drewOnce) {
        drewOnce = true
        setReady(true)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      renderer?.dispose()
      setReady(false)
    }
  }, [active, videoRef])

  return { canvasRef, ready, effectStatus, faceFound }
}
