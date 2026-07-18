'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
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

const notificationTarget = (notification: any) => {
  if (notification.related_pact_id) return `/pact-details/${notification.related_pact_id}`;
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
      <div className="min-h-screen bg-slate-50 max-w-md mx-auto pb-20">
        <div className="bg-white border-b border-slate-100 sticky top-24 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            <button
              onClick={() => markAllAsRead.mutate()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="text-slate-500 text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">No notifications yet</p>
              <p className="text-sm text-slate-500 mt-1">You will see join requests and activity updates here.</p>
            </div>
          ) : (
            notifications.map((notification: any) => {
              const pendingFollowId = getPendingFollowIdForNotification(notification);
              const canRespondInline = isFollowRequestNotification(notification) && !!pendingFollowId;

              return (
              <div
                key={notification.id}
                className={`w-full text-left rounded-2xl border p-4 transition ${
                  notification.is_read
                    ? 'bg-white border-slate-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{notification.description}</p>
                  </div>
                  {!notification.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1" />
                  )}
                </div>
                </button>
                {canRespondInline ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => acceptFollow.mutate(pendingFollowId)}
                      disabled={acceptFollow.isPending || rejectFollow.isPending}
                      className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFollow.mutate(pendingFollowId)}
                      disabled={acceptFollow.isPending || rejectFollow.isPending}
                      className="px-3 py-1.5 text-xs rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
                <p className="text-xs text-slate-500 mt-3">{formatTimeAgo(notification.created_at)}</p>
              </div>
            )})
          )}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
