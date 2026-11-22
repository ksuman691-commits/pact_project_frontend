'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Camera, Check, ChevronRight, Globe, Heart, Lock, UserPlus, Users, X } from 'lucide-react'
import PageHero from '@/components/PageHero'
import BodyPortal from '@/components/BodyPortal'
import OrbitRing from '@/components/circles/OrbitRing'
import type { OrbitMember } from '@/components/circles/OrbitRing'
import { useBackToClose } from '@/hooks/useBackToClose'
import { useCircles } from '@/hooks/useCircles'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const CARD = '#FBF8F1'

type PostedMoment = { id: number | string; userId?: number | string; day?: number | null; uploadedAt?: string | null; authorName?: string; username?: string; avatarUrl?: string }

type Person = { id: string; name: string; /** The real name, for the initial even when name reads 'You'. */ fullName: string; avatarUrl: string | null; isYou: boolean; isCreator: boolean; moment: PostedMoment | null }

export type AudienceKind = 'circle' | 'paid' | 'followers' | 'public'

type Params = {
  pact: any
  participants: any[]
  moments: PostedMoment[]
  currentDay: number
  viewerId?: number | string
  isCreatorView: boolean
  creatorName: string
}

const firstName = (name: string) => String(name || '').trim().split(/\s+/)[0] || 'Someone'

function timeOf(value?: string | null) {
  const at = value ? new Date(value) : null
  if (!at || Number.isNaN(at.getTime())) return null
  return at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

/** Everyone in the pact, with the moment they posted today (if any). Posted first, then you, then the rest. */
export function buildPeople({ pact, participants, moments, currentDay, viewerId, creatorName }: Params): Person[] {
  const today = new Map<string, PostedMoment>()
  moments.forEach((moment) => {
    if (moment.day !== currentDay || moment.userId == null) return
    const key = String(moment.userId)
    const prior = today.get(key)
    if (!prior || new Date(moment.uploadedAt || 0).getTime() > new Date(prior.uploadedAt || 0).getTime()) today.set(key, moment)
  })
  const creatorId = pact?.creator_id != null ? String(pact.creator_id) : null
  const seen = new Set<string>()
  const people: Person[] = []
  const add = (id: string, name: string, avatarUrl: string | null) => {
    if (seen.has(id)) return
    seen.add(id)
    const isYou = viewerId != null && String(viewerId) === id
    people.push({ id, name: isYou ? 'You' : name, fullName: name, avatarUrl, isYou, isCreator: id === creatorId, moment: today.get(id) ?? null })
  }
  participants.forEach((person: any) => {
    const id = person?.id ?? person?.user_id
    if (id == null) return
    add(String(id), String(person.full_name || person.name || person.username || 'Member'), person.avatar_url || person.avatar || null)
  })
  // The creator always belongs here, even when the participants list is short.
  if (creatorId && !seen.has(creatorId)) add(creatorId, creatorName, pact?.creator_avatar_url || null)
  // Anyone who posted today is in the pact, whatever the list says.
  today.forEach((moment, id) => add(id, String(moment.authorName || moment.username || 'Member'), moment.avatarUrl || null))
  return people.sort((a, b) => Number(Boolean(b.moment)) - Number(Boolean(a.moment)) || Number(b.isYou) - Number(a.isYou))
}

function PersonFace({ person, size, ring }: { person: Pick<Person, 'name' | 'avatarUrl'> & { fullName?: string }; size: number; ring?: React.CSSProperties }) {
  const [broken, setBroken] = useState(false)
  const showPhoto = person.avatarUrl && !broken
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: showPhoto ? '#E3D9C2' : '#8C6F63', color: '#FFFFFF', ...ring }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatarUrl!} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
      ) : (
        String(person.fullName || person.name || '?').charAt(0).toUpperCase()
      )}
    </span>
  )
}

export function useAudience(params: Params) {
  const { pact, participants, moments, currentDay, viewerId, isCreatorView, creatorName } = params
  const inCircle = pact?.circle_id != null
  const circles = useCircles(inCircle)
  const circle = inCircle ? (circles.data as any[] | undefined)?.find((item) => Number(item.id) === Number(pact.circle_id)) : null
  const people = useMemo(
    () => buildPeople({ pact, participants, moments, currentDay, viewerId, isCreatorView, creatorName }),
    [pact, participants, moments, currentDay, viewerId, isCreatorView, creatorName],
  )
  const posted = people.filter((person) => person.moment)
  const kind: AudienceKind = inCircle ? 'circle' : pact?.media_locked ? 'paid' : pact?.visibility === 'private' ? 'followers' : 'public'
  return { people, posted, kind, circle, inCircle }
}

export type Audience = ReturnType<typeof useAudience>

function postedLine(posted: Person[]) {
  const names = posted.map((person) => (person.isYou ? 'You' : firstName(person.name)))
  if (names.length === 0) return 'No one has posted today'
  if (names.length === 1) return `${names[0]} posted today`
  if (names.length === 2) return `${names[0]} and ${names[1]} posted today`
  return `${names[0]}, ${names[1]} and ${names.length - 2} more posted today`
}

/** The one slim line under the day strip: who is in, who posted today, and who can see. */
export function PactAudienceLine({
  pact,
  audience,
  ended,
  isCreatorView,
  creatorName,
  pendingAsks,
  canViewMoments,
  onOpen,
}: {
  pact: any
  audience: Audience
  ended: boolean
  isCreatorView: boolean
  creatorName: string
  pendingAsks: number
  /** false when the server hides this pact's moments from the viewer, so "who posted" is unknown. */
  canViewMoments: boolean
  onOpen: () => void
}) {
  const { people, posted, kind, circle } = audience
  const creator = people.find((person) => person.isCreator) ?? people[0]
  const watchers = Number(pact?.watcher_count ?? 0)
  const price = pact?.watch_price ? `₹${pact.watch_price}` : null

  let title: string
  if (kind === 'circle') {
    const count = Number(circle?.member_count ?? people.length)
    title = `${pact?.circle_name || circle?.name || 'Circle'}${count > 0 ? ` · ${count}` : ''}`
  } else if (kind === 'paid') {
    const owner = isCreatorView ? 'Your pact' : `${firstName(creatorName)}'s pact`
    title = watchers > 0 ? `${owner} · ${watchers} approved to watch` : price ? `${owner} · ${price} to watch` : owner
  } else if (people.length > 1) {
    title = `${people.length} in this pact`
  } else {
    title = isCreatorView ? 'Your pact' : `${firstName(creatorName)}'s pact`
  }
  const reach = kind === 'followers' ? ' · shown to followers' : kind === 'public' ? ' · shown to everyone' : ''
  const lockedPrice = kind === 'paid' && price ? `Watch for ${price} to see moments` : null
  const subtitle = ended ? 'Ended' : !canViewMoments ? lockedPrice || `Moments are for ${kind === 'followers' ? 'followers' : 'members'}` : `${postedLine(posted)}${reach}`

  // Ring members: the circle's own faces when we have them, otherwise the people in the pact.
  const postedIds = new Set(posted.map((person) => person.id))
  const ringMembers: OrbitMember[] =
    Array.isArray(circle?.members_preview) && circle.members_preview.length > 0
      ? circle.members_preview.map((member: any) => ({ user_id: member.user_id, name: member.name, avatar_url: member.avatar_url, sent_proof_this_week: postedIds.has(String(member.user_id)) }))
      : people.map((person) => ({ user_id: person.id, name: person.name, avatar_url: person.avatarUrl, sent_proof_this_week: Boolean(person.moment), is_you: person.isYou }))
  const ringTotal = Math.max(1, Number(circle?.member_count ?? 0), people.length)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${title}. ${subtitle}. Who is in this pact and who can see it`}
      className="flex h-[52px] w-full shrink-0 items-center gap-2.5 rounded-[26px] pr-3.5 text-left transition active:scale-[0.99]"
      style={{ background: CARD, border: `1px solid ${LINE}`, color: INK, paddingLeft: kind === 'circle' ? 6 : 10 }}
    >
      {kind === 'circle' ? (
        <OrbitRing name={pact?.circle_name || circle?.name || 'Circle'} photoUrl={circle?.photo_url ?? null} members={ringMembers} total={ringTotal} active={posted.length} size={40} discSize={22} faceSize={10} duration="40s" />
      ) : kind === 'paid' ? (
        <PersonFace person={creator ?? { name: creatorName, avatarUrl: null }} size={30} ring={{ border: `2.5px solid ${NAVY}`, boxSizing: 'border-box' }} />
      ) : (
        <span className="relative flex h-[30px] shrink-0" style={{ width: 30 + Math.max(0, Math.min(people.length, 3) - 1) * 16 }}>
          {people.slice(0, 3).map((person, index) => (
            <span key={person.id} className="absolute top-0" style={{ left: index * 16, zIndex: 3 - index }}>
              <PersonFace
                person={person}
                size={30}
                ring={person.moment ? { border: `2.5px solid ${NAVY}`, boxSizing: 'border-box' } : { border: `2px dashed ${CARD}`, boxSizing: 'border-box', outline: '1px solid #B9AF9B' }}
              />
            </span>
          ))}
        </span>
      )}
      <span className="block min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-extrabold leading-[1.3]">{title}</span>
        <span className="block truncate text-[12px] leading-[1.3]" style={{ color: MUTED }}>{subtitle}</span>
      </span>
      {isCreatorView && pendingAsks > 0 && (
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: NAVY, color: '#FFFFFF' }}>{pendingAsks} asking</span>
      )}
      <ChevronRight className="size-3.5 shrink-0" strokeWidth={2.4} style={{ color: MUTED }} aria-hidden="true" />
    </button>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="px-5 pb-0.5 pt-3.5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>{children}</div>
}

function AudienceRow({ icon, dark, title, sub, href }: { icon: React.ReactNode; dark?: boolean; title: string; sub: string; href?: string }) {
  const body = (
    <>
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        style={dark ? { background: INK, color: '#FFFFFF' } : { background: CARD, color: INK, border: `1.5px solid ${LINE}` }}
      >
        {icon}
      </span>
      <span className="block min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold">{title}</span>
        <span className="block text-[13px] leading-snug" style={{ color: MUTED }}>{sub}</span>
      </span>
      {href && <ChevronRight className="size-4 shrink-0" strokeWidth={2.4} style={{ color: MUTED }} aria-hidden="true" />}
    </>
  )
  const cls = 'flex items-center gap-3 px-5 py-2'
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>
}

/**
 * Who posted today and who can see this pact, in one sheet. It opens on the
 * same animated navy top as the Pacts and Circles pages, with the day's numbers;
 * below, each line says plainly who can see (green) and who can't (red). Only
 * the person who started the pact gets Invite and Make private.
 */
export function PactAudienceSheet({
  open,
  onClose,
  pact,
  audience,
  ended,
  isCreatorView,
  creatorName,
  canViewMoments,
  isParticipant,
  currentDay,
  pendingAsks,
  onWatch,
  onPost,
  onInvite,
  onPrivacy,
  showTurnOnTips = false,
}: {
  open: boolean
  onClose: () => void
  pact: any
  audience: Audience
  ended: boolean
  isCreatorView: boolean
  creatorName: string
  canViewMoments: boolean
  isParticipant: boolean
  currentDay: number
  pendingAsks: number
  onWatch: (momentId: number | string) => void
  onPost: () => void
  onInvite: () => void
  onPrivacy: () => void
  showTurnOnTips?: boolean
}) {
  useBackToClose(open, onClose)
  if (!open) return null
  const { people, posted, circle } = audience
  const creatorFirst = firstName(creatorName)
  const whose = isCreatorView ? 'your' : `${creatorFirst}'s`
  const circleName = pact?.circle_name || circle?.name || 'the circle'
  const names = (Array.isArray(circle?.members_preview) ? circle.members_preview : []).filter((member: any) => member?.name).map((member: any) => firstName(member.name))
  const memberCount = Number(circle?.member_count ?? 0)
  const circleSub = memberCount > 0
    ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}${names.length ? ` · ${names.slice(0, 3).join(', ')}${memberCount > Math.min(3, names.length) ? ` and ${memberCount - Math.min(3, names.length)} more` : ''}` : ''}`
    : 'Everyone in the circle'
  const watchers = Number(pact?.watcher_count ?? 0)
  const price = pact?.watch_price ? `₹${pact.watch_price}` : null
  const inCircle = pact?.circle_id != null
  const visibility: string = pact?.visibility || 'public'
  const locked = Boolean(pact?.media_locked)

  // Who can see the moments, and who can't, in plain words.
  const canSee: { icon: React.ReactNode; title: string; sub: string; href?: string }[] = []
  const cantSee: { title: string; sub: string }[] = []
  if (inCircle) canSee.push({ icon: <Users className="size-5" strokeWidth={2} />, title: `Members of ${circleName}`, sub: circleSub, href: `/circles/${pact.circle_id}` })
  if (!locked && visibility === 'public') canSee.push({ icon: <Globe className="size-5" strokeWidth={2} />, title: 'Everyone on CirclePact', sub: 'It can show up on anyone’s feed' })
  if (!locked && visibility === 'private') canSee.push({ icon: <Heart className="size-5" strokeWidth={2} />, title: `People who follow ${isCreatorView ? 'you' : creatorFirst}`, sub: 'It shows on their feed' })
  if (locked) canSee.push({ icon: <Lock className="size-5" strokeWidth={2} />, title: isCreatorView ? 'People you let in' : `People ${creatorFirst} lets in`, sub: `${price ? `${price} to watch · ` : ''}${watchers} approved so far` })
  if (visibility === 'circle_only' || (inCircle && visibility !== 'public' && visibility !== 'private')) cantSee.push({ title: `Anyone outside ${circleName}`, sub: 'They don’t see its moments' })
  else if (locked) cantSee.push({ title: 'Everyone else', sub: 'They see the pact, but not the photos and videos' })
  else if (visibility === 'private') cantSee.push({ title: `People who don’t follow ${isCreatorView ? 'you' : creatorFirst}`, sub: 'They don’t see its moments' })

  const headline = locked
    ? `Only people ${isCreatorView ? 'you let in' : `${creatorFirst} lets in`} see ${whose} moments.`
    : visibility === 'public'
      ? `Anyone on CirclePact can see ${whose} moments.`
      : visibility === 'private'
        ? `Only ${isCreatorView ? 'your' : `${creatorFirst}'s`} followers see these moments.`
        : `Only ${circleName} sees these moments.`
  const fmt = (value?: string | null) => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '')
  const from = fmt(pact?.start_date)
  const to = fmt(pact?.end_date)
  const allPosted = people.length > 0 && posted.length === people.length
  const nonePosted = posted.length === 0

  const tile = 'flex min-h-[92px] flex-col justify-between rounded-[18px] px-3 py-2.5'
  const tileStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' } as React.CSSProperties

  return (
    <BodyPortal>
      <div role="dialog" aria-modal="true" aria-label="Who can see this pact" className="fixed inset-0 z-[90] flex items-end justify-center">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
        <div className="cp-sheet-rise relative max-h-[92vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-t-[28px] pb-[max(1.5rem,env(safe-area-inset-bottom))]" style={{ background: '#F4EFE4', color: INK }}>
          <div className="relative">
            <span className="absolute left-1/2 top-2.5 z-10 h-[5px] w-10 -translate-x-1/2 rounded-full bg-white/40" aria-hidden="true" />
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full text-white" style={{ background: 'rgba(255,255,255,0.14)' }}>
              <X className="size-[22px]" strokeWidth={2.2} />
            </button>
            <PageHero
              tone="navy"
              title="Who can see"
              tagline={<>Started by {isCreatorView ? 'you' : creatorName}{from ? ` · ${from}${to ? ` – ${to}` : ''}` : ''}</>}
              line={headline}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className={tile} style={tileStyle}>
                  <span className="flex size-7 items-center justify-center rounded-full" style={{ background: ended ? 'rgba(255,255,255,0.2)' : allPosted ? '#22C55E' : nonePosted ? '#E5363B' : '#F5B300' }} aria-hidden="true">
                    {allPosted ? <Check className="size-4 text-white" strokeWidth={3} /> : <Camera className="size-[15px] text-white" strokeWidth={2.4} />}
                  </span>
                  <span>
                    <span className="block text-[22px] font-extrabold leading-none tabular-nums">{posted.length}<span className="text-[13px] font-bold text-white/70"> of {people.length}</span></span>
                    <span className="mt-1 block text-[11.5px] font-bold text-white/80">{ended ? 'Posted last day' : `Posted · Day ${currentDay}`}</span>
                  </span>
                </div>
                <div className={tile} style={tileStyle}>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-[var(--navy)]" aria-hidden="true">
                    {locked ? <Lock className="size-[15px]" strokeWidth={2.4} /> : inCircle && visibility !== 'public' && visibility !== 'private' ? <Users className="size-[15px]" strokeWidth={2.4} /> : visibility === 'private' ? <Heart className="size-[15px]" strokeWidth={2.4} /> : <Globe className="size-[15px]" strokeWidth={2.4} />}
                  </span>
                  <span>
                    <span className="block text-[15px] font-extrabold leading-tight">{locked ? 'Private' : visibility === 'public' ? 'Everyone' : visibility === 'private' ? 'Followers' : 'Circle'}</span>
                    <span className="mt-1 block text-[11.5px] font-bold text-white/80">Can watch</span>
                  </span>
                </div>
                <div className={tile} style={tileStyle}>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-[var(--navy)]" aria-hidden="true">
                    <UserPlus className="size-[15px]" strokeWidth={2.4} />
                  </span>
                  <span>
                    <span className="block text-[22px] font-extrabold leading-none tabular-nums">{people.length}</span>
                    <span className="mt-1 block text-[11.5px] font-bold text-white/80">{people.length === 1 ? 'In the pact' : 'In the pact'}</span>
                  </span>
                </div>
              </div>
            </PageHero>
          </div>

          <Section>{ended ? 'IN THIS PACT' : `TODAY · DAY ${currentDay}`}</Section>
          {people.map((person) => {
            const at = timeOf(person.moment?.uploadedAt)
            const didPost = Boolean(person.moment)
            return (
              <div key={person.id} className="flex items-center gap-3 px-5 py-2">
                <span className="relative inline-flex shrink-0" style={{ width: 46, height: 46 }}>
                  <span className="absolute inset-0 rounded-full" style={{ border: ended || !canViewMoments ? `2px solid ${LINE}` : didPost ? '3px solid #16A34A' : '2px dashed #E5363B' }} aria-hidden="true" />
                  <span className="absolute" style={{ inset: 5 }}>
                    <PersonFace person={person} size={36} />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-extrabold">
                    {person.name}
                    {person.isCreator && <span className="ml-1.5 text-[12px] font-bold" style={{ color: MUTED }}>Started it</span>}
                  </div>
                  {ended || !canViewMoments ? (
                    <div className="text-[13px]" style={{ color: MUTED }}>In the pact</div>
                  ) : didPost ? (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold" style={{ background: '#E6F4EA', color: '#15803D' }}>
                      <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      Posted{at ? ` · ${at}` : ' today'}
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold" style={{ background: '#FDECEA', color: '#B42318' }}>
                      <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      Not posted yet
                    </span>
                  )}
                </div>
                {didPost && canViewMoments && !ended && (
                  <button type="button" onClick={() => onWatch(person.moment!.id)} className="h-11 shrink-0 rounded-full px-4 text-[13.5px] font-extrabold" style={{ border: `1.5px solid ${INK}`, color: INK }}>
                    See it
                  </button>
                )}
                {person.isYou && !didPost && isParticipant && !ended && (
                  <button type="button" onClick={onPost} className="h-11 shrink-0 rounded-full px-4 text-[13.5px] font-extrabold" style={{ background: NAVY, color: '#FFFFFF' }}>
                    Post Day {currentDay}
                  </button>
                )}
              </div>
            )
          })}

          <Section>WHO CAN SEE THE MOMENTS</Section>
          {canSee.map((row) => {
            const body = (
              <>
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: '#E6F4EA', color: '#15803D' }}>
                  {row.icon}
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border-2 border-[#F4EFE4]" style={{ background: '#16A34A' }} aria-hidden="true">
                    <Check className="size-2.5 text-white" strokeWidth={4} />
                  </span>
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-extrabold">{row.title}</span>
                  <span className="block text-[13px] leading-snug" style={{ color: MUTED }}>{row.sub}</span>
                </span>
                {row.href && <ChevronRight className="size-4 shrink-0" strokeWidth={2.4} style={{ color: MUTED }} aria-hidden="true" />}
              </>
            )
            return row.href ? (
              <Link key={row.title} href={row.href} className="flex items-center gap-3 px-5 py-2" aria-label={`Can see: ${row.title}`}>{body}</Link>
            ) : (
              <div key={row.title} className="flex items-center gap-3 px-5 py-2" aria-label={`Can see: ${row.title}`}>{body}</div>
            )
          })}
          {cantSee.map((row) => (
            <div key={row.title} className="flex items-center gap-3 px-5 py-2" aria-label={`Can't see: ${row.title}`}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: '#FDECEA', color: '#B42318' }}>
                <X className="size-5" strokeWidth={2.6} />
              </span>
              <span className="block min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold">{row.title}</span>
                <span className="block text-[13px] leading-snug" style={{ color: MUTED }}>{row.sub}</span>
              </span>
            </div>
          ))}

          {isCreatorView && !ended && (
            <button type="button" onClick={onInvite} className="mx-5 mt-3 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-[20px] px-3.5 py-3 text-left transition active:scale-[0.99]" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: NAVY }}>
                <UserPlus className="size-5" strokeWidth={2} />
              </span>
              <span className="block min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold">Invite someone to join</span>
                <span className="block text-[13px] leading-snug" style={{ color: MUTED }}>They post their own moments here and see everyone&apos;s</span>
              </span>
              <ChevronRight className="size-4 shrink-0" strokeWidth={2.4} style={{ color: MUTED }} aria-hidden="true" />
            </button>
          )}

          {isCreatorView && showTurnOnTips && (
            <AudienceRow icon={<Heart className="size-5" strokeWidth={2} />} title="Turn on tips" sub="Let people tip you for your pacts" href="/profile/tips" />
          )}

          {isCreatorView ? (
            <div className="mx-5 mt-4 overflow-hidden rounded-[22px]" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <div className="flex items-start gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: locked ? '#E8ECF7' : '#F3EEE4', color: NAVY }}>
                  <Lock className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-extrabold">{locked ? `Private${price ? ` · ${price} to watch` : ''}` : 'Make it private'}</div>
                  <div className="mt-1 text-[13.5px] leading-[1.45]" style={{ color: MUTED }}>
                    {locked
                      ? pendingAsks > 0
                        ? `${pendingAsks} ${pendingAsks === 1 ? 'person is' : 'people are'} waiting for you to let them in.`
                        : `${watchers} approved. Change the price or let people in.`
                      : 'Only people you approve can watch the photos and videos. You can ask a small price to watch.'}
                  </div>
                </div>
              </div>
              <button type="button" onClick={onPrivacy} className="h-12 w-full text-[15px] font-extrabold text-white" style={{ background: pendingAsks > 0 ? '#E5363B' : NAVY }}>
                {locked ? (pendingAsks > 0 ? `Review ${pendingAsks} ${pendingAsks === 1 ? 'request' : 'requests'}` : 'Manage who can watch') : 'Make private'}
              </button>
            </div>
          ) : (
            <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-[18px] px-4 py-3.5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <Lock className="mt-px size-[18px] shrink-0" strokeWidth={2.2} style={{ color: MUTED }} aria-hidden="true" />
              <div className="text-[13.5px] leading-[1.45]" style={{ color: MUTED }}>
                Only <b style={{ color: INK }}>{creatorFirst}</b>, who started this pact, can change who sees it.
              </div>
            </div>
          )}
        </div>
      </div>
    </BodyPortal>
  )
}
