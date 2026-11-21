/**
 * The picture someone posts when their pact ends: a 1080 x 1920 story card made
 * on the phone (no server). Navy, crisp ink edges, the CirclePact mark, the
 * pact's title and one dot per day (posted, rest day, missed).
 */
import { MARK_RED, piePath, MARK_SWEEP } from '@/lib/circleMark'
import { pactService } from '@/services/api'

export type DayMark = 'posted' | 'rest' | 'missed'

export interface PactCardInput {
  title: string
  name: string
  kept: boolean
  daysPosted: number
  restDays: number
  daysNeeded: number
  totalDays: number
  circleName?: string | null
  /** One entry per pact day, in order. Without it the card shows the closed mark instead of dots. */
  days?: DayMark[] | null
}

const W = 1080
const H = 1920
const INK = '#17181D'
const YELLOW = '#FFD23F'
const SOFT = '#D4DBFA'

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** The CirclePact mark on a white disc with an ink edge; `closed` fills the missing slice and adds a tick. */
function mark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, closed: boolean) {
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = INK
  ctx.lineWidth = Math.max(4, r * 0.06)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  const inner = r * 0.82
  ctx.fillStyle = MARK_RED
  if (closed) {
    ctx.beginPath()
    ctx.arc(cx, cy, inner, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = inner * 0.16
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - inner * 0.42, cy + inner * 0.02)
    ctx.lineTo(cx - inner * 0.1, cy + inner * 0.32)
    ctx.lineTo(cx + inner * 0.46, cy - inner * 0.3)
    ctx.stroke()
  } else {
    const s = inner / 50
    ctx.translate(cx - 50 * s, cy - 50 * s)
    ctx.scale(s, s)
    ctx.fill(new Path2D(piePath(50, 50, 50, MARK_SWEEP)))
  }
  ctx.restore()
}

export function buildPactCard(input: PactCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas is not available'))
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#2546A6')
  bg.addColorStop(0.6, '#1F3A93')
  bg.addColorStop(1, '#162C74')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // The big mark, cropped off the top-right corner, as on the app's page tops.
  ctx.save()
  ctx.globalAlpha = 0.14
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 6
  const big = new Path2D(piePath(W - 40, 250, 420, MARK_SWEEP))
  ctx.stroke(big)
  ctx.restore()

  // Header: the mark and the name.
  mark(ctx, 112, 140, 40, false)
  ctx.fillStyle = '#FFFFFF'
  ctx.textBaseline = 'middle'
  ctx.font = `800 50px ${family}`
  ctx.fillText('CirclePact', 170, 142)

  // "Pact kept" pill: yellow with an ink edge.
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 44px ${family}`
  const pill = input.kept ? 'Pact kept' : 'Pact ended'
  const pillW = ctx.measureText(pill).width + 76
  roundRect(ctx, 80, 300, pillW, 84, 42)
  ctx.fillStyle = input.kept ? YELLOW : '#FFFFFF'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.fillText(pill, 118, 357)

  ctx.fillStyle = SOFT
  ctx.font = `700 52px ${family}`
  const who = input.kept ? `${input.name} kept their word.` : `${input.name} showed up ${input.daysPosted} ${input.daysPosted === 1 ? 'day' : 'days'}.`
  ctx.fillText(who, 80, 480)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 108px ${family}`
  const lines = wrap(ctx, input.title, W - 160).slice(0, 3)
  let y = 610
  for (const line of lines) {
    ctx.fillText(line, 80, y)
    y += 112
  }
  ctx.fillStyle = SOFT
  ctx.font = `600 44px ${family}`
  ctx.fillText(`${input.totalDays} days${input.circleName ? ` · ${input.circleName}` : ''}`, 80, y + 6)

  // The days, or the mark when we don't have them.
  const gridTop = y + 100
  const gridBottom = H - 390
  const days = input.days && input.days.length ? input.days.slice(0, 120) : null
  if (days) {
    const cols = 7
    const rows = Math.ceil(days.length / cols)
    const gap = 26
    const size = Math.min(104, (W - 160 - gap * (cols - 1)) / cols, (gridBottom - gridTop - gap * (rows - 1)) / rows)
    const gridW = cols * size + (cols - 1) * gap
    const x0 = (W - gridW) / 2
    const y0 = gridTop + Math.max(0, (gridBottom - gridTop - (rows * size + (rows - 1) * gap)) / 2)
    days.forEach((kind, i) => {
      const cx = x0 + (i % cols) * (size + gap) + size / 2
      const cy = y0 + Math.floor(i / cols) * (size + gap) + size / 2
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2 - 3, 0, Math.PI * 2)
      if (kind === 'posted') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.lineWidth = 5
        ctx.strokeStyle = INK
        ctx.stroke()
        ctx.strokeStyle = MARK_RED
        ctx.lineWidth = size * 0.11
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(cx - size * 0.2, cy + size * 0.01)
        ctx.lineTo(cx - size * 0.05, cy + size * 0.16)
        ctx.lineTo(cx + size * 0.22, cy - size * 0.14)
        ctx.stroke()
      } else if (kind === 'rest') {
        ctx.fillStyle = YELLOW
        ctx.fill()
        ctx.lineWidth = 5
        ctx.strokeStyle = INK
        ctx.stroke()
      } else {
        ctx.lineWidth = 5
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'
        ctx.stroke()
      }
    })
  } else {
    mark(ctx, W / 2, (gridTop + gridBottom) / 2, Math.min(260, (gridBottom - gridTop) / 2), input.kept)
  }

  // The numbers.
  const stats: [number, string][] = [
    [input.daysPosted, input.daysPosted === 1 ? 'day posted' : 'days posted'],
    ...(input.restDays ? ([[input.restDays, input.restDays === 1 ? 'rest day' : 'rest days']] as [number, string][]) : []),
    [input.daysNeeded, 'needed'],
  ]
  const boxGap = 28
  const boxW = (W - 160 - boxGap * (stats.length - 1)) / stats.length
  stats.forEach(([value, label], i) => {
    const x = 80 + i * (boxW + boxGap)
    const top = H - 340
    roundRect(ctx, x, top, boxW, 190, 36)
    ctx.fillStyle = '#2A4AAC'
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.stroke()
    // Rest days in yellow, matching their dots.
    ctx.fillStyle = label.startsWith('rest') ? YELLOW : '#FFFFFF'
    ctx.font = `800 86px ${family}`
    ctx.fillText(String(value), x + 36, top + 104)
    ctx.fillStyle = SOFT
    ctx.font = `600 38px ${family}`
    ctx.fillText(label, x + 36, top + 158)
  })

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = `600 38px ${family}`
  ctx.textAlign = 'center'
  ctx.fillText('Say it. Do it. Let people see.', W / 2, H - 70)

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the picture'))), 'image/png')
  })
}

/**
 * One mark per pact day from the pact payload: `moment_days` (every day the
 * creator posted) and `rest_days`. Null when the server is too old to send
 * `moment_days` (the card then shows the mark instead of guessing).
 */
export function dayMarks(pact: any): DayMark[] | null {
  const total = Number(pact?.total_days ?? pact?.duration_days ?? 0)
  if (!Array.isArray(pact?.moment_days) || !total) return null
  const posted = new Set<number>(pact.moment_days.map(Number))
  const rest = new Set<number>((Array.isArray(pact.rest_days) ? pact.rest_days : []).map(Number))
  return Array.from({ length: total }, (_, i) => (posted.has(i + 1) ? 'posted' : rest.has(i + 1) ? 'rest' : 'missed'))
}

/**
 * Makes the card and opens the share sheet with it (or downloads it where files
 * can't be shared). Fetches the pact for its days when they aren't passed in.
 */
export async function sharePactCard(input: PactCardInput & { pactId: number }): Promise<void> {
  let days = input.days ?? null
  if (!days) {
    try {
      const response = await pactService.getById(input.pactId)
      days = dayMarks(response.data)
    } catch {
      days = null
    }
  }
  const blob = await buildPactCard({ ...input, days })
  const file = new File([blob], 'circlepact-pact.png', { type: 'image/png' })
  const url = `${window.location.origin}/pacts/${input.pactId}`
  const text = input.kept ? `I kept my pact: ${input.title}` : `${input.daysPosted} days of ${input.title}. Going again.`
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text: `${text} ${url}` })
    return
  }
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = file.name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(href), 2000)
}
