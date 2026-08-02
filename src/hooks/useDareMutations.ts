'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dareService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

function toErrorMessage(error: any, fallback: string) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.msg === 'string') return item.msg;
        return null;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.msg === 'string') return detail.msg;
    return fallback;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useCreateDare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => dareService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.feed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      toast.success('Dare created successfully!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to create dare'));
    },
  });
}

export function useClaimDare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dareId: number) => dareService.claim(dareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.feed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      toast.success('Dare claimed successfully!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to claim dare'));
    },
  });
}

export function useAcceptDare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dareId: number) => dareService.accept(dareId),
    onSuccess: (_, dareId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      toast.success('Dare accepted!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to accept dare'));
    },
  });
}

export function useDeclineDare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dareId: number) => dareService.decline(dareId),
    onSuccess: (_, dareId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      toast.success('Dare declined');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to decline dare'));
    },
  });
}

export function useUploadDareProof(dareId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { proof_file: File; proof_type: 'photo' | 'video' | 'checklist'; caption?: string }) =>
      dareService.uploadProof(dareId, data.proof_file, data.proof_type, data.caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      toast.success('Proof uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to upload proof'));
    },
  });
}

export function useVerifyDare(dareId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => dareService.verify(dareId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.stats(dareId) });
      toast.success('Verification submitted!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to submit verification'));
    },
  });
}

export function useCancelDare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dareId: number) => dareService.cancel(dareId),
    onSuccess: (_, dareId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      toast.success('Dare cancelled');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to cancel dare'));
    },
  });
}
