import api from '@/services/api'

export interface TipSettings {
  upi_id: string | null
  payee_name: string | null
  enabled: boolean
}

export interface PublicTipInfo {
  user_id: number
  upi_id: string
  payee_name: string
}

export async function getMyTipSettings(): Promise<TipSettings> {
  const response = await api.get('/api/users/me/tips')
  return response.data
}

export async function saveMyTipSettings(body: TipSettings): Promise<TipSettings> {
  const response = await api.put('/api/users/me/tips', body)
  return response.data
}

/** Null when the person hasn't turned tips on. */
export async function getUserTipInfo(userId: number | string): Promise<PublicTipInfo | null> {
  try {
    const response = await api.get(`/api/users/${userId}/tips`)
    return response.data
  } catch (error: any) {
    if (error?.response?.status === 404) return null
    throw error
  }
}

export interface TipPerson {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
}

export interface TipRecord {
  id: number
  code: string
  status: 'started' | 'claimed' | 'confirmed' | 'rejected'
  amount: number | null
  creator_id: number
  pact_id: number | null
  pact_title: string | null
  tipper: TipPerson | null
  created_at: string
  claimed_at: string | null
  resolved_at: string | null
}

export async function startTip(body: { creator_id: number; pact_id?: number | null; amount?: number | null }): Promise<TipRecord> {
  const response = await api.post('/api/tips', body)
  return response.data
}

export async function claimTip(tipId: number, amount?: number | null): Promise<TipRecord> {
  const response = await api.post(`/api/tips/${tipId}/claim`, { amount: amount ?? null })
  return response.data
}

export async function resolveTip(tipId: number, action: 'confirm' | 'reject'): Promise<TipRecord> {
  const response = await api.post(`/api/tips/${tipId}/${action}`)
  return response.data
}

export async function getTipInbox(): Promise<{ waiting: TipRecord[]; resolved: TipRecord[]; confirmed_total: number }> {
  const response = await api.get('/api/tips/inbox')
  return response.data
}

export async function getSupporters(userId: number | string): Promise<{ count: number; supporters: TipPerson[] }> {
  const response = await api.get(`/api/users/${userId}/supporters`)
  return response.data
}
