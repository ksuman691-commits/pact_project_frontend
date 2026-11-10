'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

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
    // Edit profile stays open so someone who doesn't agree can still delete their account.
    if (pathname === '/consent' || pathname === '/terms' || pathname === '/privacy' || pathname === '/profile/edit') return;

    // Remember where they were going (a circle or pact invite) so these steps don't lose it.
    const here = `${window.location.pathname}${window.location.search}`;
    const generic = ['/', '/feed', '/profile', '/onboarding', '/verify-age'].includes(window.location.pathname);

    // First: the current Terms and Privacy Policy must be accepted (DPDP consent). Existing
    // accounts and anyone who accepted an older version land on /consent once.
    if (user.needs_consent) {
      router.replace(generic ? '/consent' : `/consent?next=${encodeURIComponent(here)}`);
      return;
    }
    if (pathname === '/verify-age') return;

    // Only a date of birth the backend returned counts; a local flag can
    // disagree with the backend, which then rejects every create call.
    if (!user.date_of_birth) {
      router.replace(generic ? '/verify-age' : `/verify-age?next=${encodeURIComponent(here)}`);
    }
  }, [isInitialized, user, pathname, router]);

  return null;
}
