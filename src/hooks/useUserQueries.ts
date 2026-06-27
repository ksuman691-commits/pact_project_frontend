'use client';

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

export function useUser(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userService.getById(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: queryKeys.users.detailByUsername(username),
    queryFn: () => userService.getByUsername(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserStats(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.stats(userId),
    queryFn: () => userService.getStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUserFollowers(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.followers(userId),
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserFollowing(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.following(userId),
    queryFn: () => userService.getFollowing(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserAnalytics(userId: number) {
  return useQuery({
    queryKey: queryKeys.users.analytics(userId),
    queryFn: () => userService.getStats(userId), // Using stats endpoint for analytics
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSearchUsers(query: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => userService.search(query, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
