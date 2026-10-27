/**
 * The picture someone posts when they finish a dare: their proof (when the
 * browser lets us read it) under a big title, with who dared them and the
 * CirclePact mark. 1080 x 1920, made on the phone, no server.
 */
export interface DareCardInput {
  title: string
  byName: string
  doerName: string
  /** A photo proof to use as the background. Anything that can't be read is skipped. */
  photoUrl?: string | null
}

const W = 1080
const H = 1920
const SPARK = '#FFD84D'

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/)
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

function bolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const s = size / 24
  ctx.save()
  ctx.translate(cx - 12 * s, cy - 12 * s)
  ctx.scale(s, s)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 1.2
  ctx.lineJoin = 'round'
  const path = new Path2D('M13 2 3 14h9l-1 8 10-12h-9l1-8z')
  ctx.fill(path)
  ctx.stroke(path)
  ctx.restore()
}

export async function buildDareCard(input: DareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'

  const bg = ctx.createRadialGradient(W * 0.75, H * 0.18, 60, W * 0.5, H * 0.5, H * 0.8)
  bg.addColorStop(0, '#2F4486')
  bg.addColorStop(0.5, '#141A2E')
  bg.addColorStop(1, '#0C0D11')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const photo = input.photoUrl ? await loadImage(input.photoUrl) : null
  if (photo) {
    const scale = Math.max(W / photo.naturalWidth, H / photo.naturalHeight)
    const w = photo.naturalWidth * scale
    const h = photo.naturalHeight * scale
    ctx.drawImage(photo, (W - w) / 2, (H - h) / 2, w, h)
    const top = ctx.createLinearGradient(0, 0, 0, 520)
    top.addColorStop(0, 'rgba(0,0,0,0.65)')
    top.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, W, 520)
    const bottom = ctx.createLinearGradient(0, H - 1000, 0, H)
    bottom.addColorStop(0, 'rgba(0,0,0,0)')
    bottom.addColorStop(1, 'rgba(0,0,0,0.88)')
    ctx.fillStyle = bottom
    ctx.fillRect(0, H - 1000, W, 1000)
  } else {
    // No photo: the ring, complete, with its bolts, as the picture.
    const cx = W / 2
    const cy = 700
    const r = 300
    ctx.lineWidth = 26
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5)
    ctx.stroke()
    bolt(ctx, cx, cy, 300, SPARK)
    for (const angle of [-0.9, 2.2]) {
      const bx = cx + r * Math.cos(angle)
      const by = cy + r * Math.sin(angle)
      ctx.fillStyle = '#17181D'
      ctx.beginPath()
      ctx.arc(bx, by, 62, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 6
      ctx.stroke()
      bolt(ctx, bx, by, 66, SPARK)
    }
  }

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 52px ${family}`
  ctx.fillText(`${input.doerName} did it.`, 80, 170)
  ctx.font = `600 40px ${family}`
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(`Dared by ${input.byName}`, 80, 232)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 112px ${family}`
  const lines = wrap(ctx, input.title, W - 160).slice(0, 4)
  const lineHeight = 116
  let y = H - 300 - (lines.length - 1) * lineHeight
  for (const line of lines) {
    ctx.fillText(line, 80, y)
    y += lineHeight
  }

  bolt(ctx, 106, H - 120, 56, SPARK)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 48px ${family}`
  ctx.fillText('CirclePact', 150, H - 104)

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the picture'))), 'image/png')
    } catch (err) {
      // A photo from another site can taint the canvas; draw again without it.
      if (input.photoUrl) buildDareCard({ ...input, photoUrl: null }).then(resolve, reject)
      else reject(err)
    }
  })
}
