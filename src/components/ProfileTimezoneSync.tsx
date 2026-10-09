'use client';

import { useEffect } from 'react';
import { useSyncProfileTimezone } from '@/hooks/useProfileTimezone';
import { useAuthStore } from '@/store/auth';

const SESSION_KEY_PREFIX = 'profile-timezone-sync:';

export default function ProfileTimezoneSync() {
  const userId = useAuthStore((state) => state.user?.id);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const { mutate: syncTimezone } = useSyncProfileTimezone();

  useEffect(() => {
    if (!isInitialized || !userId || typeof window === 'undefined') return;

    const sessionKey = `${SESSION_KEY_PREFIX}${userId}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      // Mark the attempt first so a slow or failing request does not repeat on
      // rerenders. A new browser session gets one fresh sync attempt.
      sessionStorage.setItem(sessionKey, 'attempted');
    } catch (error) {
      console.warn('Could not start profile timezone sync:', error);
      return;
    }

    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!deviceTimezone) return;

    syncTimezone(deviceTimezone, {
      onError: (error) => console.warn('Could not sync profile timezone:', error),
    });
  }, [isInitialized, userId, syncTimezone]);

  return null;
}
