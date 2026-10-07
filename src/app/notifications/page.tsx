'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import { queryKeys } from '@/lib/queryKeys';
import { notificationService } from '@/services/api';
import { useMarkAllNotificationsAsRead, useNotifications } from '@/hooks/useNotifications';
import { useAcceptFollow, usePendingFollowRequests, useRejectFollow } from '@/hooks/useFollows';

const formatTimeAgo = (isoTimestamp: string) => {
  const timestamp = new Date(isoTimestamp).getTime();
  const now = Date.now();
  const diffMs = Math.max(now - timestamp, 0);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
};

const isJoinRequestNotification = (notification: any) => {
  const text = `${notification?.title || ''} ${notification?.description || ''}`.toLowerCase();
  return text.includes('join request') || text.includes('wants to join') || text.includes('requested to join');
};

const notificationTarget = (notification: any) => {
  if (notification.related_pact_id) {
    // Join-request notifications land the creator directly in the pact's
    // Accept/Reject window (see PactJoinRequestsModal) instead of just the
    // pact page — previously the notification navigated here with no way
    // to actually act on the request once you arrived.
    const suffix = isJoinRequestNotification(notification) ? '?joinRequests=1' : '';
    return `/pact-details/${notification.related_pact_id}${suffix}`;
  }
  if (notification.related_circle_id) return `/circles/${notification.related_circle_id}`;
  return '/feed';
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [autoMarked, setAutoMarked] = useState(false);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const pendingFollowRequestsQuery = usePendingFollowRequests();
  const acceptFollow = useAcceptFollow();
  const rejectFollow = useRejectFollow();

  const notifications = useMemo(
    () => (data?.pages || []).flatMap((page: any) => page.data || []),
    [data]
  );

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;
  const pendingFollowRequests = pendingFollowRequestsQuery.data?.data || [];

  useEffect(() => {
    if (!autoMarked && !isLoading && unreadCount > 0 && !markAllAsRead.isPending) {
      markAllAsRead.mutate();
      setAutoMarked(true);
    }
  }, [autoMarked, isLoading, unreadCount, markAllAsRead]);

  const handleNotificationClick = async (notification: any) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() }),
        ]);
      }

      router.push(notificationTarget(notification));
    } finally {
      setIsUpdating(false);
    }
  };

  const getPendingFollowIdForNotification = (notification: any) => {
    if (!notification?.related_user_id) return null;
    const matched = pendingFollowRequests.find((row: any) => row.follower_id === notification.related_user_id);
    return matched?.id || null;
  };

  const isFollowRequestNotification = (notification: any) => {
    const title = String(notification?.title || '').toLowerCase();
    return title.includes('follow request');
  };

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-[var(--paper)] max-w-md mx-auto pb-20">
        <div className="bg-[var(--card)] border-b border-[var(--hairline)] sticky top-24 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#14121F]">Notifications</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/notifications/preferences"
                aria-label="Notification preferences"
                className="inline-flex items-center justify-center p-2 rounded-full bg-[var(--card)] text-[var(--ink-soft)] hover:bg-[var(--card-muted)] transition"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => markAllAsRead.mutate()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full bg-[var(--card)] text-[var(--ink-soft)] hover:bg-[var(--card-muted)] transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="text-[#9CA3AF] text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--hairline)] bg-[var(--card)] p-8 text-center">
              <Bell className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
              <p className="font-semibold text-[#14121F]">No notifications yet</p>
              <p className="text-sm text-[#9CA3AF] mt-1">You will see join requests and activity updates here.</p>
            </div>
          ) : (
            notifications.map((notification: any) => {
              const pendingFollowId = getPendingFollowIdForNotification(notification);
              const canRespondInline = isFollowRequestNotification(notification) && !!pendingFollowId;

              return (
              <div
                key={notification.id}
                className={`w-full text-left rounded-[24px] border p-4 transition ${
                  notification.is_read
                    ? 'bg-[var(--card)] border-[var(--hairline)]'
                    : 'bg-[var(--card)] border-[var(--hairline)]'
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#14121F]">{notification.title}</p>
                    <p className="text-sm text-[#6B7280] mt-1">{notification.description}</p>
                  </div>
                  {!notification.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--navy)] mt-1" />
                  )}
                </div>
                </button>
                {canRespondInline ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => acceptFollow.mutate(pendingFollowId)}
                      disabled={acceptFollow.isPending || rejectFollow.isPending}
                      className="px-3 py-1.5 text-xs rounded-md bg-navy text-white hover:bg-navy-hover disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFollow.mutate(pendingFollowId)}
                      disabled={acceptFollow.isPending || rejectFollow.isPending}
                      className="px-3 py-1.5 text-xs rounded-md bg-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--hairline)] disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
                <p className="text-xs text-[#9CA3AF] mt-3">{formatTimeAgo(notification.created_at)}</p>
              </div>
            )})
          )}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-3 rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] text-[var(--ink-soft)] font-semibold hover:bg-[var(--card-muted)] disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
