'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, ChevronLeft, Image as ImageIcon, MessageCircle, Play, Plus, RotateCcw, Share2, UserRound, UserPlus, X } from 'lucide-react'
import LikeButton from '@/components/LikeButton'
import Link from 'next/link'
import TipButton from '@/components/tips/TipButton'
import { useMyTipSettings } from '@/hooks/useTips'
import { useSmartBack } from '@/hooks/useSmartBack'
import CircleChip from '@/components/classic/CircleChip'
import { getCategoryTheme } from '@/lib/categoryTheme'
import { pactLocalToday, resolvePactCompletionViewState } from '@/lib/pactCompletionState'
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

function Avatar({ person, index }: { person: any; index: number }) {
  const [failed, setFailed] = useState(false)
  const label = String(person?.full_name || person?.name || person?.username || 'M').charAt(0).toUpperCase()
  return (person?.avatar_url || person?.avatar) && !failed ? (
    <Image
      src={person.avatar_url || person.avatar}
      alt=""
      width={34}
      height={34}
      unoptimized
      onError={() => setFailed(true)}
      className={`size-[34px] rounded-full border-2 border-[var(--card)] object-cover ${index ? '-ml-2' : ''}`}
    />
  ) : (
    <span
      className={`flex size-[34px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--navy-hover)] text-[13px] font-extrabold text-white ${index ? '-ml-2' : ''}`}
    >
      {label}
    </span>
  )
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
  const visiblePeople = participants.slice(0, 3)
  const overflow = Math.max(0, participants.length - 3)
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
  const dayMoment = displayMoments.find((moment) => moment.day === effectiveDay)
  const current = displayMoments.find((moment) => moment.id === selectedMomentId) || dayMoment || displayMoments[activeIndex] || displayMoments[0]
  const caption = current?.description || "Today's moment"
  const titleEmoji = pact?.icon_emoji || (/^\s*\p{Extended_Pictographic}/u.test(pact?.title || '') ? '' : getCategoryTheme(pact?.category).emoji)
  const showModernStrip = strip !== null
  const friends = [...new Map(participants.filter((person) => String(person.user_id ?? person.id) !== String(viewerId ?? pact?.creator_id)).map((person) => [String(person.user_id ?? person.id), person])).values()]
  const requiredDays = Number(pact?.days_required || 0)
  const isMoments75 = pact?.completion_rule === 'moments_75' && requiredDays > 0
  const joinMessage: Record<string, string> = {
    unauthenticated: 'Sign in to join this pact',
    creator: 'You created this pact',
    already_joined: 'You are already in this pact',
    not_active: 'Joining is closed',
    full: 'This pact is full',
  }

  const creatorId = pact?.creator_id ?? null
  const isCreatorView = viewerId != null && creatorId != null && String(viewerId) === String(creatorId)
  const creatorName = String(pact?.creator_full_name || pact?.creator_username || 'the creator')
  const myTips = useMyTipSettings(isCreatorView)
  const showTurnOnTips = isCreatorView && myTips.data != null && !myTips.data.enabled

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
    const index = displayMoments.findIndex((moment) => moment.day === entry.day)
    if (index >= 0) {
      setActiveIndex(index)
      setSelectedMomentId(displayMoments[index].id)
    }
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--paper)] px-[14px] pb-3 pt-5 text-[var(--ink)]">
      <div className="mx-auto flex h-[calc(100vh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[var(--hairline)] bg-[var(--card)] p-[18px_16px_16px]">
        <div className="shrink-0">
          <div className="flex items-center justify-between">
            <button type="button" onClick={smartBack} aria-label="Go back" className="-ml-2 flex size-11 items-center justify-center rounded-full text-[var(--ink)]">
              <ChevronLeft className="size-6" strokeWidth={2} aria-hidden="true" />
            </button>
            {!isCreatorView && (
              <TipButton creatorId={creatorId} creatorName={creatorName} creatorAvatarUrl={pact?.creator_avatar_url} context={pact?.title} className="!h-9 !px-3.5 !text-[13.5px]" />
            )}
            {showTurnOnTips && (
              <Link href="/profile/tips" className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-bold" style={{ border: '1.5px dashed #1F3A93', color: '#1F3A93' }}>
                Turn on tips
              </Link>
            )}
          </div>
          {pact?.circle_id != null && pact?.circle_name ? (
            <CircleChip circleId={pact.circle_id} circleName={pact.circle_name} variant="feed" className="max-w-full" />
          ) : (
            <span className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[var(--muted)]">
              <UserRound className="size-4" aria-hidden="true" />
              {friends.length === 0 ? 'Just you' : `You + ${friends.length} friend${friends.length === 1 ? '' : 's'}`}
            </span>
          )}
          <h1 className="line-clamp-2 font-sans text-[24px] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--ink)]">
            {titleEmoji ? `${titleEmoji} ` : ''}{pact?.title}
          </h1>
        </div>

        {showModernStrip ? (
          <div ref={stripRef} className="flex shrink-0 gap-2 overflow-x-auto py-1" aria-label="Pact day strip">
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
                  aria-label={`Day ${entry.day}${entry.has_moment ? `, ${entry.type === 'video' ? 'video' : 'photo'}` : isToday ? ', today' : isMissed ? ', missed' : ', upcoming'}`}
                  aria-pressed={isSelected}
                  onClick={() => selectDay(entry)}
                  disabled={!entry.has_moment}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-[9px] transition-transform active:scale-95 ${entry.has_moment ? 'cursor-pointer bg-[var(--navy)]' : isMissed ? 'bg-[var(--paper)]' : 'bg-[var(--card-muted)]'} ${isToday && !entry.has_moment ? 'ring-2 ring-[var(--navy)] ring-offset-1' : ''} ${isFuture ? 'border border-dashed border-[var(--seat-border)]' : ''} ${isSelected && entry.has_moment ? 'ring-2 ring-[var(--navy)] ring-offset-1' : ''}`}
                >
                  {entry.has_moment && entry.type === 'photo' && entry.thumbnail_url ? (
                    <SafePhoto src={entry.thumbnail_url!} className="size-full object-cover" />
                  ) : entry.has_moment && entry.type === 'video' && videoUrl ? (
                    <video src={`${videoUrl}#t=0.1`} muted playsInline preload="auto" className="size-full object-cover" />
                  ) : entry.has_moment ? (
                    <span className="flex size-full items-center justify-center text-[var(--card)]"><Play className="size-5 fill-current" aria-hidden="true" /></span>
                  ) : null}
                  {entry.has_moment && entry.type === 'video' && <span className="absolute right-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"><Play className="size-3 fill-current" aria-hidden="true" /></span>}
                  <span className={`absolute inset-x-0 bottom-1 z-10 text-center text-[10px] font-extrabold leading-3 ${entry.has_moment ? 'text-white' : 'text-[var(--muted)]'}`}>DAY {entry.day}</span>
                </button>
              )
            })}
          </div>
        ) : (
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
        )}

        {!presentationEnded && <header className="flex items-center gap-3">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--navy)]">
            <span className="flex size-[35px] items-center justify-center rounded-full bg-[var(--card)] text-[11px] font-extrabold">
              {isMoments75 ? `${completed}/${requiredDays}` : `${percent}%`}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="whitespace-nowrap text-[20px] font-extrabold leading-6">Day {day} of {total}</h1>
            <p className="whitespace-nowrap text-[13px] font-semibold leading-[18px] text-[var(--muted)]">{isMoments75 ? 'days covered' : dayLabel}</p>
          </div>
          <div className="flex items-center">
            {!presentationEnded && visiblePeople.map((person, index) => (
              <Avatar key={person.id || person.user_id || index} person={person} index={index} />
            ))}
            {!presentationEnded && overflow > 0 && (
              <span className="-ml-2 flex size-[34px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--card-muted)] text-[11px] font-bold">
                +{overflow}
              </span>
            )}
            {!presentationEnded && <button
              type="button"
              onClick={onInvite}
              aria-label="Invite someone"
              className="ml-1 flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)]"
            >
              <UserPlus className="size-5" />
            </button>}
          </div>
        </header>}

        <section
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button,a')) return
            openViewer()
          }}
          className={`relative min-h-0 flex-1 cursor-pointer overflow-hidden rounded-[24px] ${!hasMoments && !presentationEnded ? 'bg-[linear-gradient(160deg,#F4B26A_0%,#E4684F_48%,#5B3A78_100%)]' : presentationEnded ? 'bg-[linear-gradient(160deg,#F4B26A_0%,#E4684F_48%,#5B3A78_100%)]' : 'bg-[var(--navy)]'}`}
          aria-label="Moments"
        >
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
              <video key={current.id} src={current.url} className="absolute inset-0 size-full object-cover" muted playsInline autoPlay loop preload="auto" />
            ) : (
              <SafePhoto src={current.url} alt={caption} className="absolute inset-0 size-full object-cover" />
            )
          )}

          {hasMoments && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          )}

          {hasMoments && (
            <>
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur">
                <span className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-[var(--card)] text-[10px] text-[var(--ink)]">
                  {String(current.authorName || current.username || 'Y').charAt(0).toUpperCase()}
                </span>
                {current.authorName || current.username || 'You'} - Day {current.day || day}
              </div>
              <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-10 flex flex-col gap-2">
                <LikeButton pactId={Number(pact.id)} count={Number(pact?.like_count ?? 0)} liked={Boolean(pact?.is_liked_by_me)} />
                <button type="button" onClick={() => onComment(false)} aria-label="Comment on this moment" className="flex size-12 items-center justify-center rounded-full bg-[var(--card)] text-[var(--ink)] shadow-lg">
                  <MessageCircle className="size-5" />
                </button>

              </div>
              <div className="absolute inset-x-5 bottom-5 z-10 text-white">
                <p className="mt-0.5 text-[17px] font-extrabold leading-[22px]">{caption}</p>
              </div>
            </>
          )}

          {!hasMoments && !isEnded && isParticipant && (
            <div className="absolute inset-0 z-10 px-5 text-center text-white">
              <button type="button" aria-label="Add a moment" onClick={onAddMoment} className="absolute left-1/2 top-[100px] flex size-[104px] -translate-x-1/2 items-center justify-center rounded-full border-0 bg-[var(--navy)] text-white shadow-[0_0_0_10px_rgba(255,255,255,0.28),0_0_0_22px_rgba(255,255,255,0.14)]">
                <Plus className="size-11" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <div className="absolute left-0 right-0 top-[232px] text-[24px] font-extrabold tracking-[-0.4px] text-white">Add a moment</div>
              <div className="absolute inset-x-5 bottom-[22px] text-left text-white">
                <div className="text-[12px] font-bold opacity-80">No moments yet</div>
                <div className="mt-0.5 text-[17px] font-extrabold leading-[22px]">Make something worth showing.</div>
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

        {(hasMoments || isEnded || presentationEnded || !isParticipant) && (
          <footer className="flex min-h-14 flex-wrap items-center gap-2">
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
            {!presentationEnded && isParticipant && hasMoments && !isEnded && (
              <button
                type="button"
                onClick={onAddMoment}
                aria-label="Add a moment"
                className="ml-auto flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white"
              >
                <Camera className="size-5" aria-hidden="true" />
                Add a moment
              </button>
            )}
          </footer>
        )}
        {!isParticipant && !presentationEnded && (
          <div className="flex shrink-0 flex-col gap-2">
            {canJoin ? (
              <button type="button" onClick={onJoin} disabled={isJoining} className="h-12 w-full rounded-full bg-[var(--navy)] px-5 text-[15px] font-bold text-white disabled:opacity-60">
                {isJoining ? 'Joining…' : 'Join this pact'}
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
