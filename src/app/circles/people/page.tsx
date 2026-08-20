'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import DetailPageHeader from '@/components/DetailPageHeader';
import UserAvatarLink from '@/components/UserAvatarLink';
import LogoSpinner from '@/components/LogoSpinner';
import { useCircles } from '@/hooks/useCircles';
import { circleJoinRequestService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';

/**
 * "People" behind the Circles landing page stat — everyone the viewer
 * shares a circle with, deduped across circles. There's no dedicated
 * cross-circle people endpoint, so this fans out one members request per
 * circle the viewer belongs to (same request CircleCard already makes per
 * circle card) and merges the results client-side.
 */
export default function CirclesPeoplePage() {
  const { user } = useAuthStore();
  const circlesQuery = useCircles();
  const circles = (circlesQuery.data || []) as any[];

  const memberQueries = useQueries({
    queries: circles.map((circle) => ({
      queryKey: queryKeys.circles.members(circle.id),
      queryFn: async () => {
        const response = await circleJoinRequestService.listMembers(circle.id);
        return response.data;
      },
      enabled: !!circle.id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isLoading = circlesQuery.isLoading || (circles.length > 0 && memberQueries.some((q) => q.isLoading));

  const people = useMemo(() => {
    const byUserId = new Map<number, { user_id: number; username?: string; full_name?: string; avatar_url?: string; circles: string[] }>();
    circles.forEach((circle, index) => {
      const members = (memberQueries[index]?.data || []) as any[];
      members.forEach((member) => {
        if (member.user_id === user?.id) return; // exclude yourself
        const existing = byUserId.get(member.user_id);
        if (existing) {
          existing.circles.push(circle.name);
        } else {
          byUserId.set(member.user_id, {
            user_id: member.user_id,
            username: member.username,
            full_name: member.full_name,
            avatar_url: member.avatar_url,
            circles: [circle.name],
          });
        }
      });
    });
    return Array.from(byUserId.values()).sort((a, b) =>
      (a.full_name || a.username || '').localeCompare(b.full_name || b.username || ''),
    );
  }, [circles, memberQueries, user?.id]);

  return (
    <main className="min-h-screen bg-[var(--pact-bg)] pb-28 text-[var(--pact-text)]">
      <DetailPageHeader title="People" backHref="/circles" maxWidthClassName="max-w-2xl" />
      <div className="mx-auto max-w-2xl px-5 pb-10 pt-6 md:px-10">
        <p className="text-sm text-[var(--pact-text-muted)]">
          Everyone across your circles — {people.length} {people.length === 1 ? 'person' : 'people'}.
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <LogoSpinner size={28} color="var(--pact-violet)" />
          </div>
        )}

        {!isLoading && people.length === 0 && (
          <div
            className="mt-6 rounded-[28px] py-12 text-center"
            style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
          >
            <p className="text-[var(--pact-text-dim)]">
              No one else in your circles yet. Invite someone to get started.
            </p>
          </div>
        )}

        {!isLoading && people.length > 0 && (
          <div className="mt-4">
            {people.map((person) => (
              <div
                key={person.user_id}
                className="flex items-center gap-3 border-t border-[var(--pact-hairline)] py-4 first:border-t-0"
              >
                <UserAvatarLink
                  name={person.full_name || person.username}
                  avatarUrl={person.avatar_url}
                  username={person.username}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--pact-text)]">{person.full_name || person.username}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--pact-text-muted)]">
                    {person.circles.length > 1 ? 'Circles: ' : 'Circle: '}
                    {person.circles.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
