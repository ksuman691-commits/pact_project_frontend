'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { HOME_MOMENT_LIMIT, useMomentPeople, type MomentPerson } from '@/hooks/useMomentPeople'
import { useMyMomentsToday } from '@/hooks/useMyMomentsToday'
import type { PactStory } from '@/lib/stories'

export interface MomentsCircle {
  id: number
  name: string
  photo_url?: string | null
  stories_today_count?: number | null
  has_unseen_story?: boolean | null
}

const GREEN = '#22C55E'
const SOFT = '#C9D3F5'
const YELLOW = '#FFD23F'

export interface TodayMomentsData {
  people: MomentPerson[]
  loading: boolean
  myStories: PactStory[]
  postedToday: boolean
  myName: string
  myAvatar: string | null
}

/** Who posted a moment today (in your circles and people you follow), and your own. */
export function useTodayMoments(circles: MomentsCircle[]): TodayMomentsData {
  const { user } = useAuthStore()
  const { people, isLoading } = useMomentPeople(circles, user?.id)
  const { myStories, postedToday } = useMyMomentsToday(circles, user?.id)
  return {
    people: people.slice(0, HOME_MOMENT_LIMIT),
    loading: Boolean(isLoading),
    myStories,
    postedToday,
    myName: user?.full_name || user?.username || 'You',
    myAvatar: user?.avatar_url || null,
  }
}

function Face({ name, imageUrl, size, ring, dashed = false }: { name?: string | null; imageUrl?: string | null; size: number; ring: string; dashed?: boolean }) {
  const [failed, setFailed] = useState(false)
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
  return (
    <span
      className="inline-flex shrink-0 rounded-full p-[2px]"
      style={{ width: size, height: size, border: `${dashed ? 2 : 3}px ${dashed ? 'dashed' : 'solid'} ${ring}`, boxSizing: 'border-box' }}
      aria-hidden="true"
    >
      <span className="flex flex-1 items-center justify-center overflow-hidden rounded-full font-extrabold text-white" style={{ background: '#8C6F63', fontSize: Math.round(size * 0.36) }}>
        {imageUrl && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
        ) : (
          initials
        )}
      </span>
    </span>
  )
}

const firstName = (name?: string | null) => (name || 'Someone').split(' ')[0]

function othersLine(people: MomentPerson[]) {
  if (people.length === 0) return 'No one else has posted yet'
  if (people.length === 1) return `${firstName(people[0].name)} posted today`
  if (people.length === 2) return `${firstName(people[0].name)} and ${firstName(people[1].name)} posted`
  return `${firstName(people[0].name)} and ${people.length - 1} others posted`
}

/** The black and yellow Moments button that opens and closes the moments. */
export function MomentsButton({ open, onToggle, count }: { open: boolean; onToggle: () => void; count: number }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Hide moments' : `Show moments${count ? `, ${count}` : ''}`}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14.5px] font-extrabold transition active:scale-95"
      style={{ background: '#17181D', color: YELLOW }}
    >
      {open ? 'Hide' : 'Moments'}
      <ChevronDown className="size-4 transition-transform duration-300" strokeWidth={2.6} style={{ transform: open ? 'rotate(180deg)' : undefined }} aria-hidden="true" />
    </button>
  )
}

/** Closed: one line at the bottom of the Today card. */
export function MomentsLine({ data, open, onToggle }: { data: TodayMomentsData; open: boolean; onToggle: () => void }) {
  const faces = data.people.slice(0, 2)
  return (
    <div className="relative mt-3.5 flex items-center gap-2.5 border-t border-white/15 pt-3">
      <span className="flex">
        <Face name={data.myName} imageUrl={data.myAvatar} size={38} ring={data.postedToday ? GREEN : 'rgba(255,255,255,0.7)'} dashed={!data.postedToday} />
        {faces.map((person) => (
          <span key={person.userId} className="-ml-2.5">
            <Face name={person.name} imageUrl={person.avatarUrl} size={38} ring={GREEN} />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[15px] font-extrabold text-white">{data.postedToday ? 'You posted today' : 'Your moment is waiting'}</span>
        <span className="block truncate text-[13px] font-semibold" style={{ color: SOFT }}>{data.loading ? 'Checking who posted…' : othersLine(data.people)}</span>
      </span>
      <MomentsButton open={open} onToggle={onToggle} count={data.people.length + (data.postedToday ? 1 : 0)} />
    </div>
  )
}

/** Open: the moments at the bottom of the Today card, big faces you tap to watch. */
export function MomentsPanel({
  data,
  open,
  onToggle,
  onViewOwn,
  onPost,
  onView,
}: {
  data: TodayMomentsData
  open: boolean
  onToggle: () => void
  onViewOwn: () => void
  onPost: () => void
  onView: (person: MomentPerson) => void
}) {
  const posted = data.people.length + (data.postedToday ? 1 : 0)
  return (
    <div className="cp-fade-down relative mt-3.5 border-t border-white/15 pt-3">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-extrabold tracking-[-0.02em] text-white">Moments today</h3>
          <p className="mt-0.5 text-[14px] font-semibold" style={{ color: SOFT }}>
            {posted === 0 ? 'No one has posted yet' : `${posted} posted · tap a face to watch`}
          </p>
        </div>
        <MomentsButton open={open} onToggle={onToggle} count={posted} />
      </div>
      <ul className="scrollbar-hide -mx-1 mt-3.5 flex gap-2.5 overflow-x-auto px-1 pb-1">
        <li className="shrink-0">
          <button
            type="button"
            onClick={data.postedToday && data.myStories.length > 0 ? onViewOwn : onPost}
            className="flex w-[76px] flex-col items-center gap-1.5"
            aria-label={data.postedToday ? 'Watch your moment' : "Post today's moment"}
          >
            <span className="relative">
              <Face name={data.myName} imageUrl={data.myAvatar} size={68} ring={data.postedToday ? GREEN : 'rgba(255,255,255,0.6)'} dashed={!data.postedToday} />
              {!data.postedToday && (
                <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-[var(--navy)]" style={{ background: YELLOW }} aria-hidden="true">
                  <Plus className="size-3.5 text-[#17181D]" strokeWidth={3.2} />
                </span>
              )}
            </span>
            <span className="text-[15px] font-extrabold text-white">You</span>
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold"
              style={data.postedToday ? { background: '#DCFCE7', color: '#15803D' } : { background: YELLOW, color: '#17181D' }}
            >
              {data.postedToday ? <Check className="size-3" strokeWidth={3.4} aria-hidden="true" /> : null}
              {data.postedToday ? 'Posted' : 'Post'}
            </span>
          </button>
        </li>
        {data.loading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5" aria-hidden="true">
                <span className="size-[68px] animate-pulse rounded-full bg-white/15" />
                <span className="h-3.5 w-12 rounded bg-white/15" />
              </li>
            ))
          : data.people.map((person) => (
              <li key={person.userId} className="shrink-0">
                <button type="button" onClick={() => onView(person)} className="flex w-[76px] flex-col items-center gap-1.5" aria-label={`Watch ${firstName(person.name)}'s moment${person.stories.length > 1 ? 's' : ''}`}>
                  <Face name={person.name} imageUrl={person.avatarUrl} size={68} ring={person.hasUnseen ? GREEN : 'rgba(255,255,255,0.75)'} />
                  <span className="w-full truncate text-center text-[15px] font-extrabold text-white">{firstName(person.name)}</span>
                  <span className="w-full truncate text-center text-[12px] font-bold" style={{ color: SOFT }}>{person.circleName || 'Following'}</span>
                </button>
              </li>
            ))}
      </ul>
      <Link href="/moments" className="mt-3.5 flex h-11 items-center justify-center rounded-full text-[15px] font-extrabold" style={{ background: '#17181D', color: YELLOW }}>
        See all moments
      </Link>
    </div>
  )
}
