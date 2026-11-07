'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Landing from '@/components/landing/Landing'

export default function HomePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  // Someone with a saved session is probably signed in: show nothing until
  // we know, instead of flashing the landing page before the feed.
  const [maybeSignedIn, setMaybeSignedIn] = useState(true)

  useEffect(() => {
    try {
      setMaybeSignedIn(!!localStorage.getItem('access_token'))
    } catch {
      setMaybeSignedIn(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && user) router.replace('/feed')
  }, [isInitialized, user, router])

  if (user || (maybeSignedIn && !isInitialized)) return null
  return <Landing />
}
