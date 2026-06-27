'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

export function useUpdateUser(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => userService.update(userId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      toast.success('Profile updated successfully!');
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    },
  });
}

export function useFollowUser(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.follow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.followers(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboards.all });
      toast.success('User followed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to follow user');
    },
  });
}

export function useUnfollowUser(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.unfollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.followers(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboards.all });
      toast.success('User unfollowed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to unfollow user');
    },
  });
}
