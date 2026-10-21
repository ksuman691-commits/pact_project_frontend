import api from '@/services/api'

export type MediaAccess = 'open' | 'creator' | 'member' | 'approved' | 'pending' | 'denied' | 'revoked' | 'none'

export interface AccessPerson {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
}

export interface AccessRow {
  user: AccessPerson
  status: 'pending' | 'approved' | 'denied' | 'revoked'
  note: string | null
  tip: { id: number; code: string; amount: number | null; status: string } | null
  pact_id: number
  pact_title?: string | null
  created_at: string
  resolved_at: string | null
}

export async function askToWatch(pactId: number, body: { tip_id?: number | null; note?: string | null } = {}) {
  const response = await api.post(`/api/pacts/${pactId}/access`, body)
  return response.data as { status: MediaAccess }
}

export async function withdrawAsk(pactId: number) {
  const response = await api.delete(`/api/pacts/${pactId}/access`)
  return response.data as { status: MediaAccess }
}

export async function listWatchers(pactId: number) {
  const response = await api.get(`/api/pacts/${pactId}/access`)
  return response.data as { media_locked: boolean; pending: AccessRow[]; approved: AccessRow[] }
}

export async function resolveWatcher(pactId: number, userId: number, action: 'approve' | 'deny' | 'revoke') {
  const response = await api.post(`/api/pacts/${pactId}/access/${userId}/${action}`)
  return response.data as { status: string }
}

export async function setPactPrivate(pactId: number, mediaLocked: boolean) {
  const response = await api.put(`/api/pacts/${pactId}`, { media_locked: mediaLocked })
  return response.data
}

export async function getAccessInbox() {
  const response = await api.get('/api/access/inbox')
  return response.data as { pending: AccessRow[] }
}
