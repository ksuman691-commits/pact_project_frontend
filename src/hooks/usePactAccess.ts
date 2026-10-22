'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { askToWatch, getAccessInbox, getCircleRequests, listWatchers, resolveWatcher, setPactPrivate, updateWatchSettings, withdrawAsk } from '@/lib/api/access'

/** Anything that shows pact media must refetch once access changes. */
function useInvalidateAccess() {
  const queryClient = useQueryClient()
  return (pactId: number) => {
    queryClient.invalidateQueries({ queryKey: ['access'] })
    queryClient.invalidateQueries({ queryKey: ['pacts'] })
    queryClient.invalidateQueries({ queryKey: ['feed'] })
    queryClient.invalidateQueries({ queryKey: ['my-pacts'] })
    queryClient.invalidateQueries({ queryKey: ['profile-user-pacts'] })
    queryClient.invalidateQueries({ queryKey: ['circles'] })
    queryClient.invalidateQueries({ queryKey: ['stories'] })
    queryClient.invalidateQueries({ queryKey: ['pact', pactId] })
  }
}

export function useAskToWatch(pactId: number) {
  const invalidate = useInvalidateAccess()
  return useMutation({
    mutationFn: (body: { tip_id?: number | null; note?: string | null } = {}) => askToWatch(pactId, body),
    onSuccess: () => invalidate(pactId),
  })
}

export function useWithdrawAsk(pactId: number) {
  const invalidate = useInvalidateAccess()
  return useMutation({ mutationFn: () => withdrawAsk(pactId), onSuccess: () => invalidate(pactId) })
}

export function useWatchers(pactId: number, enabled: boolean) {
  return useQuery({ queryKey: ['access', 'pact', pactId], queryFn: () => listWatchers(pactId), enabled, staleTime: 15_000 })
}

export function useResolveWatcher(pactId: number) {
  const invalidate = useInvalidateAccess()
  return useMutation({
    mutationFn: ({ userId, action }: { userId: number; action: 'approve' | 'deny' | 'revoke' }) => resolveWatcher(pactId, userId, action),
    onSuccess: () => invalidate(pactId),
  })
}

export function useSetPactPrivate(pactId: number) {
  const invalidate = useInvalidateAccess()
  return useMutation({
    mutationFn: (input: boolean | { locked: boolean; keepMembers?: boolean }) =>
      typeof input === 'boolean' ? setPactPrivate(pactId, input) : setPactPrivate(pactId, input.locked, input.keepMembers ?? true),
    onSuccess: () => invalidate(pactId),
  })
}

export function useAccessInbox(enabled = true) {
  return useQuery({ queryKey: ['access', 'inbox'], queryFn: getAccessInbox, enabled, staleTime: 30_000 })
}

export function useUpdateWatchSettings(pactId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { media_locked?: boolean; watch_price?: number | null; watch_auto_approve?: boolean; keep_members?: boolean }) => updateWatchSettings(pactId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access'] })
      queryClient.invalidateQueries({ queryKey: ['pacts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCircleRequests(enabled = true) {
  return useQuery({ queryKey: ['access', 'circle-requests'], queryFn: getCircleRequests, enabled, staleTime: 30_000 })
}
