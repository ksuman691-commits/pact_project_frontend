/*
 * Cutting a 15-second window out of a longer video, on the phone. The clip
 * plays once (silently: its sound goes only to the recorder) through a
 * canvas from the chosen start, and that is recorded with its sound. It takes
 * as long as the window, about 15 seconds.
 */

const RECORDER_TYPES = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']

/** Longest input we'll trim from, and the biggest file. Phones choke on more. */
export const TRIM_MAX_SECONDS = 10 * 60
export const TRIM_MAX_BYTES = 500 * 1024 * 1024

export function canTrimVideo() {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  return typeof (canvas as any).captureStream === 'function' && typeof window.MediaRecorder !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

function openVideo(url: string) {
  const video = document.createElement('video')
  video.src = url
  video.playsInline = true
  video.preload = 'auto'
  video.muted = false
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    video.onloadeddata = () => resolve(video)
    video.onerror = () => reject(new Error('Could not read the video'))
  })
}

function seek(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.01) return resolve()
    const done = () => {
      video.removeEventListener('seeked', done)
      resolve()
    }
    video.addEventListener('seeked', done)
    video.currentTime = time
  })
}

/** Small frames along the clip for the trim bar. Best effort: returns what it could make. */
export async function filmstrip(url: string, count: number, height = 64): Promise<string[]> {
  const frames: string[] = []
  let video: HTMLVideoElement | null = null
  try {
    video = await openVideo(url)
    video.muted = true
    const duration = video.duration
    if (!Number.isFinite(duration) || duration <= 0) return frames
    const width = Math.round((video.videoWidth / video.videoHeight) * height) || height
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return frames
    for (let i = 0; i < count; i++) {
      await seek(video, Math.min(duration - 0.05, (duration * (i + 0.5)) / count))
      ctx.drawImage(video, 0, 0, width, height)
      frames.push(canvas.toDataURL('image/jpeg', 0.6))
    }
  } catch {
    // Frames are decoration; the trim still works without them.
  } finally {
    if (video) {
      video.removeAttribute('src')
      video.load()
    }
  }
  return frames
}

export async function trimVideo(
  url: string,
  start: number,
  length: number,
  onProgress?: (fraction: number) => void,
): Promise<{ blob: Blob; contentType: string; duration: number }> {
  if (!canTrimVideo()) throw new Error('This browser cannot trim video')
  const video = await openVideo(url)
  const end = Math.min(video.duration || start + length, start + length)
  await seek(video, start)

  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not trim the video')

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

  let frame = 0
  let startedAt = 0
  const stop = () => {
    if (recorder.state !== 'inactive') recorder.stop()
    video.pause()
  }
  const draw = () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onProgress?.(Math.min(1, Math.max(0, (video.currentTime - start) / (end - start))))
    if (video.currentTime >= end || video.ended) {
      stop()
      return
    }
    frame = requestAnimationFrame(draw)
  }

  try {
    const done = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve()
      recorder.onerror = () => reject(new Error('Recording failed'))
      video.onerror = () => reject(new Error('Could not play the video'))
      // Never record forever if playback stalls.
      window.setTimeout(stop, (length + 8) * 1000)
    })
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    recorder.start()
    startedAt = performance.now()
    await video.play()
    draw()
    await done
  } finally {
    cancelAnimationFrame(frame)
    out.getTracks().forEach((track) => track.stop())
    void audio.close().catch(() => undefined)
    video.removeAttribute('src')
    video.load()
  }

  const type = (recorder.mimeType || mimeType || 'video/webm').split(';')[0]
  const duration = Math.min(length, (performance.now() - startedAt) / 1000)
  return { blob: new Blob(chunks, { type }), contentType: type, duration }
}
