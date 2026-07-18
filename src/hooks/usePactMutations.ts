'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pactService, joinRequestService, socialService, verificationService } from '@/services/api';
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

export function useCreatePact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => pactService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      toast.success('Pact created successfully!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to create pact'));
    },
  });
}

export function useUpdatePact(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => pactService.update(pactId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all });
      toast.success('Pact updated successfully!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to update pact'));
    },
  });
}

export function useUploadPactProof(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { proof_url?: string; proof_file?: File; proof_type?: 'photo' | 'video' | 'checklist'; caption?: string; day_number?: number }) => {
      if (data.proof_file) {
        return pactService.uploadProofFile(
          pactId,
          data.proof_file,
          data.proof_type || 'photo',
          data.caption,
          data.day_number
        );
      }
      return pactService.uploadProof(pactId, {
        proof_type: data.proof_type || 'photo',
        file_url: data.proof_url || null,
        checklist_data: null,
        caption: data.caption || null,
        day_number: typeof data.day_number === 'number' ? data.day_number : null,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.proofHistory(pactId) });
      toast.success('Proof uploaded successfully!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to upload proof'));
    },
  });
}

export function useJoinPact(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message?: string) => joinRequestService.sendRequest(pactId, message),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      toast.success('Join request sent!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to send join request'));
    },
  });
}

export function useApprovePactJoinRequest(pactId: number, requestId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message?: string) => joinRequestService.approve(pactId, requestId, message),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      toast.success('Join request approved!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to approve request'));
    },
  });
}

export function useRejectPactJoinRequest(pactId: number, requestId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message?: string) => joinRequestService.reject(pactId, requestId, message),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      toast.success('Join request rejected!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to reject request'));
    },
  });
}

export function useLeavePact(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => joinRequestService.leavePact(pactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all });
      toast.success('Left pact successfully!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to leave pact'));
    },
  });
}

export function useLikePact(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => socialService.likePact(pactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.likes(pactId) });
    },
    onError: (error: any) => {
      console.error('Failed to like pact:', error);
    },
  });
}

export function useUnlikePact(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => socialService.unlikePact(pactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.likes(pactId) });
    },
    onError: (error: any) => {
      console.error('Failed to unlike pact:', error);
    },
  });
}

export function useAddComment(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => socialService.addComment(pactId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
      toast.success('Comment added!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to add comment'));
    },
  });
}

export function useDeleteComment(pactId: number, commentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => socialService.deleteComment(pactId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
      toast.success('Comment deleted!');
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to delete comment'));
    },
  });
}

export function useSharePact(pactId: number) {
  return useMutation({
    mutationFn: (platform?: string) => socialService.sharePact(pactId, platform),
    onSuccess: (response) => {
      toast.success('Pact shared!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to share pact'));
    },
  });
}

export function useSubmitVerification(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => verificationService.create(pactId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.verifications.byPact(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      toast.success('Verification submitted!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(toErrorMessage(error, 'Failed to submit verification'));
    },
  });
}

export function useBelievePact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pactId: number) => pactService.vote(pactId, 'believe'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
    },
    onError: (error: any) => {
      console.error('Failed to vote believe:', error);
    },
  });
}

export function useDoubtPact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pactId: number) => pactService.vote(pactId, 'doubt'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
    },
    onError: (error: any) => {
      console.error('Failed to vote doubt:', error);
    },
  });
}
