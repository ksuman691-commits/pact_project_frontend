'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Home and Feed are now the same page - redirect to /feed
    router.push('/feed')
  }, [router])

  return null
}
