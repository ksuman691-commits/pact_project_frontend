import { useQuery } from '@tanstack/react-query';
import { pactService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';


export function usePact(id: number) {
  return useQuery({
    queryKey: queryKeys.pacts.detail(id),
    queryFn: () => pactService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    // Not allowed or gone (e.g. taken down): say so at once instead of retrying.
    retry: (count, error: any) => ![403, 404].includes(error?.response?.status) && count < 3,
  });
}

export function usePactProofs(pactId: number, limit = 20) {
  return useQuery({
    queryKey: [...queryKeys.pacts.proofHistory(pactId), limit],
    queryFn: () => pactService.listProofs(pactId, limit),
    enabled: !!pactId,
    staleTime: 1000 * 60 * 2,
  });
}

