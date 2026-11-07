// Geometry for the CirclePact mark: a red circle with one 45° slice missing,
// opening to the upper right. The slice is "the day you haven't done yet".

export const MARK_RED = '#E5363B'
export const MARK_DARK = '#0E0A19'
/** The visible red starts at 80° and runs counter-clockwise for 315°; the slice is 35°–80°. */
export const MARK_START = 80
export const MARK_SWEEP = 315
/** Red radius as a share of the dark disc in the full logo. */
export const MARK_ON_DISC = 0.456

const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * A pie wedge centred on (cx, cy), starting at `start` degrees (0 = right,
 * counter-clockwise) and running counter-clockwise for `sweep` degrees.
 * Use clockwise=true to run the other way (progress pies, from 12 o'clock).
 */
export function piePath(cx: number, cy: number, r: number, sweep: number, start = MARK_START, clockwise = false): string {
  const s = Math.max(0, Math.min(360, sweep))
  if (s <= 0.05) return ''
  if (s >= 359.95) return `M${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}Z`
  const end = clockwise ? start - s : start + s
  const x0 = cx + r * Math.cos(rad(start))
  const y0 = cy - r * Math.sin(rad(start))
  const x1 = cx + r * Math.cos(rad(end))
  const y1 = cy - r * Math.sin(rad(end))
  const large = s > 180 ? 1 : 0
  const sweepFlag = clockwise ? 1 : 0
  return `M${cx} ${cy}L${x0.toFixed(3)} ${y0.toFixed(3)}A${r} ${r} 0 ${large} ${sweepFlag} ${x1.toFixed(3)} ${y1.toFixed(3)}Z`
}

/** The mark itself in a 100×100 box (red only). */
export const MARK_PATH = piePath(50, 50, 50, MARK_SWEEP)
