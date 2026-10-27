import { CAMERA_FILTERS } from '@/lib/cameraFilters'

/**
 * Edits for a dare proof: one colour look and any number of text layers.
 * Positions are the centre of the text as a fraction of the picture (0 to 1),
 * and size is a fraction of the picture's width, so the preview (any size)
 * and the exported file (full size) line up.
 */
export interface TextLayer {
  id: string
  text: string
  x: number
  y: number
  color: string
  size: number
}

export interface ProofEdits {
  filterId: string
  texts: TextLayer[]
}

export const NO_EDITS: ProofEdits = { filterId: 'none', texts: [] }
export const TEXT_COLORS = ['#FFFFFF', '#FFD84D', '#FF6B8B', '#6EE7B7', '#17181D']
export const TEXT_SIZES = { min: 0.05, max: 0.16, step: 0.02, start: 0.09 }

export function hasEdits(edits: ProofEdits) {
  return edits.filterId !== 'none' || edits.texts.length > 0
}

export function filterCss(filterId: string) {
  return CAMERA_FILTERS.find((f) => f.id === filterId)?.css ?? 'none'
}

/** Whether this browser can bake edits into a video (canvas capture + recorder). */
export function canEditVideo() {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  return typeof (canvas as any).captureStream === 'function' && typeof window.MediaRecorder !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

function drawTexts(ctx: CanvasRenderingContext2D, width: number, height: number, texts: TextLayer[]) {
  const family = typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui, sans-serif'
  ctx.save()
  ctx.filter = 'none'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  for (const layer of texts) {
    const px = layer.size * width
    ctx.font = `800 ${px}px ${family}`
    ctx.lineWidth = px * 0.14
    ctx.strokeStyle = layer.color === '#17181D' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.55)'
    ctx.fillStyle = layer.color
    ctx.strokeText(layer.text, layer.x * width, layer.y * height)
    ctx.fillText(layer.text, layer.x * width, layer.y * height)
  }
  ctx.restore()
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read the photo'))
    img.src = url
  })
}

export async function renderPhoto(url: string, edits: ProofEdits): Promise<{ blob: Blob; contentType: string }> {
  const img = await loadImage(url)
  const scale = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not edit the photo')
  ctx.filter = filterCss(edits.filterId)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  drawTexts(ctx, canvas.width, canvas.height, edits.texts)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('Could not save the edited photo')
  return { blob, contentType: 'image/jpeg' }
}

const RECORDER_TYPES = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']

/**
 * Plays the clip once through a canvas and records the result, with its sound.
 * Takes as long as the clip (15 seconds at most). The sound goes to the
 * recorder only, never the speaker.
 */
export async function renderVideo(
  url: string,
  edits: ProofEdits,
  onProgress?: (fraction: number) => void,
): Promise<{ blob: Blob; contentType: string }> {
  if (!canEditVideo()) throw new Error('This browser cannot edit video')
  const video = document.createElement('video')
  video.src = url
  video.playsInline = true
  video.preload = 'auto'
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve()
    video.onerror = () => reject(new Error('Could not read the video'))
  })

  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not edit the video')

  const audio = new AudioContext()
  await audio.resume().catch(() => undefined)
  const source = audio.createMediaElementSource(video)
  const sink = audio.createMediaStreamDestination()
  source.connect(sink)

  const out = (canvas as any).captureStream(30) as MediaStream
  sink.stream.getAudioTracks().forEach((track) => out.addTrack(track))

  const mimeType = RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
  const recorder = new MediaRecorder(out, { videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 64_000, ...(mimeType ? { mimeType } : {}) })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  const css = filterCss(edits.filterId)
  let frame = 0
  const draw = () => {
    ctx.filter = css
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    drawTexts(ctx, canvas.width, canvas.height, edits.texts)
    if (Number.isFinite(video.duration) && video.duration > 0) onProgress?.(Math.min(1, video.currentTime / video.duration))
    frame = requestAnimationFrame(draw)
  }

  const cleanup = () => {
    cancelAnimationFrame(frame)
    out.getTracks().forEach((track) => track.stop())
    void audio.close().catch(() => undefined)
    video.removeAttribute('src')
    video.load()
  }

  try {
    const done = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve()
      recorder.onerror = () => reject(new Error('Recording failed'))
      video.onended = () => {
        if (recorder.state !== 'inactive') recorder.stop()
      }
      video.onerror = () => reject(new Error('Could not play the video'))
      // A clip whose length never resolves would otherwise record forever.
      window.setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop()
      }, 20_000)
    })
    recorder.start()
    draw()
    await video.play()
    await done
  } finally {
    cleanup()
  }

  const type = (recorder.mimeType || mimeType || 'video/webm').split(';')[0]
  return { blob: new Blob(chunks, { type }), contentType: type }
}
