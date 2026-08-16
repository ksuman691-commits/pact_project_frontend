'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import { useAuthStore } from '@/store/auth';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Guards direct navigation to /onboarding (e.g. a bookmarked link, or the
  // browser back button) by an already-signed-in visitor — the carousel is
  // only meant to precede registration, so bounce straight to the feed
  // instead of letting them re-run it and land back on /auth/register.
  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/feed');
    }
  }, [isInitialized, user, router]);

  return <OnboardingCarousel />;
}
