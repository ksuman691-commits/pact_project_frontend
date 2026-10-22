'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { loginHrefForHere } from '@/lib/authNext';

export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (isInitialized && !user) {
      // Come back here after signing in (e.g. a circle link shared on WhatsApp).
      router.push(loginHrefForHere());
    }
  }, [isInitialized, user, router]);

  return { user, isInitialized };
}
