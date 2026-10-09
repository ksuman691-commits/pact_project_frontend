'use client';

import { useEffect } from 'react';
import { profileTimezoneService } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const SESSION_KEY_PREFIX = 'profile-timezone-sync:';

export default function ProfileTimezoneSync() {
  const userId = useAuthStore((state) => state.user?.id);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized || !userId || typeof window === 'undefined') return;

    const sessionKey = `${SESSION_KEY_PREFIX}${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    // Mark the attempt first so a slow or failing request does not repeat on
    // rerenders. A new browser session gets one fresh sync attempt.
    sessionStorage.setItem(sessionKey, 'attempted');

    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!deviceTimezone) return;

    void profileTimezoneService
      .get()
      .then(({ data }) => {
        if (data.timezone !== deviceTimezone) {
          return profileTimezoneService.update(deviceTimezone);
        }
        return undefined;
      })
      .catch((error: unknown) => {
        console.warn('Could not sync profile timezone:', error);
      });
  }, [isInitialized, userId]);

  return null;
}
