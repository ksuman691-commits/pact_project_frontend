import { useQuery } from '@tanstack/react-query';
import { circleService, circleJoinRequestService } from '@/services/api';

export function useCircles() {
  return useQuery({
    queryKey: ['circles'],
    queryFn: async () => {
      const response = await circleService.list();
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCircle(id: number) {
  return useQuery({
    queryKey: ['circles', id],
    queryFn: async () => {
      const response = await circleService.getById(id);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCircleMembers(circleId: number) {
  return useQuery({
    queryKey: ['circles', circleId, 'members'],
    queryFn: async () => {
      const response = await circleJoinRequestService.listMembers(circleId);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
