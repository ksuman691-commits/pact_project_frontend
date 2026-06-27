'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pactService, joinRequestService, socialService, verificationAdvancedService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

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
      const message = error.response?.data?.detail || 'Failed to create pact';
      toast.error(message);
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
      toast.error(error.response?.data?.detail || 'Failed to update pact');
    },
  });
}

export function useUploadPactProof(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { proof_url?: string; proof_file?: File }) => {
      if (data.proof_file) {
        return pactService.uploadProofFile(pactId, data.proof_file);
      }
      return pactService.uploadProof(pactId, data.proof_url || '');
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.proofHistory(pactId) });
      toast.success('Proof uploaded successfully!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload proof');
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
      toast.error(error.response?.data?.detail || 'Failed to send join request');
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
      toast.error(error.response?.data?.detail || 'Failed to approve request');
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
      toast.error(error.response?.data?.detail || 'Failed to reject request');
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
      toast.error(error.response?.data?.detail || 'Failed to leave pact');
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
      toast.error(error.response?.data?.detail || 'Failed to add comment');
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
      toast.error(error.response?.data?.detail || 'Failed to delete comment');
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
      toast.error(error.response?.data?.detail || 'Failed to share pact');
    },
  });
}

export function useSubmitVerification(pactId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => verificationAdvancedService.submitVerification(pactId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.verifications.byPact(pactId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacts.detail(pactId) });
      toast.success('Verification submitted!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit verification');
    },
  });
}
