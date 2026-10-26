'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, Heart, MessageCircle, Settings } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import { queryKeys } from '@/lib/queryKeys';
import { notificationService } from '@/services/api';
import { useMarkAllNotificationsAsRead, useNotifications } from '@/hooks/useNotifications';
import { useAcceptFollow, usePendingFollowRequests, useRejectFollow } from '@/hooks/useFollows';
import { RequestsList } from '@/components/requests/RequestsList';
import { useRequestCount } from '@/components/requests/RequestsEntryCard';
import Avatar from '@/components/Avatar';
import { buildRows, rowTarget, shortTime } from '@/lib/notificationView';
import type { NotificationRow, RawNotification } from '@/lib/notificationView';

const isJoinRequestNotification = (notification: any) => {
  const text = `${notification?.title || ''} ${notification?.description || ''}`.toLowerCase();
  return text.includes('join request') || text.includes('wants to join') || text.includes('requested to join');
};

const notificationTarget = (notification: any) => {
  // "Priya says they tipped you ₹51" goes to the creator's confirm screen.
  if (`${notification?.title || ''}`.toLowerCase().includes('says they tipped you')) return '/profile/tips/inbox';
  // "Priya wants to watch your pact" opens the pact with the asks sheet up.
  if (`${notification?.title || ''}`.toLowerCase().includes('wants to watch your pact') && notification.related_pact_id) return `/pacts/${notification.related_pact_id}?watchers=1`;
  if (notification.related_dare_id) return `/dares/${notification.related_dare_id}`;
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

function RowAvatar({ row }: { row: NotificationRow }) {
  const badge =
    row.kind === 'pact_like' || row.kind === 'comment_like' ? (
      <Heart className="size-2.5" strokeWidth={2.6} fill="currentColor" aria-hidden="true" />
    ) : row.kind === 'other' ? null : (
      <MessageCircle className="size-2.5" strokeWidth={2.6} aria-hidden="true" />
    );
  if (row.actors.length === 0) {
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--ink-soft)]">
        <Bell className="size-5" aria-hidden="true" />
      </span>
    );
  }
  const first = row.actors[0];
  const second = row.actors[1];
  return (
    <span className="relative size-11 shrink-0">
      {second ? (
        <>
          <span className="absolute left-0 top-0 rounded-full ring-2 ring-[var(--card)]">
            <Avatar name={second.full_name || second.username} avatarUrl={second.avatar_url} size={28} />
          </span>
          <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--card)]">
            <Avatar name={first.full_name || first.username} avatarUrl={first.avatar_url} size={28} />
          </span>
        </>
      ) : (
        <Avatar name={first.full_name || first.username} avatarUrl={first.avatar_url} size={44} />
      )}
      {badge && !second && (
        <span className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-[var(--navy)] text-white ring-2 ring-[var(--card)]">{badge}</span>
      )}
    </span>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

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
  const requestCount = useRequestCount();
  const [tab, setTab] = useState<'all' | 'requests'>('all');
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'requests') setTab('requests');
  }, []);
  const pendingFollowRequests = pendingFollowRequestsQuery.data?.data || [];

  // New stays New while you are on this page, even after it is read. Marking happens when you leave.
  const [newIds, setNewIds] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    const add = notifications.filter((n: RawNotification) => !n.is_read && !newIds.has(n.id)).map((n: RawNotification) => n.id);
    if (add.length) setNewIds((prev) => new Set([...Array.from(prev), ...add]));
  }, [notifications, newIds]);
  const { fresh, earlier } = useMemo(
    () => buildRows(notifications as RawNotification[], (n) => !n.is_read || newIds.has(n.id)),
    [notifications, newIds],
  );

  // Leaving the page clears the badge. The short delay lets React's dev double-mount cancel it.
  const hasUnread = useRef(false);
  hasUnread.current = unreadCount > 0;
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    return () => {
      leaveTimer.current = window.setTimeout(() => {
        if (!hasUnread.current) return;
        void notificationService.markAllAsRead().finally(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
        });
      }, 60);
    };
  }, [queryClient]);

  const openRow = async (row: NotificationRow) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const unreadIds = row.ids.filter((id) => !notifications.find((n: RawNotification) => n.id === id)?.is_read);
      if (unreadIds.length) {
        await Promise.all(unreadIds.map((id) => notificationService.markAsRead(id).catch(() => null)));
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      }
      router.push(rowTarget(row) ?? notificationTarget(row.source));
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
            <h1 className="text-xl font-bold text-[var(--ink)]">Notifications</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/notifications/preferences"
                aria-label="Notification preferences"
                className="inline-flex items-center justify-center p-2 rounded-full bg-[var(--card-muted)] text-[var(--ink-soft)] hover:bg-[var(--hairline)] transition"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => markAllAsRead.mutate()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full bg-[var(--card-muted)] text-[var(--ink-soft)] hover:bg-[var(--hairline)] transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-3">
          <div className="flex gap-2" role="tablist" aria-label="Notifications">
            {([
              ['all', 'All'],
              ['requests', requestCount ? `Requests · ${requestCount}` : 'Requests'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className="h-10 rounded-full px-4 text-[14px] font-bold"
                style={tab === id ? { background: '#17181D', color: '#FFFFFF', border: '1px solid #17181D' } : { background: 'var(--card)', color: '#17181D', border: '1px solid var(--hairline)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'requests' ? (
          <div className="px-4 pb-4">
            <RequestsList />
          </div>
        ) : (
        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="text-[var(--muted)] text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--hairline)] bg-[var(--card)] p-8 text-center">
              <Bell className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
              <p className="font-semibold text-[var(--ink)]">No notifications yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">You will see join requests and activity updates here.</p>
            </div>
          ) : (
            <div className="-mx-1 space-y-3">
              {([['NEW', fresh], ['EARLIER', earlier]] as const).map(([label, rows]) =>
                rows.length === 0 ? null : (
                  <section key={label} aria-label={label === 'NEW' ? 'New notifications' : 'Earlier notifications'}>
                    <div className="px-2 pb-1 pt-2 text-[12px] font-extrabold tracking-[0.08em] text-[var(--muted)]">
                      {label === 'NEW' ? `NEW · ${rows.length}` : 'EARLIER'}
                    </div>
                    <div className="overflow-hidden rounded-[22px] border border-[var(--hairline)] bg-[var(--card)]">
                      {rows.map((row, index) => {
                        const pendingFollowId = getPendingFollowIdForNotification(row.source);
                        const canRespondInline = isFollowRequestNotification(row.source) && !!pendingFollowId;
                        const wantsReview = row.kind === 'other' && String(row.source.title || '').toLowerCase().includes('wants to watch your pact');
                        return (
                          <div key={row.key} className={`px-4 py-3 ${index > 0 ? 'border-t border-[var(--hairline)]' : ''}`}>
                            <div className="flex items-start gap-3">
                              <button type="button" onClick={() => void openRow(row)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                                <RowAvatar row={row} />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[14.5px] leading-[1.4] text-[var(--ink)]">
                                    {row.kind === 'other' ? (
                                      <>
                                        <b>{row.source.title}</b>
                                        {row.source.description ? <span className="text-[var(--muted)]"> {row.source.description}</span> : null}
                                      </>
                                    ) : (
                                      <>
                                        <b>{row.names}</b> {row.verb}
                                        {row.pactTitle ? <> <b>{row.pactTitle}</b></> : null}
                                        {row.tail ? <span className="text-[var(--muted)]">: {row.tail}</span> : null}
                                      </>
                                    )}
                                  </span>
                                  <span className="mt-0.5 block text-[12.5px] text-[var(--muted)]">{shortTime(row.createdAt)}</span>
                                </span>
                              </button>
                              {row.unread && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[var(--navy)]" aria-label="Unread" />}
                            </div>
                            {canRespondInline ? (
                              <div className="ml-14 mt-2 flex gap-2">
                                <button onClick={() => acceptFollow.mutate(pendingFollowId)} disabled={acceptFollow.isPending || rejectFollow.isPending} className="h-9 rounded-full bg-[var(--navy)] px-4 text-[13px] font-bold text-white disabled:opacity-60">
                                  Accept
                                </button>
                                <button onClick={() => rejectFollow.mutate(pendingFollowId)} disabled={acceptFollow.isPending || rejectFollow.isPending} className="h-9 rounded-full border border-[var(--hairline)] px-4 text-[13px] font-bold text-[var(--ink)] disabled:opacity-60">
                                  Decline
                                </button>
                              </div>
                            ) : null}
                            {wantsReview ? (
                              <div className="ml-14 mt-2">
                                <button onClick={() => void openRow(row)} className="h-9 rounded-full bg-[var(--ink)] px-4 text-[13px] font-bold text-white">
                                  Review Payment
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ),
              )}
            </div>
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
        )}
      </div>
    </>
  );
}
