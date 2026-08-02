'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Deposit is not available in this version.');
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Withdrawals are not available in this version.');
    },
  });
}

export function useInitiateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Withdrawal requests are not available in this version.');
    },
  });
}
