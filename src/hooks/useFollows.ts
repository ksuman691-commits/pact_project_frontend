'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { followService, userService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

export function useFollowState(userId?: number) {
  return useQuery({
    queryKey: queryKeys.follows.state(userId || 0),
    queryFn: () => followService.state(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 1000 * 20,
  });
}

export function usePendingFollowRequests() {
  return useQuery({
    queryKey: queryKeys.follows.pending(),
    queryFn: () => followService.pending(),
    staleTime: 1000 * 15,
  });
}

export function useFollowers(userId?: number) {
  return useQuery({
    queryKey: queryKeys.follows.followers(userId || 0),
    queryFn: () => userService.getFollowers(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 1000 * 60,
  });
}

export function useFollowing(userId?: number) {
  return useQuery({
    queryKey: queryKeys.follows.following(userId || 0),
    queryFn: () => userService.getFollowing(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 1000 * 60,
  });
}

function invalidateFollowQueries(queryClient: ReturnType<typeof useQueryClient>, viewedUserId?: number) {
  queryClient.invalidateQueries({ queryKey: queryKeys.follows.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  if (typeof viewedUserId === 'number') {
    queryClient.invalidateQueries({ queryKey: queryKeys.follows.state(viewedUserId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.follows.followers(viewedUserId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.follows.following(viewedUserId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.stats(viewedUserId) });
  }
}

export function useRequestFollow(viewedUserId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => followService.request(userId),
    onSuccess: () => {
      invalidateFollowQueries(queryClient, viewedUserId);
      toast.success('Follow request sent');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to send follow request');
    },
  });
}

export function useAcceptFollow(viewedUserId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followId: number) => followService.accept(followId),
    onSuccess: () => {
      invalidateFollowQueries(queryClient, viewedUserId);
      toast.success('Follow request accepted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to accept request');
    },
  });
}

export function useRejectFollow(viewedUserId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followId: number) => followService.reject(followId),
    onSuccess: () => {
      invalidateFollowQueries(queryClient, viewedUserId);
      toast.success('Follow request rejected');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to reject request');
    },
  });
}

export function useRemoveFollow(viewedUserId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followId: number) => followService.remove(followId),
    onSuccess: () => {
      invalidateFollowQueries(queryClient, viewedUserId);
      toast.success('Follow removed');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update follow status');
    },
  });
}
