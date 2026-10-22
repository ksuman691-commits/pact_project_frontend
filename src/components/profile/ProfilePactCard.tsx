'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Camera, Check, Globe, Heart, Lock, Play, Users } from 'lucide-react'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'

function localDay(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-CA')
}

function lastPosted(pact: any): string {
  const latest = pact?.latest_proof_upload_date || pact?.recent_proofs?.[0]?.uploaded_at
  const day = localDay(latest)
  if (!day) return 'No moments yet'
  const today = new Date().toLocaleDateString('en-CA')
  if (day === today) return 'Posted today'
  const diff = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000)
  if (diff === 1) return 'Posted yesterday'
  return `Last posted ${diff} days ago`
}

/**
 * A pact on a profile: the latest moment fills a dark tile with the day and
 * title over it, and one line under it says how it's going.
 */
export default function ProfilePactCard({
  pact,
  label,
  postedToday,
  onPost,
}: {
  pact: any
  /** Overrides who-sees-it on the tag (defaults to Public, Followers or the circle's name). */
  label?: string | null
  /** Known from today's moments; overrides the guess from the last upload. */
  postedToday?: boolean
  /** Shows a "Post Day N" button for your own live pacts. */
  onPost?: () => void
}) {
  const [broken, setBroken] = useState(false)
  const total = Number(pact?.duration_days ?? pact?.daysTotal ?? 0)
  const day = Number(pact?.daysCurrent ?? 0)
  // Over when it's closed, or when its last day has passed even if nobody closed it.
  const pastEnd = Boolean(pact?.end_date) && String(pact.end_date).slice(0, 10) < new Date().toLocaleDateString('en-CA')
  const ended = (pact?.status && pact.status !== 'active') || pastEnd
  const locked = Boolean(pact?.media_locked) && pact?.can_view_media === false
  const isPrivate = Boolean(pact?.media_locked)
  // Who sees it, always shown: Public, Followers, or the circle's name.
  const audience =
    label ||
    (pact?.visibility === 'circle_only' || pact?.circle_id
      ? pact?.circle_name || pact?.circle || 'Circle'
      : pact?.visibility === 'private'
        ? 'Followers'
        : 'Public')
  const latest = (pact?.recent_proofs || []).find((p: any) => p?.proof_url || p?.video_url) || null
  const isVideo = latest ? latest.proof_type === 'video' || Boolean(latest.video_url) : pact?.proof_type === 'video'
  const mediaUrl = locked ? null : latest?.video_url || latest?.proof_url || pact?.proof_url || null
  const done = Number(pact?.days_completed ?? 0)
  const outOf = ended ? total : Math.max(1, day)
  const posted = postedToday ?? lastPosted(pact) === 'Posted today'
  const canPost = Boolean(onPost) && !ended
  const badge = ended ? (pact.status === 'completed' || done >= Math.ceil(0.75 * Math.max(1, total)) ? 'Finished' : 'Ended') : total ? `Day ${Math.max(1, day)} of ${total}` : 'Live'

  return (
    <Link href={`/pacts/${pact.id}`} className="block overflow-hidden rounded-[22px]" style={{ background: '#FBF8F1', border: `1px solid ${LINE}` }}>
      <div className="relative h-[168px] overflow-hidden" style={{ background: locked ? 'radial-gradient(120% 90% at 30% 20%, #2A3A6E 0%, #141A2E 55%, #0F1014 100%)' : '#1F2A4A' }}>
        {mediaUrl && !broken && (isVideo ? (
          <video src={`${mediaUrl}#t=0.1`} muted playsInline preload="metadata" onError={() => setBroken(true)} className="absolute inset-0 size-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" onError={() => setBroken(true)} className="absolute inset-0 size-full object-cover" />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]" style={{ background: 'linear-gradient(0deg, rgba(15,16,20,0.78), rgba(15,16,20,0))' }} />
        <div className="absolute left-3 right-14 top-3 flex flex-wrap gap-1.5">
          <span className="flex max-w-full items-center gap-1 truncate rounded-xl px-2.5 py-1 text-[12px] font-extrabold" style={{ background: 'rgba(15,16,20,0.45)', color: '#FFFFFF', backdropFilter: 'blur(6px)' }}>
            {audience === 'Public' ? <Globe className="size-3 shrink-0" strokeWidth={2.6} aria-hidden="true" /> : audience === 'Followers' ? <Heart className="size-3 shrink-0" strokeWidth={2.6} aria-hidden="true" /> : <Users className="size-3 shrink-0" strokeWidth={2.6} aria-hidden="true" />}
            <span className="truncate">{audience}</span>
          </span>
          {isPrivate && (
            <span className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[12px] font-extrabold" style={{ background: '#FFFFFF', color: '#1F3A93' }}>
              <Lock className="size-3" strokeWidth={2.6} aria-hidden="true" />
              {pact?.watch_price ? `Private · ₹${pact.watch_price}` : 'Private'}
            </span>
          )}
        </div>
        {mediaUrl && isVideo && !broken && (
          <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full" style={{ background: 'rgba(15,16,20,0.55)', color: '#FFFFFF' }}>
            <Play className="size-4 fill-current" aria-hidden="true" />
          </span>
        )}
        <div className="absolute inset-x-3.5 bottom-3" style={{ color: '#FFFFFF' }}>
          <span className="rounded-[10px] px-2.5 py-[3px] text-[11.5px] font-extrabold" style={{ background: 'rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
            {badge}
          </span>
          <div className="mt-1.5 line-clamp-2 text-[18px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: '#FFFFFF' }}>
            {pact?.title}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0 truncate text-[13px]" style={{ color: MUTED }}>
          {ended
            ? `${done} of ${total} days posted`
            : canPost && !posted
              ? `${Math.min(done, outOf)} of ${outOf} days so far`
              : `${posted ? 'Posted today' : lastPosted(pact)} · ${Math.min(done, outOf)} of ${outOf} days`}
        </div>
        {canPost && !posted ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onPost?.()
            }}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-extrabold transition active:scale-95"
            style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 6px 16px -6px rgba(31,58,147,0.55)' }}
          >
            <Camera className="size-4" strokeWidth={2.4} aria-hidden="true" />
            Post Day {Math.max(1, day)}
          </button>
        ) : canPost && posted ? (
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-extrabold" style={{ color: '#22663F' }}>
            <Check className="size-4" strokeWidth={2.6} aria-hidden="true" />
            Done today
          </span>
        ) : (
          <span className="shrink-0 text-[13px] font-extrabold" style={{ color: NAVY }}>
            {locked ? 'See' : 'Watch'}
          </span>
        )}
      </div>
    </Link>
  )
}

export function ProfileEmpty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] px-5 py-8 text-center" style={{ background: '#FBF8F1', border: `1px solid ${LINE}` }}>
      <div className="text-[15.5px] font-extrabold" style={{ color: INK }}>{title}</div>
      {text && <div className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-snug" style={{ color: MUTED }}>{text}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
