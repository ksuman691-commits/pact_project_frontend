/*
 * Face effects for the camera, CirclePact's own set.
 *
 * Tracking: Google MediaPipe Face Landmarker (Apache-2.0), loaded only when
 * someone opens an effect. It finds points on a face (eyes, nose, forehead)
 * in each frame, on the phone. Frames are never sent anywhere, its usage
 * metrics are blocked (below), and nobody is identified: it knows where a
 * face is, not whose it is.
 *
 * Drawing: plain 2D canvas, in the same sticker style as the rest of the app
 * (flat colour, 1.5–3px ink edge), sized and tilted with the face.
 */

import type { FaceLandmarker as FaceLandmarkerType } from '@mediapipe/tasks-vision'

// Engine and model are both served from our own domain: scripts/copy-mediapipe.mjs
// puts them in public/mediapipe at build. Phones never fetch them from Google.
const WASM_ROOT = '/mediapipe/wasm'
const MODEL_URL = process.env.NEXT_PUBLIC_FACE_MODEL_URL || '/mediapipe/face_landmarker.task'

/**
 * MediaPipe reports usage metrics (which task ran, timings) to Google at this
 * address, with no setting to turn it off; its notice says the app must get
 * users' consent for that. We don't send it: requests to this one address are
 * refused before MediaPipe loads. Camera frames never leave the phone either way.
 */
const MEDIAPIPE_METRICS = 'odml.pa.googleapis.com'
let metricsBlocked = false
function blockMediaPipeMetrics() {
  if (metricsBlocked || typeof window === 'undefined') return
  metricsBlocked = true
  const original = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.includes(MEDIAPIPE_METRICS)) return Promise.reject(new TypeError('Blocked: MediaPipe metrics are off in CirclePact'))
    return original(input, init)
  }
}

export type FaceEffectId = 'none' | 'crown' | 'halo' | 'shades' | 'blush' | 'stamp'

export const FACE_EFFECTS: { id: FaceEffectId; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'crown', name: 'Streak' },
  { id: 'halo', name: 'Halo' },
  { id: 'shades', name: 'Shades' },
  { id: 'blush', name: 'Blush' },
  { id: 'stamp', name: 'Showed up' },
]

let loading: Promise<FaceLandmarkerType> | null = null

/** Loads once per visit; the browser caches the files after the first time. */
export function loadFaceTracker(): Promise<FaceLandmarkerType> {
  if (!loading) {
    loading = (async () => {
      blockMediaPipeMetrics()
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT)
      const make = (delegate: 'GPU' | 'CPU') =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        })
      try {
        return await make('GPU')
      } catch {
        return await make('CPU')
      }
    })()
    loading.catch(() => {
      loading = null
    })
  }
  return loading
}

type P = { x: number; y: number }

/** The few points the stickers need, smoothed between frames so they don't jitter. */
export interface FacePose {
  forehead: P
  chin: P
  eyeL: P
  eyeR: P
  bridge: P
  cheekL: P
  cheekR: P
  temple: P
  /** Distance between the outer eye corners, in pixels: the sticker scale. */
  span: number
  /** Head tilt, radians. */
  roll: number
}

const IDX = { forehead: 10, chin: 152, eyeL: 33, eyeR: 263, bridge: 168, cheekL: 205, cheekR: 425, temple: 454 }

export function poseFrom(landmarks: { x: number; y: number }[], w: number, h: number, mirror: boolean, previous: FacePose | null): FacePose {
  const at = (i: number): P => ({ x: (mirror ? 1 - landmarks[i].x : landmarks[i].x) * w, y: landmarks[i].y * h })
  const raw: Record<keyof typeof IDX, P> = {} as any
  ;(Object.keys(IDX) as (keyof typeof IDX)[]).forEach((k) => (raw[k] = at(IDX[k])))
  // Mirrored, the image's left eye is on the right: keep eyeL on screen-left.
  if (raw.eyeL.x > raw.eyeR.x) [raw.eyeL, raw.eyeR] = [raw.eyeR, raw.eyeL]
  if (raw.cheekL.x > raw.cheekR.x) [raw.cheekL, raw.cheekR] = [raw.cheekR, raw.cheekL]
  const k = previous ? 0.55 : 1
  const mix = (a: P, b: P | undefined): P => (b ? { x: b.x + (a.x - b.x) * k, y: b.y + (a.y - b.y) * k } : a)
  const pose: any = {}
  ;(Object.keys(IDX) as (keyof typeof IDX)[]).forEach((key) => (pose[key] = mix(raw[key], previous?.[key])))
  pose.span = Math.hypot(pose.eyeR.x - pose.eyeL.x, pose.eyeR.y - pose.eyeL.y)
  pose.roll = Math.atan2(pose.eyeR.y - pose.eyeL.y, pose.eyeR.x - pose.eyeL.x)
  return pose as FacePose
}

const INK = '#17181D'
const RED = '#E5363B'
const YELLOW = '#FFD23F'
// Built on first use: Path2D doesn't exist during server rendering.
let paths: { outer: Path2D; inner: Path2D; heart: Path2D } | null = null
const getPaths = () =>
  (paths ??= {
    outer: new Path2D('M16 5.6c.7 3.3 3.2 4.9 5 7.3 1.4 1.9 2.1 3.8 2.1 5.7 0 4.1-3.2 7.1-7.1 7.1s-7.1-3-7.1-7c0-2.4 1.1-4.4 2.7-5.7.2 1.6 1.1 2.8 2.3 3.3-.6-4.1.6-8 2.1-10.7z'),
    inner: new Path2D('M16 15.8c.4 1.7 1.9 2.6 2.6 3.8.4.7.5 1.4.5 2 0 1.8-1.4 3.1-3.1 3.1s-3.1-1.3-3.1-3.1c0-1.5.8-2.7 1.8-3.6.1.8.5 1.4 1.1 1.6-.2-1.4 0-2.8.2-3.8z'),
    heart: new Path2D('M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z'),
  })

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, bg: string, fg: string) {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`
  const w = ctx.measureText(text).width + size * 1.2
  const h = size * 1.7
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.lineWidth = Math.max(2, size * 0.14)
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y + size * 0.04)
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, t: number, phase: number) {
  const flick = 1 + Math.sin(t * 9 + phase) * 0.05
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale * flick)
  ctx.translate(-16, -25)
  ctx.lineJoin = 'round'
  const { outer, inner } = getPaths()
  ctx.fillStyle = '#FF5A1F'
  ctx.fill(outer)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = INK
  ctx.stroke(outer)
  ctx.fillStyle = YELLOW
  ctx.fill(inner)
  ctx.restore()
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x + r * 0.15, y - r * 0.15, x + r, y)
  ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.15, x, y + r)
  ctx.quadraticCurveTo(x - r * 0.15, y + r * 0.15, x - r, y)
  ctx.quadraticCurveTo(x - r * 0.15, y - r * 0.15, x, y - r)
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, r * 0.12)
  ctx.strokeStyle = INK
  ctx.stroke()
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s / 24, s / 24)
  const p = getPaths().heart
  ctx.translate(-12, -12)
  ctx.fillStyle = '#FF5C8A'
  ctx.fill(p)
  ctx.lineWidth = 1.6
  ctx.strokeStyle = INK
  ctx.stroke(p)
  ctx.restore()
}

/** Draws one effect over the frame already on `ctx`. `t` is seconds, for motion. */
export function drawFaceEffect(ctx: CanvasRenderingContext2D, effect: FaceEffectId, pose: FacePose, t: number, info: { streak: number }) {
  if (effect === 'none') return
  const s = pose.span
  const up = { x: Math.sin(pose.roll), y: -Math.cos(pose.roll) }
  const above = (k: number): P => ({ x: pose.forehead.x + up.x * s * k, y: pose.forehead.y + up.y * s * k })
  ctx.save()

  if (effect === 'crown') {
    const c = above(0.95)
    ctx.translate(c.x, c.y)
    ctx.rotate(pose.roll)
    const unit = s / 32
    flame(ctx, -s * 0.42, s * 0.06, unit * 0.78, t, 1.3)
    flame(ctx, s * 0.42, s * 0.06, unit * 0.78, t, 2.1)
    flame(ctx, 0, 0, unit * 1.12, t, 0)
    pill(ctx, info.streak > 0 ? `${info.streak}-day streak` : 'Day one', 0, s * 0.36, Math.max(14, s * 0.2), INK, YELLOW)
  }

  if (effect === 'halo') {
    const c = above(0.42)
    ctx.translate(c.x, c.y)
    ctx.rotate(pose.roll)
    const rx = s * 0.95
    const ry = s * 0.24
    const bob = Math.sin(t * 2.2) * s * 0.03
    ctx.translate(0, bob)
    ctx.lineWidth = s * 0.16
    ctx.strokeStyle = INK
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = s * 0.1
    ctx.strokeStyle = YELLOW
    ctx.stroke()
    // The CirclePact mark riding the ring.
    const a = t * 1.4
    const mx = Math.cos(a) * rx
    const my = Math.sin(a) * ry
    ctx.beginPath()
    const r = s * 0.13
    ctx.moveTo(mx, my)
    // Red disc with the 45° slice missing at the upper right, like the logo.
    ctx.arc(mx, my, r, (-35 * Math.PI) / 180, (280 * Math.PI) / 180, false)
    ctx.closePath()
    ctx.fillStyle = RED
    ctx.fill()
    ctx.lineWidth = Math.max(1.5, s * 0.02)
    ctx.strokeStyle = INK
    ctx.stroke()
    sparkle(ctx, -rx * 0.95, -ry * 2.2, s * 0.09 * (1 + 0.25 * Math.sin(t * 5)), '#FFFFFF')
    sparkle(ctx, rx * 0.9, -ry * 1.8, s * 0.07 * (1 + 0.25 * Math.sin(t * 5 + 2)), YELLOW)
  }

  if (effect === 'shades') {
    ctx.translate(pose.bridge.x, pose.bridge.y + s * 0.02)
    ctx.rotate(pose.roll)
    const lw = s * 0.62
    const lh = s * 0.4
    const gap = s * 0.1
    const lens = (cx: number) => {
      ctx.beginPath()
      ctx.roundRect(cx - lw / 2, -lh / 2, lw, lh, [lh * 0.2, lh * 0.2, lh * 0.5, lh * 0.5])
      ctx.fillStyle = INK
      ctx.fill()
      ctx.lineWidth = Math.max(2, s * 0.035)
      ctx.strokeStyle = INK
      ctx.stroke()
      // A crisp diagonal glint, like a sticker.
      ctx.save()
      ctx.clip()
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.beginPath()
      ctx.moveTo(cx - lw * 0.2, -lh)
      ctx.lineTo(cx + lw * 0.02, -lh)
      ctx.lineTo(cx - lw * 0.32, lh)
      ctx.lineTo(cx - lw * 0.54, lh)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    lens(-(gap / 2 + lw / 2))
    lens(gap / 2 + lw / 2)
    ctx.lineWidth = s * 0.06
    ctx.strokeStyle = INK
    ctx.beginPath()
    ctx.moveTo(-gap / 2 - 2, -lh * 0.18)
    ctx.quadraticCurveTo(0, -lh * 0.36, gap / 2 + 2, -lh * 0.18)
    ctx.stroke()
    // Red CirclePact dot on the corner of one lens.
    ctx.beginPath()
    ctx.arc(gap / 2 + lw * 0.86, -lh * 0.28, s * 0.045, 0, Math.PI * 2)
    ctx.fillStyle = RED
    ctx.fill()
  }

  if (effect === 'blush') {
    for (const cheek of [pose.cheekL, pose.cheekR]) {
      const g = ctx.createRadialGradient(cheek.x, cheek.y, 0, cheek.x, cheek.y, s * 0.32)
      g.addColorStop(0, 'rgba(255,92,138,0.42)')
      g.addColorStop(1, 'rgba(255,92,138,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(cheek.x, cheek.y, s * 0.34, s * 0.22, pose.roll, 0, Math.PI * 2)
      ctx.fill()
    }
    // Hearts drift up from the head, each on its own loop.
    for (let i = 0; i < 4; i++) {
      const life = (t * 0.45 + i / 4) % 1
      const side = i % 2 ? 1 : -1
      const base = above(0.15)
      const x = base.x + side * s * (0.55 + 0.25 * Math.sin(life * 6 + i)) + up.x * s * life * 1.2
      const y = base.y + up.y * s * life * 1.2
      ctx.globalAlpha = Math.min(1, (1 - life) * 2)
      heart(ctx, x, y, s * (0.22 + 0.08 * Math.sin(i)))
    }
    ctx.globalAlpha = 1
  }

  if (effect === 'stamp') {
    const side = { x: Math.cos(pose.roll), y: Math.sin(pose.roll) }
    // Slapped on the side of the head, high up, so it stays on screen when the camera crops the sides.
    const c = { x: pose.forehead.x + side.x * s * 0.78 + up.x * s * 0.05, y: pose.forehead.y + side.y * s * 0.78 + up.y * s * 0.05 }
    const pop = Math.min(1, t * 3)
    const scale = pop < 1 ? 0.6 + 0.55 * pop - 0.15 * pop * pop : 1
    ctx.translate(c.x, c.y)
    ctx.rotate(pose.roll - 0.22)
    ctx.scale(scale, scale)
    const r = s * 0.3
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = RED
    ctx.fill()
    ctx.lineWidth = Math.max(2.5, s * 0.04)
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.beginPath()
    ctx.setLineDash([s * 0.035, s * 0.03])
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2)
    ctx.lineWidth = Math.max(1.5, s * 0.02)
    ctx.strokeStyle = '#FFFFFF'
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(-r * 0.36, r * 0.0)
    ctx.lineTo(-r * 0.08, r * 0.28)
    ctx.lineTo(r * 0.4, -r * 0.26)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = r * 0.24
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.lineWidth = r * 0.13
    ctx.strokeStyle = '#FFFFFF'
    ctx.stroke()
    pill(ctx, 'Showed up', 0, r * 1.2, Math.max(13, s * 0.17), '#FFFFFF', INK)
  }

  ctx.restore()
}
