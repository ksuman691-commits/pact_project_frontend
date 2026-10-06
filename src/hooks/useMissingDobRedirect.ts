'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { clearAgeVerifiedLocally, isMissingDateOfBirthError } from '@/lib/ageVerification';

/**
 * For mutation onError handlers: when the backend says the account has no
 * date of birth, drop any local "verified" state and send the person to
 * /verify-age so the date is submitted to the backend. Returns true when it
 * redirected.
 */
export function useMissingDobRedirect() {
  const router = useRouter();

  return useCallback(
    (error: any): boolean => {
      if (!isMissingDateOfBirthError(error)) return false;

      const { user, setUser } = useAuthStore.getState();
      clearAgeVerifiedLocally(user?.user_uuid);
      // A date held only in memory (set by the old local-only fallback)
      // would make /verify-age bounce straight back to the feed.
      if (user?.date_of_birth) setUser({ ...user, date_of_birth: null });
      router.push('/verify-age');
      return true;
    },
    [router],
  );
}
