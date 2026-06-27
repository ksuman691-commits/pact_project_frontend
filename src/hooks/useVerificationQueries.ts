'use client';

import { useQuery } from '@tanstack/react-query';
import { verificationService, verificationAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

export function useVerificationByPact(pactId: number) {
  return useQuery({
    queryKey: queryKeys.verifications.byPact(pactId),
    queryFn: () => verificationAdvancedService.listByPact(pactId),
    enabled: !!pactId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVerificationByUser(userId: number) {
  return useQuery({
    queryKey: queryKeys.verifications.byUser(userId),
    queryFn: () => verificationAdvancedService.listByUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVerificationStats(pactId: number) {
  return useQuery({
    queryKey: queryKeys.verifications.stats(pactId),
    queryFn: () => verificationAdvancedService.getStats(pactId),
    enabled: !!pactId,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePactVerificationStats(pactId: number) {
  return useQuery({
    queryKey: queryKeys.pacts.detail(pactId),
    queryFn: () => verificationService.getStats(pactId),
    enabled: !!pactId,
    staleTime: 1000 * 60 * 2,
  });
}
