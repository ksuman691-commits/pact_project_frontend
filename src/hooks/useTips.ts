'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyTipSettings, getUserTipInfo, saveMyTipSettings, type TipSettings } from '@/lib/api/tips'

export function useMyTipSettings(enabled = true) {
  return useQuery({ queryKey: ['tips', 'me'], queryFn: getMyTipSettings, enabled, staleTime: 60_000 })
}

export function useSaveMyTipSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TipSettings) => saveMyTipSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(['tips', 'me'], data)
      queryClient.invalidateQueries({ queryKey: ['tips', 'user'] })
    },
  })
}

export function useUserTipInfo(userId: number | string | null | undefined) {
  return useQuery({
    queryKey: ['tips', 'user', String(userId)],
    queryFn: () => getUserTipInfo(userId as number),
    enabled: userId != null && userId !== '',
    staleTime: 5 * 60_000,
    retry: false,
  })
}
