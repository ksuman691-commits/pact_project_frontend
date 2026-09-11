'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { isAgeVerifiedLocally } from '@/lib/ageVerification';

// Mounted once in the root layout, alongside AuthInitializer — this is the
// single choke point every new user passes through after their first
// successful signup/login, regardless of method (Google, manual
// email/password while it still exists, or any OAuth provider added
// later). It is deliberately NOT wired into the register form or the
// Google button individually: both of those already push to different
// destinations on success (/profile vs /), so gating each entry point
// separately would mean re-doing this for every provider added going
// forward. Watching (user, pathname) globally instead means it applies no
// matter which page a given auth flow happens to land on.
export default function AgeVerificationGate() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized || !user) return;
    if (pathname === '/verify-age') return;

    const isVerified = Boolean(user.date_of_birth) || isAgeVerifiedLocally(user.user_uuid);
    if (!isVerified) {
      router.replace('/verify-age');
    }
  }, [isInitialized, user, pathname, router]);

  return null;
}
