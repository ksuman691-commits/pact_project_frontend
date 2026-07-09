'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { circleService, circleAdvancedService, circleJoinRequestService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => circleService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.all });
      toast.success('Circle created successfully!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create circle');
    },
  });
}

export function useJoinCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { circleId: number; isPublic: boolean; message?: string }) => {
      const { circleId, isPublic, message } = params;
      // For public circles, use direct join endpoint
      // For private circles, send a join request
      if (isPublic) {
        return circleService.join(circleId);
      } else {
        return circleJoinRequestService.sendRequest(circleId, message);
      }
    },
    onSuccess: (response, params) => {
      const { circleId, isPublic } = params;
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.all });
      const successMessage = isPublic ? 'Joined circle!' : 'Join request sent!';
      toast.success(successMessage);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to join circle');
    },
  });
}

export function useLeaveCircle(circleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => circleService.leave(circleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      toast.success('Left circle successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to leave circle');
    },
  });
}

export function useApproveCircleJoinRequest(circleId: number, requestId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message?: string) =>
      circleJoinRequestService.approve(circleId, requestId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.members(circleId) });
      toast.success('Join request approved!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    },
  });
}

export function useRejectCircleJoinRequest(circleId: number, requestId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message?: string) =>
      circleJoinRequestService.reject(circleId, requestId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      toast.success('Join request rejected!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    },
  });
}

export function useInviteUserToCircle(circleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: number; message?: string }) =>
      circleAdvancedService.inviteUser(circleId, data.userId, data.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.members(circleId) });
      toast.success('User invited to circle!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to invite user');
    },
  });
}

export function useRemoveCircleMember(circleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      circleAdvancedService.removeMember(circleId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.circles.members(circleId) });
      toast.success('Member removed from circle!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove member');
    },
  });
}
