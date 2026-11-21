import { useQuery } from '@tanstack/react-query';
import { circleService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';


export function useCircles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.circles.list(),
    queryFn: async () => {
      const response = await circleService.list();
      return response.data;
    },
  enabled,
  staleTime: 1000 * 60 * 5,
  refetchOnMount: 'always',
  });
}

