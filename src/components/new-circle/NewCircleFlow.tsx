'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, Check, Globe, Link2, Lock, MessageCircle, Plus, Search, UserPlus, X } from 'lucide-react'
import FlowHero, { FlowFooter, Segmented } from '@/components/flow/FlowHero'
import HeroMark from '@/components/brand/HeroMark'
import toast from 'react-hot-toast'
import Avatar from '@/components/Avatar'
import OrbitRing, { type OrbitMember } from '@/components/circles/OrbitRing'
import { circleAdvancedService, circleService } from '@/services/api'
import { useFollowers, useFollowing } from '@/hooks/useFollows'
import { useAuthStore } from '@/store/auth'
import { shareCircle, type ShareKind } from '@/lib/circleInvite'
import { fireConfetti, stopConfetti } from '@/lib/celebrations'
import { haptic } from '@/lib/motion'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const CARD = '#FBF8F1'
const PAPER = '#F4EFE4'
const SOFT = '#ECE6D8'

type Step = 'name' | 'who' | 'live'

const STARTERS = ['Morning Runners', 'Gym Buddies', 'Book Club', 'No Sugar Squad', 'Study Hall', 'Early Risers']

function pill(on: boolean): React.CSSProperties {
  return on ? { background: INK, color: '#FFFFFF', border: `1px solid ${INK}` } : { background: CARD, color: INK, border: `1px solid ${LINE}` }
}

function listOf(data: any): any[] {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

/**
 * New circle in two screens: name it, choose who's in, and it's live with a
 * way to bring people in. Same look as New pact and Send a dare: the navy top
 * holds a live card of the circle (ring, name, purpose, open or private,
 * who's invited), so nothing is repeated on the screens below.
 */
export default function NewCircleFlow({
  onExit,
  initialInviteUserIds = [],
  initialCategory = null,
  initialPactId = null,
}: {
  onExit: () => void
  initialInviteUserIds?: number[]
  /** From a goal match ("start a circle with them"): seeds what it's for and the first pact. */
  initialCategory?: string | null
  initialPactId?: number | null
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const me = useAuthStore((state) => state.user)
  const followerCount = listOf(useFollowers(me?.id).data).length
  const followingQuery = useFollowing(me?.id)
  const following = useMemo(() => listOf(followingQuery.data).filter((p) => p?.id != null && p.id !== me?.id), [followingQuery.data, me?.id])

  const [step, setStep] = useState<Step>('name')

  // The circle is born: a little confetti and a buzz, once, when it goes live.
  useEffect(() => {
    if (step !== 'live') return
    const timer = window.setTimeout(() => {
      haptic(30)
      fireConfetti('medium', { y: 0.34 })
    }, 600)
    return () => {
      window.clearTimeout(timer)
      stopConfetti()
    }
  }, [step])
  const [name, setName] = useState('')
  const [about, setAbout] = useState(initialCategory ? `Chasing ${initialCategory.replace(/_/g, ' ')} goals together` : '')
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [invited, setInvited] = useState<number[]>(initialInviteUserIds)
  const [query, setQuery] = useState('')
  const [tellFollowers, setTellFollowers] = useState(true)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ id: number; name: string; photoUrl: string | null; invitesSent: number; told: boolean } | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'name') window.setTimeout(() => nameRef.current?.focus(), 250)
  }, [step])

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url)
  }, [photo])

  const cleanName = name.trim().replace(/\s+/g, ' ')
  const ready = cleanName.length >= 2
  const displayName = cleanName
  const notify = followerCount > 0 && tellFollowers

  const people = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? following.filter((p) => `${p.full_name || ''} ${p.username || ''}`.toLowerCase().includes(q))
      : following
    // People you've picked stay at the top.
    return [...list].sort((a, b) => Number(invited.includes(b.id)) - Number(invited.includes(a.id)))
  }, [following, query, invited])

  const toggle = (id: number) => setInvited((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const pickPhoto = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Pick a photo')
      return
    }
    setPhoto({ file, url: URL.createObjectURL(file) })
  }

  const create = async () => {
    if (!ready || creating) return
    setCreating(true)
    let circleId: number
    try {
      const response = await circleService.create({
        name: displayName,
        description: about.trim(),
        visibility: isPrivate ? 'private' : 'public',
        icon_emoji: null,
        notify_followers: notify,
      })
      circleId = Number(response?.data?.id)
      if (!circleId) throw new Error('no id')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not start the circle. Try again.')
      setCreating(false)
      return
    }

    // The circle exists now; a photo or an invite that fails shouldn't undo that.
    let photoUrl: string | null = null
    if (photo) {
      try {
        const uploaded = await circleAdvancedService.uploadPhoto(circleId, photo.file)
        photoUrl = uploaded?.data?.photo_url ?? null
      } catch {
        toast("Your circle is live. The photo didn't upload, add it from the circle.")
      }
    }
    const results = await Promise.allSettled(invited.map((userId) => circleAdvancedService.inviteUser(circleId, userId)))
    const invitesSent = results.filter((r) => r.status === 'fulfilled').length
    if (invitesSent < invited.length) toast(`${invited.length - invitesSent} invite${invited.length - invitesSent === 1 ? '' : 's'} didn't send. Try again from the circle.`)

    await queryClient.invalidateQueries({ queryKey: ['circles'] })
    setCreated({ id: circleId, name: displayName, photoUrl, invitesSent, told: notify })
    setCreating(false)
    setStep('live')
  }

  const firstPact = () => {
    if (!created) return
    const params = new URLSearchParams({ circleId: String(created.id) })
    if (initialCategory) params.set('category', initialCategory)
    if (initialPactId != null) params.set('pactId', String(initialPactId))
    router.push(`/pacts/create?${params.toString()}`)
  }

  const meFace: OrbitMember = { user_id: me?.id, full_name: me?.full_name, username: me?.username, avatar_url: me?.avatar_url, sent_proof_this_week: true, is_you: true }
  const invitedPeople = invited.map((id) => following.find((p) => p.id === id)).filter(Boolean) as any[]
  const ringMembers: OrbitMember[] = [
    meFace,
    ...invitedPeople.slice(0, 6).map((p) => ({ user_id: p.id, full_name: p.full_name, username: p.username, avatar_url: p.avatar_url, sent_proof_this_week: false })),
  ]
  const primary = 'flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-bold transition active:scale-[0.98]'

  // The live card: the circle as it will look, filling in as you answer.
  const card = (
    <div className="flex items-center gap-3.5 rounded-[22px] bg-white px-3.5 py-3 text-[var(--ink)]" style={{ boxShadow: '0 0 0 1.5px #17181D, 0 3px 0 rgba(10,20,70,0.45)' }} aria-live="polite" aria-label="Preview of your circle">
      <div className="relative shrink-0">
        <OrbitRing name={displayName || 'New circle'} photoUrl={photo?.url} members={ringMembers} total={ringMembers.length} active={0} size={92} />
        {step === 'name' && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={photo ? 'Change the circle photo' : 'Add a circle photo'}
            className="absolute -bottom-0.5 -right-0.5 z-10 flex size-[30px] items-center justify-center rounded-full bg-white"
            style={{ color: INK, boxShadow: `0 0 0 1.5px ${INK}` }}
          >
            <Camera className="size-[15px]" strokeWidth={2.2} />
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`line-clamp-2 text-[22px] font-bold leading-[1.1] tracking-[-0.03em] ${displayName ? '' : 'opacity-35'}`}>{displayName || 'Morning Runners'}</p>
        {about.trim() && <p className="mt-1 line-clamp-2 text-[13px] leading-snug" style={{ color: MUTED }}>{about.trim()}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span key={String(isPrivate)} className="cp-pop-in flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold" style={{ background: '#E8EDFA', color: NAVY }}>
            {isPrivate ? <Lock className="size-3" strokeWidth={2.6} /> : <Globe className="size-3" strokeWidth={2.6} />}
            {isPrivate ? 'Private' : 'Open'}
          </span>
          {invited.length > 0 && (
            <span key={invited.length} className="cp-pop-in flex h-6 items-center rounded-full px-2 text-[11.5px] font-bold text-white" style={{ background: NAVY }}>
              {invited.length} invited
            </span>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto" style={{ background: PAPER, color: INK }}>
      {(step === 'name' || step === 'who') && (
        <FlowHero tone="navy" steps={['Name it', "Who's in"]} current={step === 'name' ? 0 : 1} onBack={step === 'who' ? () => setStep('name') : undefined} onExit={onExit}>
          {card}
        </FlowHero>
      )}

      {step === 'name' && (
        <>
          <div key="name" className="pact-step-enter mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6">
            <label className="block">
              <span className="block text-[26px] font-bold leading-[1.1] tracking-[-0.03em]">Name your circle</span>
              <span className="mt-1.5 block text-[14.5px]" style={{ color: MUTED }}>Its ring fills up as members post each week.</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                placeholder="Morning Runners"
                enterKeyHint="next"
                onKeyDown={(e) => { if (e.key === 'Enter' && ready) setStep('who') }}
                className="mt-4 h-14 w-full rounded-[18px] bg-[var(--card)] px-4 text-[20px] font-semibold shadow-[inset_0_0_0_1.5px_#DCD3C1] outline-none placeholder:font-medium placeholder:text-[#A39C8C] focus:shadow-[inset_0_0_0_2px_#1F3A93] focus-visible:outline-none"
                style={{ color: INK }}
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 flex items-baseline justify-between">
                <span className="text-[14px] font-bold">What it&apos;s for</span>
                <span className="text-[12.5px]" style={{ color: MUTED }}>Optional</span>
              </span>
              <input
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, 140))}
                placeholder="5 km before 7 am on weekdays"
                className="h-12 w-full rounded-[14px] bg-[var(--card)] px-3.5 text-[15px] font-medium shadow-[inset_0_0_0_1px_#DCD3C1] outline-none placeholder:text-[#A39C8C] focus:shadow-[inset_0_0_0_2px_#1F3A93] focus-visible:outline-none"
                style={{ color: INK }}
              />
            </label>

            {!ready && (
              <>
                <div className="mb-2 mt-5 text-[14px] font-bold">Or start from one of these</div>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((starter) => (
                    <button key={starter} type="button" onClick={() => setName(starter)} className="h-10 rounded-full px-3.5 text-[14px] font-bold transition active:scale-95" style={pill(displayName === starter)}>
                      {starter}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <FlowFooter>
            <div className="mx-auto max-w-md">
              <button
                type="button"
                disabled={!ready}
                onClick={() => setStep('who')}
                className={primary}
                style={ready ? { background: NAVY, color: '#FFFFFF', boxShadow: '0 3px 0 #142766' } : { background: '#E1DACB', color: '#7A7B80' }}
              >
                Next: who&apos;s in
              </button>
            </div>
          </FlowFooter>
        </>
      )}

      {step === 'who' && (
        <>
          <div key="who" className="pact-step-enter mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6">
            <div className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em]">Who&apos;s in?</div>

            <div className="mb-2 mt-4 text-[14px] font-bold">Who can join</div>
            <Segmented
              tone="navy"
              label="Who can join"
              value={isPrivate ? 'private' : 'open'}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'private', label: 'Private' },
              ]}
              onChange={(v) => setIsPrivate(v === 'private')}
            />
            <p className="mt-2 text-[13px] leading-snug" style={{ color: MUTED }}>
              {isPrivate ? 'People ask to join and you approve each one.' : 'Anyone can join and watch its open pacts.'}
            </p>

            <div className="mb-2 mt-5 flex items-baseline justify-between">
              <span className="text-[14px] font-bold">Invite people you follow</span>
              {invited.length > 0 && <span className="text-[13px] font-bold" style={{ color: NAVY }}>{invited.length} picked</span>}
            </div>
            {following.length > 6 && (
              <label className="mb-2 flex h-11 items-center gap-2 rounded-[14px] px-3.5" style={{ background: CARD, boxShadow: `inset 0 0 0 1px ${LINE}`, color: MUTED }}>
                <Search className="size-4 shrink-0" strokeWidth={2.2} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names" aria-label="Search people you follow" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none focus-visible:outline-none placeholder:text-[#A39C8C]" style={{ color: INK }} />
              </label>
            )}
            <div className="overflow-hidden rounded-[18px]" style={{ background: '#FFFFFF', boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              {followingQuery.isLoading ? (
                <div className="px-4 py-4 text-[13.5px]" style={{ color: MUTED }}>Loading people you follow…</div>
              ) : following.length === 0 ? (
                <div className="px-4 py-4 text-[13.5px] leading-snug" style={{ color: MUTED }}>You&apos;re not following anyone yet. You&apos;ll get a link to share on WhatsApp once it&apos;s live.</div>
              ) : people.length === 0 ? (
                <div className="px-4 py-4 text-[13.5px]" style={{ color: MUTED }}>No one by that name.</div>
              ) : (
                <div className="max-h-[264px] overflow-y-auto">
                  {people.map((person, index) => {
                    const on = invited.includes(person.id)
                    return (
                      <button
                        key={person.id}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(person.id)}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left"
                        style={{ borderBottom: index === people.length - 1 ? 0 : `1px solid ${SOFT}` }}
                      >
                        <Avatar name={person.full_name || person.username} avatarUrl={person.avatar_url} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-bold" style={{ color: INK }}>{person.full_name || person.username}</span>
                          {person.username && <span className="block truncate text-[12.5px]" style={{ color: MUTED }}>@{person.username}</span>}
                        </span>
                        {on ? (
                          <span className="cp-pop-in flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: NAVY, color: '#FFFFFF', boxShadow: `0 0 0 1.5px ${INK}` }}>
                            <Check className="size-[13px]" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="size-6 shrink-0 rounded-full" style={{ border: '2px solid #B9AF9A' }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-[18px] px-3.5 py-3" style={{ background: CARD, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold" style={{ color: INK }}>Tell my followers</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>
                  {followerCount === 0
                    ? 'No followers yet. Share the link once it’s live.'
                    : `${followerCount.toLocaleString('en-IN')} ${followerCount === 1 ? 'follower gets' : 'followers get'} one notification and can ${isPrivate ? 'ask to join' : 'join'}.`}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notify}
                aria-label="Tell my followers"
                disabled={followerCount === 0}
                onClick={() => setTellFollowers((value) => !value)}
                className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-50"
                style={{ background: notify ? NAVY : '#D4CBB8', boxShadow: `inset 0 0 0 1.5px ${INK}` }}
              >
                <span className="absolute top-1 size-6 rounded-full bg-white transition-[left]" style={{ left: notify ? 24 : 4, boxShadow: `0 0 0 1.5px ${INK}` }} />
              </button>
            </div>
          </div>
          <FlowFooter>
            <div className="mx-auto max-w-md">
              <button type="button" onClick={() => void create()} disabled={creating} className={primary} style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 3px 0 #142766', opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Starting your circle…' : invited.length > 0 ? `Start the circle and invite ${invited.length}` : 'Start the circle'}
              </button>
            </div>
          </FlowFooter>
        </>
      )}

      {/* Live: the navy register of "Your pact is live" and "Dare sent.", with the ring assembling. */}
      {step === 'live' && created && (
        <div className="relative isolate flex min-h-full flex-1 flex-col overflow-hidden text-white" style={{ background: 'linear-gradient(180deg, #2546A6 0%, #1F3A93 60%)' }}>
          <span aria-hidden="true" className="pointer-events-none absolute -z-10" style={{ right: -90, top: -90 }}>
            <HeroMark size={240} color="#2A4CB0" stroke="rgba(255,255,255,0.55)" ringColor="rgba(255,255,255,0.16)" />
          </span>
          <div className="flex justify-end px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button type="button" onClick={() => router.push(`/circles/${created.id}`)} aria-label="Close" className="flex size-10 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.45)' }}>
              <X className="size-5" />
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5">
            <div className="rounded-full bg-white p-2" style={{ boxShadow: `0 0 0 1.5px ${INK}, 0 4px 0 rgba(10,20,70,0.45)` }}>
              <OrbitRing
                name={created.name}
                photoUrl={created.photoUrl || photo?.url}
                members={ringMembers}
                total={1 + invited.length}
                active={0}
                size={196}
                duration="70s"
                assemble
              />
            </div>
            <h1 className="cp-rise mt-5 text-center text-[36px] font-bold leading-[1.05] tracking-[-0.04em]" style={{ ['--cp-delay' as string]: '0.9s' }}>{created.name} is live.</h1>
            <p className="cp-rise mt-2 max-w-[310px] text-center text-[15px] leading-snug" style={{ color: '#D4DBFA', ['--cp-delay' as string]: '1s' }}>
              {[
                created.invitesSent > 0 ? `${created.invitesSent} ${created.invitesSent === 1 ? 'invite' : 'invites'} sent. They join the ring when they say yes.` : 'Bring a few people in. Circles work best with three or more.',
                created.told ? `${followerCount.toLocaleString('en-IN')} ${followerCount === 1 ? 'follower' : 'followers'} heard about it.` : '',
              ].filter(Boolean).join(' ')}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <span className="flex h-7 items-center gap-1 rounded-full px-3 text-[12.5px] font-bold" style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)' }}>
                {isPrivate ? <Lock className="size-3" strokeWidth={2.6} /> : <Globe className="size-3" strokeWidth={2.6} />}
                {isPrivate ? 'Private, you approve' : 'Open, anyone can join'}
              </span>
            </div>

            <div className="cp-rise mt-6 self-stretch text-[14px] font-bold" style={{ ['--cp-delay' as string]: '1.15s' }}>Get more people in</div>
            <div className="cp-rise mt-2 grid grid-cols-3 gap-2 self-stretch" style={{ ['--cp-delay' as string]: '1.25s' }}>
              {(
                [
                  ['native', 'Invite', <UserPlus key="i" className="size-[22px]" />],
                  ['whatsapp', 'WhatsApp', <MessageCircle key="w" className="size-[22px]" />],
                  ['copy', 'Copy link', <Link2 key="c" className="size-[22px]" />],
                ] as [ShareKind, string, React.ReactNode][]
              ).map(([kind, label, icon]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => void shareCircle(kind, { id: created.id, name: created.name, isPrivate, purpose: about })}
                  className="flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] text-[13px] font-bold transition active:scale-95"
                  style={{ background: '#2A4AAC', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), 0 2px 0 rgba(10,20,70,0.55)' }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-col gap-1 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
            <button type="button" onClick={firstPact} className={primary} style={{ background: '#FFFFFF', color: NAVY, boxShadow: `0 0 0 1.5px ${INK}` }}>
              <Plus className="size-[18px]" strokeWidth={2.4} />
              Start the first pact
            </button>
            <button type="button" onClick={() => router.push(`/circles/${created.id}`)} className="h-11 w-full text-[15px] font-bold underline decoration-2 underline-offset-4" style={{ textDecorationColor: 'rgba(255,255,255,0.4)' }}>
              See my circle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
