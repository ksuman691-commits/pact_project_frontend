/**
 * Camera looks for moments.
 *
 * Each look has GPU settings (`gl`), drawn by lib/camera/lookRenderer.ts for
 * the live camera, the photo and the recording, so what you see is exactly
 * what's posted, on every phone including iPhones. `css` is a close match
 * kept for places that still filter with CSS (editing a picked file in
 * Chrome). The first set was tuned after CSSgram (MIT, github.com/una/CSSgram);
 * these are graded like film looks: split toning, lifted blacks, vignette
 * and grain, the way Instagram's filters work.
 */

export interface LookParams {
  /** Brightness multiplier, 1 = unchanged. */
  exposure: number
  contrast: number
  saturation: number
  /** + warmer (orange), − cooler (blue). */
  warmth: number
  /** Lifts the blacks, 0–0.2. */
  fade: number
  /** Added to dark areas and to bright areas: split toning. */
  shadowTint: [number, number, number]
  highlightTint: [number, number, number]
  vignette: number
  grain: number
  mono: boolean
}

export interface CameraFilter {
  id: string
  name: string
  css: string
  gl: LookParams
  /** Background of the round button: a hint of the look. */
  swatch: string
}

const BASE: LookParams = { exposure: 1, contrast: 1, saturation: 1, warmth: 0, fade: 0, shadowTint: [0, 0, 0], highlightTint: [0, 0, 0], vignette: 0, grain: 0, mono: false }
const look = (p: Partial<LookParams>): LookParams => ({ ...BASE, ...p })

export const CAMERA_FILTERS: CameraFilter[] = [
  { id: 'none', name: 'Natural', css: 'none', gl: BASE, swatch: 'linear-gradient(135deg, #9BB7D4, #E9D5B5)' },
  {
    id: 'punch',
    name: 'Punch',
    css: 'contrast(1.2) saturate(1.35)',
    gl: look({ contrast: 1.18, saturation: 1.32, shadowTint: [-0.01, 0.01, 0.05], vignette: 0.18 }),
    swatch: 'linear-gradient(135deg, #1E6BFF, #FF3D6E)',
  },
  {
    id: 'warm',
    name: 'Golden',
    css: 'sepia(0.22) contrast(1.05) brightness(1.08) saturate(1.2)',
    gl: look({ exposure: 1.05, contrast: 1.05, saturation: 1.15, warmth: 0.09, fade: 0.03, highlightTint: [0.05, 0.025, -0.02], vignette: 0.12 }),
    swatch: 'linear-gradient(135deg, #FFB547, #FF6A3D)',
  },
  {
    id: 'film',
    name: 'Film',
    css: 'sepia(0.25) contrast(0.9) brightness(1.1) saturate(0.8)',
    gl: look({ contrast: 0.96, saturation: 0.86, warmth: 0.04, fade: 0.07, shadowTint: [-0.02, 0.025, 0.035], highlightTint: [0.05, 0.02, -0.03], vignette: 0.2, grain: 0.07 }),
    swatch: 'linear-gradient(135deg, #2F6F6A, #E8A15C)',
  },
  {
    id: 'cool',
    name: 'Cool',
    css: 'hue-rotate(-10deg) contrast(1.05) brightness(1.05) saturate(1.1)',
    gl: look({ exposure: 1.04, contrast: 1.06, saturation: 1.05, warmth: -0.08, highlightTint: [-0.01, 0.01, 0.03] }),
    swatch: 'linear-gradient(135deg, #5AC8FA, #2E4DB3)',
  },
  {
    id: 'fade',
    name: 'Dream',
    css: 'contrast(0.85) brightness(1.15) saturate(0.85)',
    gl: look({ exposure: 1.08, contrast: 0.86, saturation: 0.88, fade: 0.1, highlightTint: [0.04, 0.0, 0.03] }),
    swatch: 'linear-gradient(135deg, #F7C6D9, #C9B8F2)',
  },
  {
    id: 'retro',
    name: 'Retro',
    css: 'sepia(0.35) contrast(1.05) saturate(0.85) brightness(1.05)',
    gl: look({ contrast: 1.04, saturation: 0.74, warmth: 0.08, fade: 0.11, shadowTint: [0.03, -0.01, 0.05], highlightTint: [0.05, 0.04, -0.03], vignette: 0.28, grain: 0.05 }),
    swatch: 'linear-gradient(135deg, #8E5BA8, #F2C14E)',
  },
  {
    id: 'mono',
    name: 'Mono',
    css: 'grayscale(1) contrast(1.15) brightness(1.05)',
    gl: look({ exposure: 1.04, contrast: 1.15, mono: true }),
    swatch: 'linear-gradient(135deg, #F4F4F4, #5A5C63)',
  },
  {
    id: 'noir',
    name: 'Noir',
    css: 'grayscale(1) contrast(1.45) brightness(0.95)',
    gl: look({ exposure: 0.97, contrast: 1.42, mono: true, vignette: 0.38, grain: 0.08 }),
    swatch: 'linear-gradient(135deg, #3A3B40, #000000)',
  },
]

/** Whether the browser can bake a CSS filter into a 2D canvas (not Safari). Only the file editor still needs this. */
export function canRecordWithFilters(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx || typeof (canvas as any).captureStream !== 'function') return false
    ctx.filter = 'grayscale(1)'
    return ctx.filter === 'grayscale(1)'
  } catch {
    return false
  }
}
