'use client'

import { useQuery } from '@tanstack/react-query'
import { pactAdvancedService } from '@/services/api'
import { useAuthStore } from '@/store/auth'

export const MY_PACTS_STALE_MS = 2 * 60 * 1000

/**
 * The signed-in user's pacts (one request). Shares the ['my-pacts', userId] key
 * with the Pacts page, so Home can warm the cache before the "Post today"
 * sheet opens.
 */
export function useMyPacts() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['my-pacts', user?.id],
    queryFn: () => pactAdvancedService.getMyPacts(0, 100),
    enabled: !!user?.id,
    staleTime: MY_PACTS_STALE_MS,
    retry: 1,
  })
}
