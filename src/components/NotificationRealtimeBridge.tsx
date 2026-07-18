'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function NotificationRealtimeBridge() {
  const queryClient = useQueryClient();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || !user) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    const streamUrl = `${API_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(streamUrl);

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data || '{}');
        if (typeof parsed.unread_count === 'number') {
          queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
            unread_count: parsed.unread_count,
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
        }
      } catch {
        // Ignore malformed events; stream reconnect will continue.
      }
    };

    source.onerror = () => {
      // EventSource will retry automatically. We keep this handler to avoid uncaught noise.
    };

    return () => {
      source.close();
    };
  }, [isInitialized, user, queryClient]);

  return null;
}
