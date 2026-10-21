/**
 * Camera looks for moments. Pure CSS filter strings, so the same value drives
 * the live preview (CSS) and the recording (canvas 2D `ctx.filter`).
 * Tuned after CSSgram's open-source presets (MIT, github.com/una/CSSgram),
 * renamed for CirclePact.
 */
export interface CameraFilter {
  id: string
  name: string
  css: string
}

export const CAMERA_FILTERS: CameraFilter[] = [
  { id: 'none', name: 'Natural', css: 'none' },
  { id: 'punch', name: 'Punch', css: 'contrast(1.2) saturate(1.35)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.22) contrast(1.05) brightness(1.08) saturate(1.2)' },
  { id: 'film', name: 'Film', css: 'sepia(0.25) contrast(0.9) brightness(1.1) saturate(0.8)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(-10deg) contrast(1.05) brightness(1.05) saturate(1.1)' },
  { id: 'fade', name: 'Fade', css: 'contrast(0.85) brightness(1.15) saturate(0.85)' },
  { id: 'mono', name: 'Mono', css: 'grayscale(1) contrast(1.15) brightness(1.05)' },
]

/** Whether the browser can bake a filter into a recording (canvas ctx.filter). */
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
