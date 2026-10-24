'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Globe, Heart, Lock, UserPlus, Users, X } from 'lucide-react'
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

type Person = { id: string; name: string; avatarUrl: string | null; isYou: boolean; isCreator: boolean; moment: PostedMoment | null }

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
    people.push({ id, name: isYou ? 'You' : name, avatarUrl, isYou, isCreator: id === creatorId, moment: today.get(id) ?? null })
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

function PersonFace({ person, size, ring }: { person: Pick<Person, 'name' | 'avatarUrl'>; size: number; ring?: React.CSSProperties }) {
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
        String(person.name || '?').charAt(0).toUpperCase()
      )}
    </span>
  )
}

/** Posted: solid navy ring. Not yet: dashed. */
function StatusFace({ person, size, posted }: { person: Pick<Person, 'name' | 'avatarUrl'>; size: number; posted: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={{ border: posted ? `3px solid ${NAVY}` : '2px dashed #B9AF9B' }} aria-hidden="true" />
      <span className="absolute" style={{ inset: 5 }}>
        <PersonFace person={person} size={size - 10} />
      </span>
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
 * Who posted today and who can see this pact, in one sheet. Only the person
 * who started the pact gets Invite and Make Private; everyone else reads.
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
  const { people, kind, circle } = audience
  const creatorFirst = firstName(creatorName)
  const names = (Array.isArray(circle?.members_preview) ? circle.members_preview : []).filter((member: any) => member?.name).map((member: any) => firstName(member.name))
  const memberCount = Number(circle?.member_count ?? 0)
  const circleSub = memberCount > 0
    ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}${names.length ? ` · ${names.slice(0, 3).join(', ')}${memberCount > Math.min(3, names.length) ? ` and ${memberCount - Math.min(3, names.length)} more` : ''}` : ''}`
    : 'Everyone in the circle'
  const watchers = Number(pact?.watcher_count ?? 0)
  const price = pact?.watch_price ? `₹${pact.watch_price}` : null

  return (
    <BodyPortal>
      <div role="dialog" aria-modal="true" aria-label="Who can see this pact" className="fixed inset-0 z-[90] flex items-end justify-center">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
        <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[24px] pb-[max(1.5rem,env(safe-area-inset-bottom))]" style={{ background: '#F4EFE4', color: INK }}>
          <div className="mx-auto mt-2.5 h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
          <div className="flex items-center pl-5 pr-2 pt-1.5">
            <div className="flex-1 text-[18px] font-extrabold tracking-[-0.02em]">Who Can See</div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center">
              <X className="size-[22px]" strokeWidth={2.2} />
            </button>
          </div>

          {(() => {
            const fmt = (value?: string | null) => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '')
            const from = fmt(pact?.start_date)
            const to = fmt(pact?.end_date)
            const owner = (
              <>
                <PersonFace person={{ name: creatorName, avatarUrl: pact?.creator_avatar_url || null }} size={28} />
                <span className="min-w-0 flex-1 truncate text-[13.5px]" style={{ color: MUTED }}>
                  Started by <span className="font-extrabold" style={{ color: INK }}>{isCreatorView ? 'you' : creatorName}</span>
                  {from ? ` · ${from}${to ? ` – ${to}` : ''}` : ''}
                </span>
              </>
            )
            return pact?.creator_username ? (
              <Link href={`/profile/${encodeURIComponent(pact.creator_username)}`} className="flex items-center gap-2.5 px-5 pt-2">{owner}</Link>
            ) : (
              <div className="flex items-center gap-2.5 px-5 pt-2">{owner}</div>
            )
          })()}

          <Section>{ended ? 'IN THIS PACT' : 'TODAY'}</Section>
          {people.map((person) => {
            const at = timeOf(person.moment?.uploadedAt)
            const role = person.isCreator ? 'Creator · ' : ''
            return (
              <div key={person.id} className="flex items-center gap-3 px-5 py-2">
                <StatusFace person={person} size={44} posted={Boolean(person.moment)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-extrabold">{person.name}</div>
                  <div className="text-[13px]" style={{ color: MUTED }}>
                    {ended || !canViewMoments ? (person.isCreator ? 'Creator' : 'In the pact') : person.moment ? `${role}Posted${at ? ` at ${at}` : ' today'}` : `${role}not posted yet`}
                  </div>
                </div>
                {person.moment && canViewMoments && !ended && (
                  <button type="button" onClick={() => onWatch(person.moment!.id)} className="h-11 shrink-0 rounded-full px-4 text-[13.5px] font-extrabold" style={{ border: `1px solid ${INK}`, color: INK }}>
                    Watch
                  </button>
                )}
                {person.isYou && !person.moment && isParticipant && !ended && (
                  <button type="button" onClick={onPost} className="h-11 shrink-0 rounded-full px-4 text-[13.5px] font-extrabold" style={{ background: NAVY, color: '#FFFFFF' }}>
                    Post Day {currentDay}
                  </button>
                )}
              </div>
            )
          })}

          <Section>SEEN BY</Section>
          {kind === 'circle' && (
            <AudienceRow dark icon={<Users className="size-5" strokeWidth={2} />} title={pact?.circle_name || circle?.name || 'Circle'} sub={circleSub} href={`/circles/${pact.circle_id}`} />
          )}
          {kind === 'followers' && (
            <AudienceRow icon={<Heart className="size-5" strokeWidth={2} />} title="Followers" sub={`People who follow ${creatorFirst}`} />
          )}
          {kind === 'public' && (
            <AudienceRow icon={<Globe className="size-5" strokeWidth={2} />} title="Everyone" sub="Anyone on CirclePact can watch" />
          )}
          {pact?.media_locked && (
            <AudienceRow
              dark={kind !== 'circle'}
              icon={<Lock className="size-5" strokeWidth={2} />}
              title={price ? `Private · ${price} to watch` : 'Private'}
              sub={`${watchers > 0 ? `${watchers} approved to watch · ` : ''}${kind === 'circle' ? 'Paid on top of the circle' : `Paid straight to ${isCreatorView ? 'you' : creatorFirst}`}`}
            />
          )}
          {isCreatorView && !ended && (
            <button type="button" onClick={onInvite} className="flex w-full items-center gap-3 px-5 py-2 text-left">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: CARD, border: `1.5px solid ${LINE}` }}>
                <UserPlus className="size-5" strokeWidth={2} />
              </span>
              <span className="block min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold">Invite Someone To This Pact</span>
                <span className="block text-[13px]" style={{ color: MUTED }}>They post and watch with you</span>
              </span>
            </button>
          )}

          {isCreatorView && showTurnOnTips && (
            <AudienceRow icon={<Heart className="size-5" strokeWidth={2} />} title="Turn On Tips" sub="Let people tip you for your pacts" href="/profile/tips" />
          )}

          {isCreatorView ? (
            <div className="mx-5 mt-5 rounded-[22px] p-4" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <div className="flex items-center gap-2.5 text-[15px] font-extrabold">
                <Lock className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                {pact?.media_locked ? 'Private pact' : 'Want fewer eyes on it?'}
              </div>
              <div className="mt-1.5 text-[13.5px] leading-[1.45]" style={{ color: MUTED }}>
                {pact?.media_locked
                  ? `${price ? `${price} to watch. ` : ''}${pendingAsks > 0 ? `${pendingAsks} waiting for you.` : 'Change the price or let people in.'}`
                  : 'Make this pact private. Only you and people you approve can watch, and you can ask a small price.'}
              </div>
              <button type="button" onClick={onPrivacy} className="mt-3 h-12 w-full rounded-full text-[15px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
                {pact?.media_locked ? (pendingAsks > 0 ? `Manage · ${pendingAsks} asking` : 'Manage') : 'Make Private'}
              </button>
            </div>
          ) : (
            <div className="mx-5 mt-5 flex items-start gap-2.5 rounded-[18px] px-4 py-3.5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
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
