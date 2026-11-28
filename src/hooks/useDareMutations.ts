'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Dare } from '@/types';
import { dareService, mapDare } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { toErrorMessage } from '@/lib/errorMessages';
import { useMissingDobRedirect } from '@/hooks/useMissingDobRedirect';
import toast from 'react-hot-toast';

/**
 * Puts dares you just sent at the top of your own list if the refetched list doesn't
 * have them yet (the server can be a moment behind, or list them past the first page),
 * so the Sent tab shows the new dare straight away.
 */
export function showSentDares(queryClient: QueryClient, dares: Dare[]) {
  // Only whole dares: a bare id would draw an empty card.
  const fresh = dares.filter((dare) => dare && dare.id != null && dare.title && dare.creator_id != null);
  if (fresh.length === 0) return;
  queryClient.setQueryData(queryKeys.dares.mine(), (old: any) => {
    if (!old?.pages?.length) return old;
    const have = new Set(old.pages.flatMap((page: any) => (page.data ?? []).map((dare: Dare) => dare.id)));
    const missing = fresh.filter((dare) => !have.has(dare.id));
    if (missing.length === 0) return old;
    const [first, ...rest] = old.pages;
    return { ...old, pages: [{ ...first, data: [...missing, ...(first.data ?? [])] }, ...rest] };
  });
}

export function useCreateDare() {
  const queryClient = useQueryClient();
  const redirectIfMissingDob = useMissingDobRedirect();

  return useMutation({
    mutationFn: (data: any) => dareService.create(data),
    // Returned so mutateAsync resolves only after the dares lists have
    // refetched; the success screen then links to a list that already holds
    // the new dare. `dares.all` is the prefix of the feed/mine keys, so it
    // covers every dares query, including ones not currently mounted.
    onSuccess: async (response: any) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dares.all, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),
      ]);
      showSentDares(queryClient, [response?.data]);
    },
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
      toast.success("You're in.");
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
    mutationFn: (data: { proof_file: File | File[]; proof_type: 'photo' | 'video' | 'checklist'; caption?: string }) =>
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

export function useCancelDare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dareId: number) => dareService.cancel(dareId),
    onSuccess: (response: any, dareId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.detail(dareId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      toast.success(response?.data?.message === 'Dare called off' ? 'Dare called off' : 'Dare cancelled');
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

type DarePatch = (dare: Dare) => Dare;

/**
 * Change one dare everywhere it's cached (My dares, Discover, Today, the
 * detail page) without a round trip, and hand back what was there so a
 * failed request can put it back.
 */
function patchDareEverywhere(queryClient: QueryClient, dareId: number, patch: DarePatch) {
  const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.dares.all });
  queryClient.setQueriesData({ queryKey: queryKeys.dares.all }, (old: any) => {
    if (!old) return old;
    const fix = (d: any) => (d && d.id === dareId ? patch(d) : d);
    // Infinite lists: { pages: [{ data: Dare[] }] }
    if (Array.isArray(old.pages)) {
      return { ...old, pages: old.pages.map((p: any) => (p && Array.isArray(p.data) ? { ...p, data: p.data.map(fix) } : p)) };
    }
    // Detail: { data: Dare }
    if (old.data && !Array.isArray(old.data) && old.data.id === dareId) return { ...old, data: patch(old.data) };
    if (Array.isArray(old.data)) return { ...old, data: old.data.map(fix) };
    if (old.id === dareId) return patch(old);
    return old;
  });
  return () => snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

/**
 * Marking a dare done used to wait for the server and then for every dares
 * list to refetch before the button let go, so it felt stuck for seconds.
 * Now the card flips at once, the server's answer replaces it when it lands,
 * and the lists refresh quietly in the background.
 */
export function useReviewDare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dareId, done }: { dareId: number; done: boolean }) => dareService.review(dareId, done),
    onMutate: async ({ dareId, done }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dares.all });
      const now = new Date().toISOString();
      const rollback = patchDareEverywhere(queryClient, dareId, (d) => ({
        ...d,
        state: done ? 'completed' : 'not_completed',
        status: done ? 'completed' : 'failed',
        completed_at: done ? now : d.completed_at,
      } as Dare));
      toast.success(done ? 'Marked done' : 'Marked not done');
      return { rollback };
    },
    onSuccess: (response: any, { dareId }) => {
      const fresh = response?.data as Dare | undefined;
      if (fresh?.id === dareId) patchDareEverywhere(queryClient, dareId, () => fresh);
      // Not awaited: the button is already free.
      queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
    },
    onError: (error: any, _vars, context) => {
      context?.rollback();
      toast.error(toErrorMessage(error, "Couldn't save that. Try again."));
    },
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

/** Step out of a dare you accepted. The server records it as a pass, never a fail. */
export function useLeaveDare() {
  const refresh = useRefreshDare();
  return useMutation({
    mutationFn: (dareId: number) => dareService.leave(dareId),
    onSuccess: (_, dareId) => {
      toast.success("You left the dare. It doesn't count against you.");
      return refresh(dareId);
    },
    onError: (error: any) => toast.error(toErrorMessage(error, "Couldn't leave the dare. Try again.")),
  });
}

export function useDeleteDareProof() {
  const refresh = useRefreshDare();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dareId: number) => dareService.deleteProof(dareId),
    onSuccess: (_, dareId) => {
      toast.success('Proof deleted');
      return Promise.all([refresh(dareId), queryClient.invalidateQueries({ queryKey: queryKeys.feed.all })]);
    },
    onError: (error: any) => toast.error(toErrorMessage(error, "Couldn't delete the proof. Try again.")),
  });
}
