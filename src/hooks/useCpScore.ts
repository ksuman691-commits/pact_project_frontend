'use client'

import { useQuery } from '@tanstack/react-query'
import { getCpScore } from '@/lib/api/cpScore'

export function useCpScore(userId: number | string | null | undefined) {
  return useQuery({
    queryKey: ['cp-score', String(userId)],
    queryFn: () => getCpScore(userId as number),
    enabled: userId != null && userId !== '' && Number(userId) > 0,
    staleTime: 5 * 60_000,
    retry: false,
  })
}
