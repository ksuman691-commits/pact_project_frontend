'use client'

import Image from 'next/image'
import AutoPlayVideo from '@/components/media/AutoPlayVideo'
import { cleanTitle } from '@/lib/titleCase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, ChevronLeft, Globe, Heart, Image as ImageIcon, Lock, MessageCircle, Play, RotateCcw, Share, Share2, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import LockedMedia from '@/components/private/LockedMedia'
import WatchersSheet from '@/components/private/WatchersSheet'
import { useWatchers } from '@/hooks/usePactAccess'
import { joinRequestService } from '@/services/api'
import LikeButton from '@/components/LikeButton'
import TipButton from '@/components/tips/TipButton'
import { useMyTipSettings } from '@/hooks/useTips'
import { useSmartBack } from '@/hooks/useSmartBack'
import { pactLocalToday, resolvePactCompletionViewState } from '@/lib/pactCompletionState'
import { PactAudienceLine, PactAudienceSheet, useAudience } from '@/components/pacts/PactAudience'
import MomentViewer from '@/components/MomentViewer'
import type { ViewerMoment } from '@/components/MomentViewer'
import type { PactDayStripEntry } from '@/types'

type Moment = ViewerMoment & { userId?: number | string }

type Props = {
  pact: any
  moments: Moment[]
  participants: any[]
  progress: { completed: number; total: number; missed: number } | null
  isEnded: boolean
  onInvite: () => void
  onAddMoment: () => void
  onRestart: () => void
  onShareRecap: () => void
  onComment: (aboveViewer?: boolean) => void
  viewerId?: number | string
  isParticipant: boolean
  canJoin: boolean
  joinBlockReason?: string | null
  isJoining?: boolean
  onJoin: () => void
  onStartOwnVersion: () => void
}

function SafePhoto({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <span aria-hidden="true" className={`block bg-[var(--paper)] ${className}`} />
  ) : (
    <Image src={src} alt={alt} fill unoptimized onError={() => setFailed(true)} className={className} />
  )
}

export default function PactMomentsDetail({
  pact,
  moments,
  participants,
  progress,
  isEnded,
  onInvite,
  onAddMoment,
  onRestart,
  onShareRecap,
  onComment,
  viewerId,
  isParticipant,
  canJoin,
  joinBlockReason,
  isJoining = false,
  onJoin,
  onStartOwnVersion,
}: Props) {
  const smartBack = useSmartBack('/feed')
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMomentId, setSelectedMomentId] = useState<number | string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [watchingRecap, setWatchingRecap] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const selectedTileRef = useRef<HTMLButtonElement>(null)
  const fallbackCompleted = progress?.completed || 0
  const completionView = resolvePactCompletionViewState(pact, new Date(), fallbackCompleted)
  const completionLooksSuccessful = completionView === 'completed' || completionView === 'provisional_completed'
  const presentationEnded = completionView !== null
  const visualDayEnded = presentationEnded || isEnded
  // The backend strip only knows the creator's moments. Fill days from the
  // moments list we are already showing, so a member's own moment (or anyone's)
  // gets a real thumbnail instead of an empty tile.
  const strip = Array.isArray(pact?.day_strip)
    ? (pact.day_strip as (PactDayStripEntry & { video_url?: string | null })[]).map((entry) => {
        if (entry.has_moment) return entry
        const match = moments.find((m) => m.day === entry.day && m.url)
        if (!match) return entry
        const isVideo = match.type === 'video'
        return { ...entry, has_moment: true, type: isVideo ? 'video' : 'photo', video_url: isVideo ? match.url : null, thumbnail_url: isVideo ? null : match.url } as PactDayStripEntry & { video_url?: string | null }
      })
    : null
  const total = Math.max(1, Number(strip ? pact?.duration_days ?? progress?.total ?? 7 : progress?.total ?? 7))
  const completed = Math.min(total, Number(pact?.days_completed ?? fallbackCompleted))
  const missed = progress?.missed || 0
  const localToday = (() => {
    try {
      return pactLocalToday(pact)
    } catch {
      return new Date().toISOString().slice(0, 10)
    }
  })()
  const currentDay = strip && pact?.start_date
    ? Math.min(total, Math.max(1, Math.floor((Date.parse(`${localToday}T00:00:00Z`) - Date.parse(`${pact.start_date}T00:00:00Z`)) / 86400000) + 1))
    : Math.min(total, completed + missed + 1)
  const day = presentationEnded ? total : currentDay
  const percent = total ? Math.round((completed / total) * 100) : 0
  const daysLeft = Math.max(0, total - currentDay)
  const dayLabel = presentationEnded ? 'Ended' : daysLeft === 0 ? 'Last day' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go`
  const recapMoments = [...moments].sort((left, right) => {
    const leftDay = left.day ?? 0
    const rightDay = right.day ?? 0
    if (leftDay !== rightDay) return leftDay - rightDay
    return new Date(left.uploadedAt || 0).getTime() - new Date(right.uploadedAt || 0).getTime()
  })
  const displayMoments = completionLooksSuccessful && watchingRecap ? recapMoments : moments
  const orderedMoments = useMemo(() => [...moments].sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime()), [moments])
  const hasMoments = displayMoments.length > 0
  const effectiveDay = selectedDay ?? currentDay
  // A day opens on its first moment, so swiping forward goes through it in order.
  const dayMoment = (displayMoments === moments ? orderedMoments : displayMoments).find((moment) => moment.day === effectiveDay)
  const current = displayMoments.find((moment) => moment.id === selectedMomentId) || dayMoment || displayMoments[activeIndex] || displayMoments[0]
  // Every moment of the day on screen, oldest first; the dots on the card follow these.
  const currentDayMoments = current?.day != null ? orderedMoments.filter((moment) => moment.day === current.day) : []
  const positionInDay = Math.max(0, currentDayMoments.findIndex((moment) => moment.id === current?.id))
  const momentsPerDay = useMemo(() => {
    const counts = new Map<number, number>()
    moments.forEach((moment) => {
      if (moment.day != null) counts.set(moment.day, (counts.get(moment.day) || 0) + 1)
    })
    return counts
  }, [moments])
  // Swiping the card steps through every moment in order, into the next or previous day.
  const stepMoment = (delta: number) => {
    if (!current) return
    const index = orderedMoments.findIndex((moment) => moment.id === current.id)
    const next = orderedMoments[index + delta]
    if (!next) return
    setSelectedMomentId(next.id)
    if (next.day != null) setSelectedDay(next.day)
  }
  const swipeRef = useRef<{ x: number; y: number; at: number } | null>(null)
  const lastSwipeAt = useRef(0)
  const momentAgo = (() => {
    if (!current?.day) return null
    const diff = currentDay - current.day
    return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`
  })()
  const caption = current?.description || (current?.day && current.day !== currentDay ? (momentAgo === 'Yesterday' ? "Yesterday's moment" : `Moment from ${momentAgo}`) : "Today's moment")
  // Under the name on the photo: "Today", "Yesterday" or "3 days ago", plus the time when it's today.
  const momentWhen = (() => {
    if (!current) return ''
    const at = current.uploadedAt ? new Date(current.uploadedAt) : null
    const time = at && !Number.isNaN(at.getTime()) ? at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : null
    if (momentAgo === 'Today' || !momentAgo) return time ? `Today · ${time}` : 'Today'
    return momentAgo
  })()
  const sharePact = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/pacts/${pact?.id}` : ''
    const title = cleanTitle(pact?.title)
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} on CirclePact`, url })
        return
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }
  const postedToday = moments.some((m) => m.day === currentDay && viewerId != null && String(m.userId ?? '') === String(viewerId))
  // No made-up emoji in front of titles; old pacts that typed one keep it.
  const showModernStrip = strip !== null
  const requiredDays = Number(pact?.days_required || 0)
  const isMoments75 = pact?.completion_rule === 'moments_75' && requiredDays > 0
  const joinMessage: Record<string, string> = {
    unauthenticated: 'Sign in to join this pact',
    creator: 'You created this pact',
    already_joined: 'You are already in this pact',
    not_active: 'Joining is closed',
    full: 'This pact is full',
    request_required: 'This pact is private. The creator picks who joins.',
  }

  const creatorId = pact?.creator_id ?? null
  const isCreatorView = viewerId != null && creatorId != null && String(viewerId) === String(creatorId)
  const creatorName = String(pact?.creator_full_name || pact?.creator_username || 'the creator')
  const myTips = useMyTipSettings(isCreatorView)
  const showTurnOnTips = isCreatorView && myTips.data != null && !myTips.data.enabled
  // Private pact tier: the server already stripped the media; show the ask instead.
  const lockedForMe = Boolean(pact?.media_locked) && pact?.can_view_media === false
  const [watchersOpen, setWatchersOpen] = useState(false)
  const watchers = useWatchers(Number(pact?.id), isCreatorView && Boolean(pact?.media_locked))
  const pendingAsks = Array.isArray((watchers.data as any)?.pending) ? (watchers.data as any).pending.length : 0
  const [audienceOpen, setAudienceOpen] = useState(false)
  const audience = useAudience({ pact, participants, moments, currentDay, viewerId, isCreatorView, creatorName })
  const [joinAsked, setJoinAsked] = useState(false)
  useEffect(() => {
    // Notifications open the pact with ?watchers=1 so the creator lands on the asks.
    if (isCreatorView && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('watchers') === '1') setWatchersOpen(true)
  }, [isCreatorView])
  const askToJoin = async () => {
    try {
      await joinRequestService.sendRequest(Number(pact?.id))
      setJoinAsked(true)
      toast.success('Asked to join')
    } catch {
      toast.error("Couldn't send that. Try again.")
    }
  }

  useEffect(() => {
    const container = stripRef.current
    const tile = selectedTileRef.current
    if (!container || !tile) return
    const containerRect = container.getBoundingClientRect()
    const tileRect = tile.getBoundingClientRect()
    const target = container.scrollLeft + tileRect.left - containerRect.left - (container.clientWidth - tileRect.width) / 2
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [effectiveDay, strip])

  const openViewer = () => {
    if (!current || !orderedMoments.length) return
    const index = Math.max(0, orderedMoments.findIndex((moment) => moment.id === current.id))
    setActiveIndex(index)
    setViewerOpen(true)
  }

  const selectDay = (entry: (PactDayStripEntry & { video_url?: string | null })) => {
    setSelectedDay(entry.day)
    const first = orderedMoments.find((moment) => moment.day === entry.day)
    const index = first ? displayMoments.findIndex((moment) => moment.id === first.id) : -1
    if (first && index >= 0) {
      setActiveIndex(index)
      setSelectedMomentId(first.id)
    }
  }

  return (
    <main className="flex min-h-[calc(100dvh-72px)] flex-col bg-[var(--paper)] px-4 pb-3 pt-2 text-[var(--ink)]">
      {/* pb-24: clearance for the floating BottomNav. The media card takes whatever height is left. */}
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col gap-2 pb-24">
        <div className="shrink-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <button type="button" onClick={smartBack} aria-label="Go back" className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--ink)]">
              <ChevronLeft className="size-6" strokeWidth={2} aria-hidden="true" />
            </button>
            {pact?.media_locked ? (
              <span className="flex h-7 items-center gap-1.5 rounded-full pl-2 pr-2.5 text-[12px] font-extrabold" style={{ background: '#E8ECF7', color: '#1F3A93' }}>
                <Lock className="size-[13px]" strokeWidth={2.4} aria-hidden="true" />
                {pact?.watch_price ? `Private · ₹${pact.watch_price}` : 'Private'}
              </span>
            ) : pact?.circle_id != null ? (
              <span className="flex h-7 items-center gap-1.5 rounded-full pl-2 pr-2.5 text-[12px] font-extrabold" style={{ background: '#17181D', color: '#FFFFFF' }}>
                <Users className="size-[13px]" strokeWidth={2.4} aria-hidden="true" />
                Circle only
              </span>
            ) : (
              <span className="flex h-7 items-center gap-1.5 rounded-full pl-2 pr-2.5 text-[12px] font-extrabold" style={{ background: 'var(--card)', border: '1px solid var(--hairline)', color: 'var(--ink)' }}>
                {pact?.visibility === 'private' ? <Heart className="size-[13px]" strokeWidth={2.4} aria-hidden="true" /> : <Globe className="size-[13px]" strokeWidth={2.4} aria-hidden="true" />}
                {pact?.visibility === 'private' ? 'Followers' : 'Public'}
              </span>
            )}
            <span className="flex h-7 items-center rounded-full px-2.5 text-[12px] font-bold" style={{ background: 'var(--card)', border: '1px solid var(--hairline)', color: 'var(--ink)' }}>
              {pact?.proof_submission_frequency === 'weekly' ? 'Every week' : 'Every day'} · {total} days
            </span>
            {/* The action row under the media carries Tip; the header only does when that row is hidden. */}
            {!isCreatorView && !(!presentationEnded && !lockedForMe && (hasMoments || isParticipant)) && (
              <TipButton creatorId={creatorId} creatorName={creatorName} creatorAvatarUrl={pact?.creator_avatar_url} context={pact?.title} pactId={Number(pact?.id)} tipsEnabled={typeof pact?.creator_tips_enabled === 'boolean' ? pact.creator_tips_enabled : undefined} locked={Boolean(pact?.media_locked)} className="ml-auto !h-8 !px-3 !text-[13px]" />
            )}
          </div>
          <h1 className="mt-0.5 line-clamp-2 font-sans text-[19px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--ink)]">
            {cleanTitle(pact?.title)}
          </h1>
        </div>

        {(() => {
          const dayCount = !presentationEnded ? (
            <div className="shrink-0 text-right leading-[1.25]">
              <h2 className="flex items-center justify-end gap-1 whitespace-nowrap text-[14px] font-extrabold">
                {isParticipant && !isEnded && postedToday && <Check className="size-3.5" strokeWidth={3} style={{ color: '#22663F' }} aria-label={`Day ${currentDay} done`} />}
                Day {day} of {total}
              </h2>
              <p className="whitespace-nowrap text-[11.5px] font-semibold text-[var(--muted)]">
                {isMoments75 ? `${completed} of ${requiredDays} needed` : dayLabel}
              </p>
            </div>
          ) : null
          return showModernStrip ? (
            <div className="flex shrink-0 items-center gap-2">
              <div ref={stripRef} className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-0.5 py-1 scrollbar-hide" aria-label="Pact day strip">
                {strip.map((entry) => {
                  const isToday = !visualDayEnded && entry.date === localToday
                  const isPast = entry.date < localToday
                  const isSelected = effectiveDay === entry.day
                  const isMissed = !entry.has_moment && isPast
                  const isFuture = !entry.has_moment && !isPast && !isToday
                  const videoUrl = entry.video_url || undefined
                  return (
                    <button
                      key={entry.day}
                      ref={isSelected ? selectedTileRef : undefined}
                      type="button"
                      aria-label={`Day ${entry.day}${entry.has_moment ? `, ${(momentsPerDay.get(entry.day) || 0) > 1 ? `${momentsPerDay.get(entry.day)} moments` : entry.type === 'video' ? 'video' : 'photo'}` : isToday ? ', today' : isMissed ? ', no post' : ', upcoming'}`}
                      aria-pressed={isSelected}
                      onClick={() => selectDay(entry)}
                      disabled={!entry.has_moment}
                      className={`relative size-[34px] shrink-0 overflow-hidden rounded-[9px] transition-transform active:scale-95 ${entry.has_moment ? 'cursor-pointer bg-[var(--navy)]' : isMissed ? 'border border-[var(--hairline)] bg-[var(--card)]' : 'bg-[var(--card-muted)]'} ${isToday && !entry.has_moment ? 'ring-2 ring-[var(--navy)]' : ''} ${isFuture ? 'border border-dashed border-[var(--seat-border)]' : ''} ${isSelected && entry.has_moment ? 'ring-2 ring-[var(--navy)]' : ''}`}
                    >
                      {entry.has_moment && entry.type === 'photo' && entry.thumbnail_url ? (
                        <SafePhoto src={entry.thumbnail_url!} className="size-full object-cover" />
                      ) : entry.has_moment && entry.type === 'video' && videoUrl ? (
                        <video src={`${videoUrl}#t=0.1`} muted playsInline preload="auto" className="size-full object-cover" />
                      ) : null}
                      {(momentsPerDay.get(entry.day) || 0) > 1 && (
                        <span className="absolute right-0 top-0 z-10 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-black/60 px-0.5 text-[8.5px] font-extrabold text-white" aria-hidden="true">
                          {momentsPerDay.get(entry.day)}
                        </span>
                      )}
                      <span className={`absolute inset-0 z-10 flex items-center justify-center text-[9px] font-extrabold ${entry.has_moment ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]' : 'text-[var(--muted)]'}`}>D{entry.day}</span>
                    </button>
                  )
                })}
              </div>
              {dayCount}
            </div>
          ) : (
            <div className="shrink-0">
              <div className="flex gap-[5px]" aria-label={`${total} pact days`}>
                {Array.from({ length: total }).map((_, index) => {
                  const isDone = index < completed
                  const isToday = !visualDayEnded && index === currentDay - 1
                  return (
                    <span key={index} className="flex h-1 flex-1 overflow-hidden rounded-[2px] bg-[var(--hairline)]">
                      {isDone ? (
                        <span className="h-full w-full bg-[var(--navy)]" />
                      ) : isToday ? (
                        <span className="h-full w-1/2 bg-[var(--navy)]" />
                      ) : !isEnded && index < currentDay - 1 ? (
                        <span className="h-full w-full border border-dashed border-[var(--missed-border)] bg-transparent" />
                      ) : null}
                    </span>
                  )
                })}
              </div>
              {dayCount && <div className="mt-2 flex justify-end">{dayCount}</div>}
            </div>
          )
        })()}

        <PactAudienceLine pact={pact} audience={audience} ended={presentationEnded || isEnded} isCreatorView={isCreatorView} creatorName={creatorName} pendingAsks={pendingAsks} canViewMoments={!lockedForMe && pact?.can_view_moments !== false} onOpen={() => setAudienceOpen(true)} />

        <section
          onTouchStart={(event) => {
            const touch = event.touches[0]
            swipeRef.current = touch && event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY, at: performance.now() } : null
          }}
          onTouchEnd={(event) => {
            const start = swipeRef.current
            swipeRef.current = null
            const touch = event.changedTouches[0]
            if (!start || !touch || lockedForMe) return
            const dx = touch.clientX - start.x
            const dy = touch.clientY - start.y
            const flick = Math.abs(dx) / Math.max(1, performance.now() - start.at) > 0.3
            if (Math.abs(dx) < Math.abs(dy) * 1.2 || (Math.abs(dx) < 40 && !(flick && Math.abs(dx) >= 24))) return
            lastSwipeAt.current = Date.now()
            stepMoment(dx < 0 ? 1 : -1)
          }}
          onClick={(event) => {
            if (lockedForMe) return
            if ((event.target as HTMLElement).closest('button,a')) return
            // A swipe that ends on the card isn't a tap.
            if (Date.now() - lastSwipeAt.current < 450) return
            openViewer()
          }}
          className={`relative -mx-1.5 min-h-[320px] flex-1 cursor-pointer overflow-hidden rounded-[22px] ${!hasMoments && !presentationEnded ? 'bg-[linear-gradient(160deg,#F4B26A_0%,#E4684F_48%,#5B3A78_100%)]' : presentationEnded ? 'bg-[linear-gradient(160deg,#F4B26A_0%,#E4684F_48%,#5B3A78_100%)]' : 'bg-[var(--navy)]'}`}
          aria-label="Moments"
        >
          {lockedForMe && (
            <div className="absolute inset-0 z-40">
              <LockedMedia pact={pact} variant="page" className="h-full" />
            </div>
          )}
          {!hasMoments && (
            <>
              <div className="absolute left-[60px] top-0 size-[190px] rounded-full bg-[#FFE3A8]/90" />
              <div className={`absolute bottom-0 left-[-20px] right-[-20px] h-[210px] rounded-[50%_50%_0_0] ${completionView === 'partial' || completionView === 'provisional_not_completed' ? 'bg-[#3C2650]' : 'bg-[#3C2650]'}`} />
              <div className="absolute inset-x-0 bottom-0 h-[190px] bg-[linear-gradient(180deg,rgba(18,19,26,0)_0%,rgba(18,19,26,0.72)_100%)]" />
            </>
          )}
          {hasMoments && <div className="absolute inset-x-0 bottom-0 h-[190px] bg-[linear-gradient(180deg,rgba(18,19,26,0)_0%,rgba(18,19,26,0.72)_100%)]" />}

          {presentationEnded && !watchingRecap ? (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center text-white ${completionView === 'partial' || completionView === 'provisional_not_completed' || completionView === 'empty' ? 'bg-[linear-gradient(180deg,rgba(18,19,26,0.72)_0%,rgba(18,19,26,0.72)_100%)]' : ''}`}>
              {completionLooksSuccessful ? (
                <>
                  <span className="mb-3 flex size-12 items-center justify-center rounded-full border-[3px] border-white text-white">
                    <Check className="size-6" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <div className="mb-3 text-center">
                    <h2 className="text-[28px] font-extrabold leading-8 text-white">Completed</h2>
                    <p className="mt-1 text-[17px] font-bold text-white">{completed} of {total} days</p>
                  </div>
                  <button type="button" aria-label="Watch recap" onClick={() => { setActiveIndex(0); setWatchingRecap(true) }} className="mt-9 flex size-24 items-center justify-center rounded-full bg-white text-[var(--navy)] shadow-[0_0_0_10px_rgba(255,255,255,0.28),0_0_0_22px_rgba(255,255,255,0.14)]">
                    <Play className="ml-1 size-10 fill-current" aria-hidden="true" />
                  </button>
                  <span className="mt-5 text-[13px] font-bold text-white">Watch recap</span>
                </>
              ) : completionView === 'partial' || completionView === 'provisional_not_completed' ? (
                <>
                  <h2 className="text-[28px] font-extrabold leading-8 text-white">Ended</h2>
                  <p className="mt-1 text-[17px] font-bold text-white">{completed} of {total} days done</p>
                  <button type="button" onClick={() => { setActiveIndex(0); setWatchingRecap(true) }} className="mt-6 rounded-full border border-white/80 px-5 py-3 text-[15px] font-extrabold text-white">
                    Watch your moments
                  </button>
                </>
              ) : (
                <>
                  <span className="mb-5 flex size-20 items-center justify-center rounded-full border-2 border-dashed border-white text-white">
                    <ImageIcon className="size-9" aria-hidden="true" />
                  </span>
                  <h2 className="text-[26px] font-extrabold leading-8 text-white">Nothing was shared</h2>
                  <p className="mt-2 max-w-[260px] text-[16px] font-semibold leading-5 text-white">This pact ended without moments</p>
                </>
              )}
            </div>
          ) : (
            <>
          {presentationEnded && watchingRecap && (
            <button type="button" onClick={() => setWatchingRecap(false)} aria-label="Close recap" className="absolute right-4 top-4 z-30 flex size-11 items-center justify-center rounded-full bg-white text-[var(--navy)]">
              <X className="size-5" />
            </button>
          )}
          {hasMoments && current?.url && (
            current.type === 'video' ? (
              <AutoPlayVideo key={current.id} src={current.url} soundButtonClassName="right-3 top-3" className="absolute inset-0 size-full object-cover" />
            ) : (
              <SafePhoto src={current.url} alt={caption} className="absolute inset-0 size-full object-cover" />
            )
          )}

          {hasMoments && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          )}

          {hasMoments && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
              <div className="pointer-events-none absolute left-3.5 right-14 top-2.5 flex items-center gap-2.5 text-white" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>
                <span className="flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--ink)] text-[12px] font-extrabold text-white ring-2 ring-white/70">
                  {String(current.authorName || current.username || 'Y').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'Y'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-extrabold">{current.authorName || current.username || 'You'}</span>
                  <span className="block truncate text-[12px] opacity-90">{momentWhen}</span>
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 z-10 text-white">
                <span className="rounded-[9px] px-2.5 py-[3px] text-[11.5px] font-extrabold" style={{ backgroundColor: 'rgba(255,255,255,0.24)' }}>
                  Day {current.day || day}
                  {currentDayMoments.length > 1 ? ` · ${positionInDay + 1} of ${currentDayMoments.length}` : ''}
                </span>
                <p className="mt-1.5 line-clamp-2 text-[17px] font-extrabold leading-[1.2]" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>{caption}</p>
                {currentDayMoments.length > 1 && (
                  <div className="mt-2 flex items-center gap-[5px]" role="img" aria-label={`Moment ${positionInDay + 1} of ${currentDayMoments.length} on Day ${current.day}`}>
                    {currentDayMoments.map((moment, index) => (
                      <span
                        key={moment.id}
                        className="h-1.5 rounded-full transition-all duration-200"
                        style={{ width: index === positionInDay ? 16 : 6, background: index === positionInDay ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!hasMoments && !isEnded && isParticipant && (
            <div className="absolute inset-0 z-10 flex flex-col items-center px-5 pb-5 text-center text-white">
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <button type="button" aria-label={`Post Day ${currentDay}`} onClick={onAddMoment} className="flex size-[96px] items-center justify-center rounded-full border-0 bg-[var(--navy)] text-white shadow-[0_0_0_10px_rgba(255,255,255,0.28),0_0_0_22px_rgba(255,255,255,0.14)] transition active:scale-95">
                  <Camera className="size-10" strokeWidth={2} aria-hidden="true" />
                </button>
                <div className="mt-3 text-[26px] font-extrabold tracking-[-0.5px] text-white">Post Day {currentDay}</div>
                <div className="-mt-1 max-w-[260px] text-[14px] font-semibold text-white/85">
                  {currentDay === 1 ? 'A photo or a 15-second video starts your streak.' : 'Nothing here yet. Your first moment starts the streak.'}
                </div>
              </div>
              <button type="button" onClick={onAddMoment} className="flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white text-[16px] font-extrabold text-[var(--navy)]">
                <Camera className="size-5" strokeWidth={2.2} aria-hidden="true" />
                Post Day {currentDay}
              </button>
            </div>
          )}

          {!hasMoments && !isEnded && !isParticipant && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="text-[20px] font-extrabold tracking-[-0.3px] text-white">Day 1 Is Coming</div>
              <div className="mt-1 max-w-[260px] text-[14px] font-semibold text-white/80">
                {String(pact?.creator_full_name || pact?.creator_username || 'They').split(' ')[0]} hasn&apos;t posted yet. Check back soon.
              </div>
            </div>
          )}

          {!hasMoments && isEnded && !presentationEnded && (
            <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-white">
              <p className="text-[17px] font-semibold">No moments yet</p>
            </div>
          )}
            </>
          )}
        </section>

        {!presentationEnded && !lockedForMe && (hasMoments || isParticipant) && (
          <div className="-mx-1 -mt-1 flex shrink-0 items-center gap-1">
            <LikeButton variant="row" pactId={Number(pact.id)} count={Number(pact?.like_count ?? 0)} liked={Boolean(pact?.is_liked_by_me)} />
            <button type="button" onClick={() => onComment(false)} aria-label={`Comments, ${Number(pact?.comment_count ?? 0)}`} className="flex h-11 items-center gap-1.5 px-2 text-[14px] font-extrabold text-[var(--ink)] transition active:scale-95">
              <MessageCircle className="h-[23px] w-[23px]" strokeWidth={2} />
              {Number(pact?.comment_count ?? 0) > 0 && Number(pact?.comment_count ?? 0)}
            </button>
            <button type="button" onClick={() => void sharePact()} aria-label="Share pact" className="flex h-11 w-10 items-center justify-center text-[var(--ink)] transition active:scale-95">
              <Share className="h-[21px] w-[21px]" strokeWidth={2} />
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              {!isCreatorView && (
                <TipButton variant="soft" creatorId={creatorId} creatorName={creatorName} creatorAvatarUrl={pact?.creator_avatar_url} context={pact?.title} count={Number(pact?.tip_count ?? 0)} pactId={Number(pact?.id)} tipsEnabled={typeof pact?.creator_tips_enabled === 'boolean' ? pact.creator_tips_enabled : undefined} locked={Boolean(pact?.media_locked)} />
              )}
              {isParticipant && !isEnded && hasMoments && (
                postedToday ? (
                  <button type="button" onClick={onAddMoment} aria-label="Add another moment" className="flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--navy)] px-3 text-[13px] font-extrabold text-[var(--navy)] transition active:scale-95">
                    <Camera className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    Add
                  </button>
                ) : (
                  <button type="button" onClick={onAddMoment} className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--navy)] px-3.5 text-[13px] font-extrabold text-white transition active:scale-95" style={{ boxShadow: '0 6px 14px -6px rgba(31,58,147,0.6)' }}>
                    <Camera className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    Post Day {currentDay}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {(isEnded || presentationEnded) && (
          <footer className="flex min-h-12 shrink-0 flex-wrap items-center gap-2">
            {presentationEnded && completionLooksSuccessful && !watchingRecap ? (
              <>
                <button type="button" onClick={onShareRecap} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-extrabold text-white">
                  <Share2 className="size-5" />
                  Share recap
                </button>
                <button type="button" onClick={onRestart} aria-label="Start again" className="flex size-12 items-center justify-center rounded-full bg-[var(--navy)] text-white">
                  <RotateCcw className="size-5" />
                </button>
              </>
            ) : presentationEnded && !completionLooksSuccessful ? (
              <button type="button" onClick={onRestart} className="h-12 w-full rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white">
                Start again
              </button>
            ) : presentationEnded && watchingRecap ? (
              <button type="button" onClick={() => setWatchingRecap(false)} aria-label="Close recap" className="flex size-12 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--navy)]">
                <span aria-hidden="true">×</span>
              </button>
            ) : (
              <div className="flex flex-1" />
            )}
          </footer>
        )}
        {!isParticipant && !presentationEnded && (
          <div className="flex shrink-0 flex-col gap-2">
            {canJoin ? (
              <button type="button" onClick={onJoin} disabled={isJoining} className="h-12 w-full rounded-full bg-[var(--navy)] px-5 text-[15px] font-bold text-white disabled:opacity-60">
                {isJoining ? 'Joining…' : 'Join this pact'}
              </button>
            ) : joinBlockReason === 'request_required' ? (
              <button type="button" onClick={() => void askToJoin()} disabled={joinAsked} className="h-12 w-full rounded-full bg-[var(--navy)] px-5 text-[15px] font-bold text-white disabled:opacity-60">
                {joinAsked ? 'Asked to join' : 'Ask to join the pact'}
              </button>
            ) : (
              <p className="text-center text-[13px] text-[var(--muted)]">{joinMessage[joinBlockReason || ''] || 'Joining is unavailable'}</p>
            )}
            <button type="button" onClick={onStartOwnVersion} className="h-11 w-full rounded-full border border-[var(--hairline)] text-[14px] font-semibold text-[var(--ink-soft)]">
              Start my own version
            </button>
          </div>
        )}
      </div>
      <PactAudienceSheet
        open={audienceOpen}
        onClose={() => setAudienceOpen(false)}
        pact={pact}
        audience={audience}
        ended={presentationEnded || isEnded}
        isCreatorView={isCreatorView}
        creatorName={creatorName}
        canViewMoments={!lockedForMe && pact?.can_view_moments !== false}
        showTurnOnTips={showTurnOnTips}
        isParticipant={isParticipant}
        currentDay={currentDay}
        pendingAsks={pendingAsks}
        onWatch={(momentId) => {
          const target = moments.find((moment) => moment.id === momentId)
          setAudienceOpen(false)
          if (!target) return
          setSelectedDay(target.day ?? null)
          setSelectedMomentId(target.id)
          const index = displayMoments.findIndex((moment) => moment.id === target.id)
          if (index >= 0) setActiveIndex(index)
        }}
        onPost={() => { setAudienceOpen(false); onAddMoment() }}
        onInvite={() => { setAudienceOpen(false); onInvite() }}
        onPrivacy={() => {
          setAudienceOpen(false)
          // Let the first sheet finish leaving history before the next one pushes its own entry.
          window.setTimeout(() => setWatchersOpen(true), 250)
        }}
      />
      {isCreatorView && (
        <WatchersSheet open={watchersOpen} onClose={() => setWatchersOpen(false)} pactId={Number(pact?.id)} mediaLocked={Boolean(pact?.media_locked)} watchPrice={pact?.watch_price ?? null} watchAutoApprove={Boolean(pact?.watch_auto_approve)} inCircle={pact?.circle_id != null} />
      )}
      {viewerOpen && current && (
        <MomentViewer
          moments={orderedMoments}
          startIndex={Math.max(0, orderedMoments.findIndex((moment) => moment.id === current.id))}
          pactId={Number(pact.id)}
          likeCount={Number(pact?.like_count ?? 0)}
          liked={Boolean(pact?.is_liked_by_me)}
          onClose={() => setViewerOpen(false)}
          onIndexChange={(index) => {
            setActiveIndex(index)
            setSelectedDay(orderedMoments[index]?.day ?? null)
            setSelectedMomentId(orderedMoments[index]?.id ?? null)
          }}
          onComment={() => onComment(true)}
        />
      )}
    </main>
  )
}
