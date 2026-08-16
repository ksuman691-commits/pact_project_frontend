'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { hasSeenOnboarding } from '@/lib/onboarding'

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) return
    if (user) {
      router.replace('/feed')
      return
    }
    // First-time, signed-out visitors see the onboarding carousel once
    // before landing on register; anyone who's already been through it
    // (flag persists per device) skips straight to register as before.
    router.replace(hasSeenOnboarding() ? '/auth/register' : '/onboarding')
  }, [isInitialized, user, router])

  return null
}
