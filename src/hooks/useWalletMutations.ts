'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService, walletAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => walletService.deposit(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.detail() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.history() });
      toast.success('Deposit successful! Funds added to your wallet.');
      return response.data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Deposit failed';
      toast.error(message);
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => walletService.withdraw(amount),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.detail() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.history() });
      toast.success('Withdrawal successful!');
      return response.data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Withdrawal failed';
      toast.error(message);
    },
  });
}

export function useInitiateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; method: string }) =>
      walletAdvancedService.initiateWithdrawal(data.amount, data.method),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.withdrawalRequests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
      toast.success('Withdrawal request submitted! Processing...');
      return response.data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to initiate withdrawal';
      toast.error(message);
    },
  });
}
