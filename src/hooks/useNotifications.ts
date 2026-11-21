'use client';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 20;

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam = 0 }) =>
      notificationService.list(pageParam, ITEMS_PER_PAGE),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data?.length === ITEMS_PER_PAGE ? pages.length * ITEMS_PER_PAGE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 1,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response.data;
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      toast.success('All notifications marked as read!');
    },
    onError: (error: any) => {
      toast.error('Failed to mark all as read');
    },
  });
}

