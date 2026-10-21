'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { socialService } from '@/services/api'

interface LikeButtonProps {
  pactId: number
  count?: number
  liked?: boolean
  /** 'stage' = round action over a photo/video; same look the cheer button had. */
  className?: string
}

/**
 * Heart like for a pact. Toggles instantly, reverts if the server rejects it.
 * Replaces the old camera-based cheer on the pact detail page and moment viewer.
 */
export default function LikeButton({ pactId, count = 0, liked: initialLiked = false, className = '' }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(count)
  const inFlight = useRef(false)

  useEffect(() => {
    setLiked(initialLiked)
    setLikeCount(count)
  }, [initialLiked, count, pactId])

  const toggle = async () => {
    if (inFlight.current) return
    inFlight.current = true
    const was = liked
    setLiked(!was)
    setLikeCount((c) => Math.max(0, c + (was ? -1 : 1)))
    try {
      const response: any = was ? await socialService.unlikePact(pactId) : await socialService.likePact(pactId)
      const server = response?.data
      if (server && typeof server.like_count === 'number') {
        setLikeCount(server.like_count)
        setLiked(Boolean(server.liked))
      }
    } catch {
      setLiked(was)
      setLikeCount((c) => Math.max(0, c + (was ? 1 : -1)))
    } finally {
      inFlight.current = false
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={liked ? 'Unlike this pact' : 'Like this pact'}
      aria-pressed={liked}
      className={`flex size-12 flex-col items-center justify-center rounded-full bg-[var(--card)] text-[var(--navy)] shadow-lg transition active:scale-95 ${className}`}
    >
      <Heart className="size-[18px]" strokeWidth={1.9} fill={liked ? 'var(--navy)' : 'none'} />
      <span className="text-[11px] font-bold leading-none text-[var(--ink)]">{likeCount}</span>
    </button>
  )
}
