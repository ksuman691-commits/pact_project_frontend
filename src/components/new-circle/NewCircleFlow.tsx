'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, Check, ChevronLeft, Globe, Link2, Lock, MessageCircle, Plus, Search, UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '@/components/Avatar'
import OrbitRing, { type OrbitMember } from '@/components/circles/OrbitRing'
import { circleAdvancedService, circleService } from '@/services/api'
import { useFollowers, useFollowing } from '@/hooks/useFollows'
import { useAuthStore } from '@/store/auth'
import { shareCircle, type ShareKind } from '@/lib/circleInvite'
import { titleCase } from '@/lib/titleCase'

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
 * New circle, the short way: name it, choose who's in, and it's live with a
 * way to bring people in. Replaces the six-step "What's the vibe?" wizard.
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
  const [name, setName] = useState('')
  const [about, setAbout] = useState(initialCategory ? `Chasing ${titleCase(initialCategory.replace(/_/g, ' '))} goals together` : '')
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
  const displayName = titleCase(cleanName)
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

  const header = (back: (() => void) | null, index: number) => (
    <div className="flex items-center px-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {back ? (
        <button type="button" onClick={back} aria-label="Back" className="flex size-11 items-center justify-center" style={{ color: INK }}>
          <ChevronLeft className="size-6" />
        </button>
      ) : (
        <span className="size-11" />
      )}
      <div className="flex flex-1 justify-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[5px] w-[22px] rounded-full" style={{ background: i <= index ? INK : '#D4CBB8' }} />
        ))}
      </div>
      <button type="button" onClick={onExit} aria-label="Close" className="flex size-11 items-center justify-center" style={{ color: INK }}>
        <X className="size-5" />
      </button>
    </div>
  )

  const meFace: OrbitMember = { user_id: me?.id, full_name: me?.full_name, username: me?.username, avatar_url: me?.avatar_url, sent_proof_this_week: true, is_you: true }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto" style={{ background: PAPER, color: INK }}>
      {step === 'name' && (
        <>
          {header(null, 0)}
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <div className="flex items-center gap-4 pt-2.5">
              <OrbitRing
                name={displayName || 'New Circle'}
                photoUrl={photo?.url}
                members={[meFace]}
                total={1}
                active={0}
                size={116}
                center={
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label={photo ? 'Change the circle photo' : 'Add a circle photo'}
                    className="absolute bottom-[18px] right-[18px] z-10 flex size-[30px] items-center justify-center rounded-full"
                    style={{ background: '#FFFFFF', color: INK, boxShadow: `0 0 0 1px ${LINE}, 0 4px 10px -4px rgba(23,24,29,0.35)` }}
                  >
                    <Camera className="size-[15px]" strokeWidth={2.2} />
                  </button>
                }
              />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
              <p className="text-[13.5px] leading-snug" style={{ color: MUTED }}>
                This is your circle&apos;s ring. Members show up on it, and it fills as they post each week.
              </p>
            </div>

            <label className="mt-6 block">
              <span className="block text-[30px] font-extrabold tracking-[-0.03em]" style={{ color: INK }}>Name it</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                placeholder="Morning Runners"
                enterKeyHint="next"
                onKeyDown={(e) => { if (e.key === 'Enter' && ready) setStep('who') }}
                className="mt-2 w-full border-0 border-b-2 bg-transparent pb-2.5 pt-1.5 text-[21px] font-semibold outline-none placeholder:text-[17px] placeholder:font-medium placeholder:text-[#A39C8C]"
                style={{ borderColor: INK, color: INK }}
              />
            </label>

            <label className="mt-5 block">
              <span className="block text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>WHAT IT&apos;S FOR · OPTIONAL</span>
              <input
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, 140))}
                placeholder="5 km before 7 am on weekdays"
                className="mt-2 h-12 w-full rounded-[14px] px-3.5 text-[15px] font-medium outline-none placeholder:text-[#A39C8C]"
                style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}
              />
            </label>

            <div className="mt-5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>OR START FROM ONE OF THESE</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button key={starter} type="button" onClick={() => setName(starter)} className="h-9 rounded-full px-3.5 text-[13.5px] font-bold" style={pill(displayName === starter)}>
                  {starter}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              disabled={!ready}
              onClick={() => setStep('who')}
              className="h-14 w-full rounded-full text-[16.5px] font-extrabold"
              style={ready ? { background: INK, color: '#FFFFFF' } : { background: '#E1DACB', color: '#7A7B80' }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {step === 'who' && (
        <>
          {header(() => setStep('name'), 1)}
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <div className="pt-2 text-[28px] font-extrabold leading-tight tracking-[-0.03em]" style={{ color: INK }}>Who&apos;s in?</div>
            <div className="mt-1.5 text-[14px]" style={{ color: MUTED }}>{displayName}</div>

            <div className="mt-5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>WHO CAN JOIN</div>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Who can join">
              {(
                [
                  { id: false, label: 'Open', desc: 'Anyone can join and watch its open pacts.', icon: <Globe className="size-4" strokeWidth={2.2} /> },
                  { id: true, label: 'Private', desc: 'You approve each person who asks.', icon: <Lock className="size-[15px]" strokeWidth={2.2} /> },
                ] as const
              ).map((option) => {
                const on = isPrivate === option.id
                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setIsPrivate(option.id)}
                    className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-[18px] p-3 text-left"
                    style={{ background: on ? '#FFFFFF' : CARD, border: on ? `2px solid ${INK}` : `1px solid ${LINE}` }}
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex size-8 items-center justify-center rounded-full" style={on ? { background: INK, color: '#FFFFFF' } : { background: '#EFEBE1', color: INK }}>
                        {option.icon}
                      </span>
                      <span className="size-5 rounded-full" style={on ? { border: `6px solid ${INK}` } : { border: '2px solid #B9AF9A' }} />
                    </span>
                    <span className="text-[15.5px] font-extrabold" style={{ color: INK }}>{option.label}</span>
                    <span className="text-[12.5px] leading-snug" style={{ color: MUTED }}>{option.desc}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>INVITE PEOPLE YOU FOLLOW</span>
              {invited.length > 0 && <span className="text-[12.5px] font-extrabold" style={{ color: NAVY }}>{invited.length} picked</span>}
            </div>
            {following.length > 6 && (
              <label className="mt-2 flex h-11 items-center gap-2 rounded-[14px] px-3.5" style={{ background: CARD, border: `1px solid ${LINE}`, color: MUTED }}>
                <Search className="size-4 shrink-0" strokeWidth={2.2} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names" aria-label="Search people you follow" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#A39C8C]" style={{ color: INK }} />
              </label>
            )}
            <div className="mt-2 overflow-hidden rounded-[18px]" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
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
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: NAVY, color: '#FFFFFF' }}>
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

            <div className="mt-3 flex items-center gap-3 rounded-[18px] px-3.5 py-3" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold" style={{ color: INK }}>Tell My Followers</span>
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
                style={{ background: notify ? NAVY : '#D4D5D9' }}
              >
                <span className="absolute top-1 size-6 rounded-full bg-white transition-all" style={{ left: notify ? 24 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => void create()}
              disabled={creating}
              className="h-14 w-full rounded-full text-[16.5px] font-extrabold disabled:opacity-70"
              style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }}
            >
              {creating ? 'Starting your circle…' : 'Start the Circle'}
            </button>
          </div>
        </>
      )}

      {step === 'live' && created && (
        <>
          <div className="flex justify-end px-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button type="button" onClick={() => router.push(`/circles/${created.id}`)} aria-label="Close" className="flex size-11 items-center justify-center" style={{ color: INK }}>
              <X className="size-5" />
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5">
            <OrbitRing
              name={created.name}
              photoUrl={created.photoUrl || photo?.url}
              members={[
                meFace,
                ...invited
                  .map((id) => following.find((p) => p.id === id))
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((p: any) => ({ user_id: p.id, full_name: p.full_name, username: p.username, avatar_url: p.avatar_url, sent_proof_this_week: false })),
              ]}
              total={1 + invited.length}
              active={0}
              size={208}
              duration="70s"
            />
            <h1 className="mt-4 text-center text-[30px] font-extrabold leading-tight tracking-[-0.035em]" style={{ color: INK }}>{created.name} is live.</h1>
            <p className="mt-1.5 max-w-[310px] text-center text-[14.5px] leading-snug" style={{ color: MUTED }}>
              {[
                created.invitesSent > 0 ? `${created.invitesSent} ${created.invitesSent === 1 ? 'invite' : 'invites'} sent. They join the ring when they say yes.` : 'Bring a few people in. Circles work best with three or more.',
                created.told ? `${followerCount.toLocaleString('en-IN')} ${followerCount === 1 ? 'follower' : 'followers'} heard about it.` : '',
              ].filter(Boolean).join(' ')}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-extrabold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>
                {isPrivate ? <Lock className="size-3" strokeWidth={2.6} /> : <Globe className="size-3" strokeWidth={2.6} />}
                {isPrivate ? 'Private · You Approve' : 'Open · Anyone Can Join'}
              </span>
              <span className="rounded-full px-3 py-1 text-[12px] font-extrabold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>1 Member</span>
            </div>

            <div className="mt-5 self-stretch text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>GET MORE PEOPLE IN</div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 self-stretch">
              {(
                [
                  ['native', 'Invite', <UserPlus key="i" className="size-[22px]" />],
                  ['whatsapp', 'WhatsApp', <MessageCircle key="w" className="size-[22px]" />],
                  ['copy', 'Copy Link', <Link2 key="c" className="size-[22px]" />],
                ] as [ShareKind, string, React.ReactNode][]
              ).map(([kind, label, icon]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => void shareCircle(kind, { id: created.id, name: created.name, isPrivate })}
                  className="flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] text-[13px] font-bold transition active:scale-95"
                  style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={firstPact}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16.5px] font-extrabold"
              style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }}
            >
              <Plus className="size-[18px]" strokeWidth={2.4} />
              Start the First Pact
            </button>
            <button
              type="button"
              onClick={() => router.push(`/circles/${created.id}`)}
              className="h-[52px] w-full rounded-full text-[15.5px] font-extrabold"
              style={{ border: `1.5px solid ${INK}`, color: INK }}
            >
              See My Circle
            </button>
          </div>
        </>
      )}
    </div>
  )
}
