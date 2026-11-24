import { useQuery } from '@tanstack/react-query';
import { pactService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { isTransientError } from '@/lib/transient';


export function usePact(id: number) {
  return useQuery({
    queryKey: queryKeys.pacts.detail(id),
    queryFn: () => pactService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    // A sleeping server answers 429/5xx (or nothing) for up to a minute while it starts:
    // keep trying through that (about 80 s with the 8 s cap). A real answer such as
    // 403 or 404 (not allowed, taken down, gone) is shown at once.
    retry: (count, error: any) => isTransientError(error) && count < 12,
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

