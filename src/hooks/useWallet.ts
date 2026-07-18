import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { walletService, walletAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const ITEMS_PER_PAGE = 20;

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet.detail(),
    queryFn: async () => {
      const response = await walletService.get();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance(),
    queryFn: async () => {
      const response = await walletService.get();
      return { balance: Number(response.data?.balance ?? 0) };
    },
    staleTime: 1000 * 60 * 1,
  });
}

export function useWalletLocked() {
  return useQuery({
    queryKey: queryKeys.wallet.locked(),
    queryFn: async () => {
      const response = await walletAdvancedService.getLocked();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useWalletRewards() {
  return useQuery({
    queryKey: queryKeys.wallet.rewards(),
    queryFn: async () => {
      const response = await walletService.get();
      return { rewards: Number(response.data?.escrow_locked ?? 0) };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(),
    queryFn: async () => {
      const response = await walletService.getTransactions();
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useWalletHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.wallet.history(),
    queryFn: ({ pageParam = 0 }) =>
      walletAdvancedService.getHistory(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWalletWithdrawalRequests() {
  return useQuery({
    queryKey: queryKeys.wallet.withdrawalRequests(),
    queryFn: async () => {
      const response = await walletAdvancedService.getWithdrawalRequests();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}
