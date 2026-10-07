// Off unless the env var is exactly "true", so a missing or mistyped value
// keeps the existing proof-upload flow.
export const STORIES_ENABLED = process.env.NEXT_PUBLIC_STORIES_ENABLED === 'true'

export const STORY_MAX_SECONDS = 15
export const STORY_MAX_BYTES = 30 * 1024 * 1024
export const STORY_ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const
export const STORY_LIMITS_TEXT = 'Up to 15 seconds. MP4, WebM or MOV, 30 MB max.'
export const STORIES_COMING_SOON = 'Stories are coming soon'

// Phone cameras stop a "15 second" clip a few frames late.
const DURATION_TOLERANCE_SECONDS = 0.3

export interface PactStory {
  id: number
  user_id: number
  name: string | null
  avatar_url: string | null
  video_url: string
  duration_seconds: number | null
  created_at: string
  expires_at: string | null
  seen: boolean | null
}

export interface StoryUploadUrl {
  upload_url: string
  object_key: string
  expires_in: number
}

export class StorageUploadError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function statusOf(error: any): number | undefined {
  return error?.response?.status ?? (error instanceof StorageUploadError ? error.status : undefined)
}

/** 404/501 from a stories route means the backend has not shipped it yet. */
export function isStoriesUnavailable(error: any): boolean {
  if (error instanceof StorageUploadError) return false
  const status = statusOf(error)
  return status === 404 || status === 501
}

function detailText(detail: any): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail.trim()
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => (typeof item === 'string' ? item : typeof item?.msg === 'string' ? item.msg : null))
      .filter(Boolean)
    return parts.length ? parts.join(', ') : null
  }
  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string' && detail.message.trim()) return detail.message.trim()
    if (typeof detail.msg === 'string' && detail.msg.trim()) return detail.msg.trim()
  }
  return null
}

/**
 * The backend's own reason first. When there isn't one, say what actually
 * went wrong (status, storage, network) rather than a blanket failure line.
 */
export function storyErrorMessage(error: any): string {
  if (isStoriesUnavailable(error)) return `${STORIES_COMING_SOON}.`
  if (error instanceof StorageUploadError) return error.message
  const fromBackend = detailText(error?.response?.data?.detail)
  if (fromBackend) return fromBackend
  const status = statusOf(error)
  if (status) return `The server answered with status ${status}. Your video is still here, try again.`
  if (error?.code === 'ECONNABORTED') return 'The server took too long to answer. Your video is still here, try again.'
  return "Can't reach the server. Check your connection, your video is still here."
}

const EXTENSION_TYPES: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', qt: 'video/quicktime' }

/** Some Android pickers hand back an empty `type`; fall back to the extension. */
export function resolveVideoType(file: Blob & { name?: string }): string | null {
  const raw = (file.type || '').split(';')[0].trim().toLowerCase()
  if ((STORY_ALLOWED_TYPES as readonly string[]).includes(raw)) return raw
  const ext = file.name?.split('.').pop()?.toLowerCase()
  const fromExt = ext ? EXTENSION_TYPES[ext] : undefined
  return fromExt ?? null
}

export function isDurationAllowed(seconds: number) {
  return seconds <= STORY_MAX_SECONDS + DURATION_TOLERANCE_SECONDS
}

/** Reads duration from a hidden <video>. Resolves null when the browser can't tell. */
export function readVideoDuration(blob: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    let settled = false
    const finish = (value: number | null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      resolve(value)
    }
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) {
        finish(video.duration)
        return
      }
      // Recorder-made WebM reports Infinity until the end is seeked.
      video.ontimeupdate = () => {
        video.ontimeupdate = null
        finish(Number.isFinite(video.duration) ? video.duration : null)
      }
      video.currentTime = 1e7
    }
    video.onerror = () => finish(null)
    setTimeout(() => finish(null), 8000)
    video.src = url
  })
}

export function isToday(iso?: string | null) {
  if (!iso) return false
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
}

/** Whole hours left, rounded up; null when the timestamp is missing or past. */
export function hoursUntil(iso?: string | null): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const diff = t - Date.now()
  if (diff <= 0) return null
  return Math.max(1, Math.ceil(diff / 3600000))
}

export function postedAgo(iso?: string | null): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const minutes = Math.round((Date.now() - t) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return `${hours} h ago`
}

export function monogram(name?: string | null) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
