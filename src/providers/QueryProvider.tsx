'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { retryBackoff, retryTransient } from '@/lib/transient';

// Root cause of the "photos stop loading" reports: every photo/avatar URL
// the backend returns is a presigned S3 GET URL that expires after exactly
// 3600s (app/core/config.py: s3_presigned_url_expiry_seconds, consumed by
// storage.generate_presigned_get_url in the backend repo). React Query was
// only refetching pact/feed data on mount or window focus, so any tab left
// open (foregrounded, no remount) for over an hour keeps serving the same
// now-expired URLs from cache — every <img> for that data silently 403s
// with no retry, since nothing here was ever refetching on a timer.
// refetchInterval below re-pulls fresh presigned URLs well before the
// 1-hour TTL lapses. Per-hook staleTime overrides (e.g. usePacts.ts) still
// control when data is considered "stale" for other purposes; this timer
// is a floor that applies everywhere unless a hook opts out.
const PRESIGNED_URL_TTL_MS = 1000 * 60 * 60; // matches backend default (3600s)
const IMAGE_REFRESH_MARGIN_MS = 1000 * 60 * 20; // refetch this long before expiry

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchInterval: PRESIGNED_URL_TTL_MS - IMAGE_REFRESH_MARGIN_MS,
      // Ride out a slow server start or a flaky connection instead of showing an error;
      // a real answer (4xx) fails straight away. Hooks can still set their own.
      // A server waking from sleep answers 429 at once for about a minute, so a few
      // quick retries aren't enough: 8 tries with backoff cover roughly 50 s.
      retry: retryTransient(8),
      retryDelay: retryBackoff,
    },
  },
});

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
