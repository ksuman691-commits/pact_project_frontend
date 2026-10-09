'use client'

import Link from 'next/link'
import { Check, Video } from 'lucide-react'
import { STORIES_COMING_SOON } from '@/lib/stories'

interface PostStoryButtonProps {
  size: number
  posted?: boolean
  comingSoon?: boolean
  label?: string
  onClick?: () => void
  /** When posted, the circle links here instead of acting as a button. */
  postedHref?: string
  onPostedClick?: () => void
}

/** The one story action. Always a circle, flat navy, cream label. */
export default function PostStoryButton({ size, posted, comingSoon, label = "Post today's story", onClick, postedHref, onPostedClick }: PostStoryButtonProps) {
  const big = size >= 140
  const iconSize = big ? 26 : size >= 88 ? 18 : 16
  const textSize = big ? 17 : size >= 88 ? 12 : 11
  const base = 'flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-full text-center font-semibold leading-tight transition'
  const style = { width: size, height: size, fontSize: textSize, padding: big ? 24 : 10 }

  if (posted) {
    const content = (
      <>
        <Check style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} aria-hidden="true" />
        <span>Posted</span>
      </>
    )
    const postedStyle = { ...style, border: '3px solid var(--navy)', background: 'var(--card)', color: 'var(--navy)' }
    if (postedHref) {
      return (
        <Link href={postedHref} className={base} style={postedStyle} aria-label="Today's story is posted. Open the pact">
          {content}
        </Link>
      )
    }
    return (
      <button type="button" onClick={onPostedClick} className={base} style={postedStyle} aria-label="Today's story is posted. Watch it">
        {content}
      </button>
    )
  }

  if (comingSoon) {
    return (
      <div
        role="note"
        className={base}
        style={{ ...style, border: '1.5px dashed var(--seat-border)', background: 'var(--card-muted)', color: 'var(--muted)' }}
      >
        <Video style={{ width: iconSize, height: iconSize }} strokeWidth={2} aria-hidden="true" />
        <span>{STORIES_COMING_SOON}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} hover:bg-[var(--navy-hover)] active:scale-[0.97]`}
      style={{ ...style, background: 'var(--navy)', color: '#fff' }}
    >
      <Video style={{ width: iconSize, height: iconSize }} strokeWidth={2} aria-hidden="true" />
      <span className="text-balance">{label}</span>
    </button>
  )
}
