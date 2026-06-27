import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { pactService } from '@/services/api';
import { Pact } from '@/types';

export function usePacts() {
  return useQuery({
    queryKey: ['pacts'],
    queryFn: () => pactService.list(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePact(id: number) {
  return useQuery({
    queryKey: ['pacts', id],
    queryFn: () => pactService.getById(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTodaysPacts() {
  return useQuery({
    queryKey: ['pacts', 'today'],
    queryFn: async () => {
      const response = await pactService.list();
      const pacts = response.data;
      // Filter for today's pacts
      const today = new Date().toDateString();
      return pacts.filter((pact: Pact) => {
        const deadline = new Date(pact.deadline).toDateString();
        return deadline === today;
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useActivePacts() {
  return useQuery({
    queryKey: ['pacts', 'active'],
    queryFn: async () => {
      const response = await pactService.list();
      return response.data.filter((pact: Pact) => pact.status === 'active');
    },
    staleTime: 1000 * 60 * 5,
  });
}
