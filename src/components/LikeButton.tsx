'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { socialService } from '@/services/api'

interface LikeButtonProps {
  pactId: number
  count?: number
  liked?: boolean
  /** 'stage' (default) = round button over media; 'row' = heart and count in a card's action row. */
  variant?: 'stage' | 'row'
  className?: string
}

/**
 * Heart like for a pact. Toggles instantly, reverts if the server rejects it.
 * Replaces the old camera-based cheer on the pact detail page and moment viewer.
 */
export default function LikeButton({ pactId, count = 0, liked: initialLiked = false, variant = 'stage', className = '' }: LikeButtonProps) {
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

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={liked ? 'Unlike this pact' : 'Like this pact'}
        aria-pressed={liked}
        className={`flex h-11 items-center gap-1.5 px-2 text-[14px] font-extrabold transition active:scale-95 ${liked ? 'text-[var(--navy)]' : 'text-[var(--ink)]'} ${className}`}
      >
        <Heart className="h-6 w-6" strokeWidth={2} fill={liked ? 'var(--navy)' : 'none'} />
        {likeCount > 0 && likeCount}
      </button>
    )
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
