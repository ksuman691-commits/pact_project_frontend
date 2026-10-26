'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dareService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { toErrorMessage } from '@/lib/errorMessages';
import { useMissingDobRedirect } from '@/hooks/useMissingDobRedirect';
import toast from 'react-hot-toast';

export function useCreateDare() {
  const queryClient = useQueryClient();
  const redirectIfMissingDob = useMissingDobRedirect();

  return useMutation({
    mutationFn: (data: any) => dareService.create(data),
    // Returned so mutateAsync resolves only after the dares lists have
    // refetched; the success screen then links to a list that already holds
    // the new dare. `dares.all` is the prefix of the feed/mine keys, so it
    // covers every dares query, including ones not currently mounted.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dares.all, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),
      ]),
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to create dare'));
      redirectIfMissingDob(error);
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

/** Everything that changes one dare refreshes the lists, the detail and Home. */
function useRefreshDare() {
  const queryClient = useQueryClient();
  return (dareId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all }),
    ]);
}

export function useReviewDare() {
  const refresh = useRefreshDare();
  return useMutation({
    mutationFn: ({ dareId, done }: { dareId: number; done: boolean }) => dareService.review(dareId, done),
    onSuccess: (_, { dareId, done }) => {
      toast.success(done ? 'Marked done' : 'Marked not done');
      return refresh(dareId);
    },
    onError: (error: any) => toast.error(toErrorMessage(error, "Couldn't save that. Try again.")),
  });
}

export function useDareRewardStep() {
  const refresh = useRefreshDare();
  return useMutation({
    mutationFn: ({ dareId, step }: { dareId: number; step: 'sent' | 'received' | 'not-received' }) => dareService.rewardStep(dareId, step),
    onSuccess: (_, { dareId, step }) => {
      toast.success(step === 'sent' ? "We've told them to check" : step === 'received' ? 'Marked received' : "We've let them know");
      return refresh(dareId);
    },
    onError: (error: any) => toast.error(toErrorMessage(error, "Couldn't save that. Try again.")),
  });
}

export function useShareDare() {
  const refresh = useRefreshDare();
  return useMutation({
    mutationFn: ({ dareId, shared }: { dareId: number; shared: boolean }) => dareService.share(dareId, shared),
    onSuccess: (_, { dareId, shared }) => {
      toast.success(shared ? 'Now showing in Discover' : 'Removed from Discover');
      return refresh(dareId);
    },
    onError: (error: any) => toast.error(toErrorMessage(error, "Couldn't change that. Try again.")),
  });
}
