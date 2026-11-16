import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

/** Parts of the app the team can pause from the console. */
export type Feature = 'signups' | 'dares' | 'dare_money' | 'paid' | 'moments' | 'comments' | 'circles' | 'discover';

export interface AppStatus {
  switches: Partial<Record<Feature, boolean>>;
  messages: Partial<Record<Feature, string>>;
  banner: string | null;
}

export const APP_STATUS_KEY = ['app-status'] as const;

/** What's switched on, and the banner. Refreshed every few minutes and when the server says something is paused. */
export function useAppStatus() {
  return useQuery<AppStatus>({
    queryKey: APP_STATUS_KEY,
    queryFn: () => api.get('/api/app/status', { timeout: 8000 }).then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

/** Null when the feature is on (or we don't know yet); otherwise the short "paused" note to show. */
export function usePaused(feature: Feature): string | null {
  const { data } = useAppStatus();
  if (!data || data.switches[feature] !== false) return null;
  return data.messages[feature] ?? 'This is paused for a bit.';
}
