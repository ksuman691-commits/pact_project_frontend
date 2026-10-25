import api from '@/services/api'
import { StorageUploadError, type PactStory, type StoryUploadUrl } from '@/lib/stories'

export async function requestStoryUploadUrl(pactId: number, body: { content_type: string; size_bytes: number }) {
  const response = await api.post(`/api/pacts/${pactId}/stories/upload-url`, body)
  return response.data as StoryUploadUrl
}

/** Raw PUT to the presigned URL. XHR rather than axios/fetch for upload progress. */
export function putStoryVideo(uploadUrl: string, blob: Blob, contentType: string, onProgress: (fraction: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1)
        resolve()
      } else {
        reject(new StorageUploadError(xhr.status, `The video didn't reach storage (status ${xhr.status}). Your video is still here, try again.`))
      }
    }
    xhr.onerror = () => reject(new StorageUploadError(0, "The video couldn't reach storage. Check your connection, your video is still here."))
    xhr.ontimeout = () => reject(new StorageUploadError(0, 'Storage took too long to answer. Your video is still here, try again.'))
    xhr.send(blob)
  })
}

export async function createStory(pactId: number, body: { object_key: string; duration_seconds: number; caption?: string }) {
  const response = await api.post(`/api/pacts/${pactId}/stories`, body)
  return response.data as PactStory
}

export async function getTodayStories(pactId: number): Promise<PactStory[]> {
  const response = await api.get(`/api/pacts/${pactId}/stories/today`)
  const payload = response.data
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  return rows as PactStory[]
}

/** The viewer's own live moments across every pact (one request, however many pacts they have). */
export async function getMyStoriesToday(): Promise<PactStory[]> {
  const response = await api.get('/api/me/stories/today')
  const payload = response.data
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  return rows as PactStory[]
}

/** One person you follow, with their live moments in free pacts that are open to followers. */
export interface FollowingMomentPerson {
  user_id: number
  name: string | null
  username: string | null
  avatar_url: string | null
  has_unseen: boolean
  latest_at: string
  stories: PactStory[]
}

export async function getFollowingMoments(): Promise<FollowingMomentPerson[]> {
  const response = await api.get('/api/me/following/stories/today')
  const payload = response.data
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  return rows as FollowingMomentPerson[]
}

export async function markStorySeen(storyId: number) {
  await api.post(`/api/stories/${storyId}/seen`)
}

export interface StoryViewer {
  user_id: number
  name: string | null
  username: string | null
  avatar_url: string | null
  viewed_at: string
  reaction?: string | null
}

export interface StoryReply {
  id: number
  user_id: number
  name: string | null
  avatar_url: string | null
  text: string
  created_at: string
}

export const STORY_REACTIONS = ['❤️', '🔥', '👏', '💪', '😂', '😮'] as const

export async function reactToStory(storyId: number, emoji: string) {
  await api.post(`/api/stories/${storyId}/react`, { emoji })
}

export async function replyToStory(storyId: number, text: string) {
  await api.post(`/api/stories/${storyId}/reply`, { text })
}

/** Only the author of a moment may call this; anyone else gets a 404. */
export async function getStoryViewers(storyId: number): Promise<{ count: number; viewers: StoryViewer[]; replies: StoryReply[] }> {
  const response = await api.get(`/api/stories/${storyId}/viewers`)
  const payload = response.data
  return {
    count: Number(payload?.count ?? 0),
    viewers: Array.isArray(payload?.viewers) ? payload.viewers : [],
    replies: Array.isArray(payload?.replies) ? payload.replies : [],
  }
}
