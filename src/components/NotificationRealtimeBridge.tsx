'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com';

/** Fired on window when someone you can watch just posted a moment: `{ pactId, userId }`. */
export const LIVE_MOMENT_EVENT = 'cp:live-moment';

/**
 * One stream per open app: the unread count, and a nudge when someone you can
 * watch posts a moment, so the Moments row refreshes straight away (the ring
 * arrives with its pulse) instead of on the next minute's poll.
 */
export default function NotificationRealtimeBridge() {
  const queryClient = useQueryClient();
  const { user, isInitialized } = useAuthStore();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isInitialized || userId == null) return;

    let source: EventSource | null = null;
    let retryTimer = 0;
    let failures = 0;
    let closed = false;

    const connect = () => {
      // Read the token each time: after an hour the old one has expired, and the browser's own
      // reconnect would keep retrying the stale URL.
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token || closed) return;
      source = new EventSource(`${API_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`);

      source.onopen = () => {
        failures = 0;
      };

      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data || '{}');
          if (typeof parsed.unread_count === 'number') {
            queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
              unread_count: parsed.unread_count,
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
          }
          if (parsed.moment && typeof parsed.moment === 'object') {
            // Every moments list (Home row, See All, pact rings) and the circles' "posted today" counts.
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.circles.all });
            window.dispatchEvent(
              new CustomEvent(LIVE_MOMENT_EVENT, { detail: { pactId: parsed.moment.pact_id, userId: parsed.moment.user_id } }),
            );
          }
        } catch {
          // Ignore malformed events.
        }
      };

      source.onerror = () => {
        // Reconnect ourselves with a fresh token, backing off: 2 s, 4 s … up to a minute.
        source?.close();
        source = null;
        failures += 1;
        const delay = Math.min(60_000, 2000 * 2 ** Math.min(failures - 1, 5));
        window.clearTimeout(retryTimer);
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      window.clearTimeout(retryTimer);
      source?.close();
    };
  }, [isInitialized, userId, queryClient]);

  return null;
}
