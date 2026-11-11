'use client';

import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '@/components/PullToRefresh';

/** Fired on every pull, for the few things on a page that don't load through React Query. */
export const APP_REFRESH_EVENT = 'cp:refresh';

/**
 * Pull down at the top of any signed-in page to refresh it. Whatever the page
 * is showing is asked for again; the CirclePact mark closes as you pull and
 * ticks round while it loads. Off on sign-in, onboarding and the create flows,
 * where a pull would only get in the way of typing.
 */
export default function AppPullToRefresh({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const queryClient = useQueryClient();
  const off =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/verify-age' ||
    pathname === '/consent' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname.endsWith('/create') ||
    pathname.endsWith('/wall') ||
    pathname.endsWith('/public');

  return (
    <PullToRefresh
      disabled={off}
      onRefresh={() => {
        window.dispatchEvent(new Event(APP_REFRESH_EVENT));
        return queryClient.refetchQueries({ type: 'active' });
      }}
    >
      {children}
    </PullToRefresh>
  );
}
