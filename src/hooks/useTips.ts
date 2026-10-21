'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyTipSettings, getSupporters, getTipInbox, getUserTipInfo, resolveTip, saveMyTipSettings, type TipSettings } from '@/lib/api/tips'

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

export function useTipInbox(enabled = true) {
  return useQuery({ queryKey: ['tips', 'inbox'], queryFn: getTipInbox, enabled, staleTime: 30_000 })
}

export function useResolveTip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'confirm' | 'reject' }) => resolveTip(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['pacts'] })
      queryClient.invalidateQueries({ queryKey: ['profile-user-pacts'] })
    },
  })
}

export function useSupporters(userId: number | string | null | undefined) {
  return useQuery({
    queryKey: ['tips', 'supporters', String(userId)],
    queryFn: () => getSupporters(userId as number),
    enabled: userId != null && userId !== '',
    staleTime: 60_000,
  })
}
