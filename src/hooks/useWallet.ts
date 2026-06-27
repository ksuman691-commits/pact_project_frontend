import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/api';

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await walletService.get();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const response = await walletService.getTransactions();
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
