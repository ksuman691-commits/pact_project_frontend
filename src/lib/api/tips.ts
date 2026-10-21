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
