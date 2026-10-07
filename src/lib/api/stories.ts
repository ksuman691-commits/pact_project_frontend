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

export async function markStorySeen(storyId: number) {
  await api.post(`/api/stories/${storyId}/seen`)
}
