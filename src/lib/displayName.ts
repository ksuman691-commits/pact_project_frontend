import { useAuthStore } from '@/store/auth';

/** Returns the product label for the authenticated viewer when IDs match. */
export function getDisplayName(userId: number | string | null | undefined, name?: string | null): string {
  const currentUserId = useAuthStore.getState().user?.id;
  return currentUserId != null && userId != null && String(currentUserId) === String(userId)
    ? 'You'
    : name || 'Anonymous';
}
