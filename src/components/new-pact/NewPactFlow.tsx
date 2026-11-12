'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, ChevronLeft, ChevronRight, Globe, Heart, Lock, Plus, Search, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import PriceChooser from '@/components/private/PriceChooser'
import { useCreatePact } from '@/hooks/usePactMutations'
import { pactService } from '@/services/api'
import { useCircles } from '@/hooks/useCircles'
import { useBackToClose } from '@/hooks/useBackToClose'
import { useMyTipSettings } from '@/hooks/useTips'
import { useFollowers } from '@/hooks/useFollows'
import { useAuthStore } from '@/store/auth'
import { createStory, putStoryVideo, requestStoryUploadUrl } from '@/lib/api/stories'
import { IDEAS, parseSentence, sentenceTitle, type Frequency } from '@/lib/pactSentence'
import { STORY_MAX_SECONDS } from '@/lib/stories'
import { titleCase } from '@/lib/titleCase'
import PactLiveBeat from '@/components/celebrations/PactLiveBeat'
import { pactInviteMessage } from '@/lib/inviteMessages'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const CARD = '#FBF8F1'
const PAPER = '#F4EFE4'
/** A pact with no photo yet: true blue, lighter top-left. The same tile as pact cards. */
const PACT_BLUE_TILE = 'radial-gradient(120% 90% at 25% 15%, #2E4DB3 0%, #1F3A93 55%, #142766 100%)'

/** Say it, choose who, shoot Day 1, review, then it's live. The camera comes after the audience is decided. */
type Step = 'say' | 'who' | 'shoot' | 'review' | 'live'
/** Who sees the pact. Private moments are a separate lock on top of any of these. */
type Audience = 'circle' | 'followers' | 'public'

interface Clip {
  blob: Blob
  contentType: string
  duration: number
  url: string
}

const DAY_OPTIONS = [7, 14, 21, 30, 60]
const FREQUENCIES: Frequency[] = ['Every day', 'Every morning', 'Every night', 'Weekdays', 'Every week']

function localToday(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function pill(on: boolean): React.CSSProperties {
  return on
    ? { background: NAVY, color: '#FFFFFF', border: `1px solid ${NAVY}` }
    : { background: CARD, color: INK, border: `1px solid ${LINE}` }
}

/**
 * New pact, the short way: shoot Day 1, say what you'll do in one sentence,
 * pick who's in, and it's live with the moment already in it.
 * Replaces the six-step "What's the vibe?" wizard.
 */
export default function NewPactFlow({ onExit, initialCircleId = null, initialText = '', sprint = false, first = false }: { onExit: () => void; initialCircleId?: number | null; initialText?: string | null; /** From a quiet circle's "Start a 7-day sprint": 7 days, and the circle's members are told. */ sprint?: boolean; /** Right after sign-up: suggests 7 days and says it's their first. */ first?: boolean }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createPact = useCreatePact()
  const circlesQuery = useCircles()
  // One chip per circle, even if the list repeats one (owned and joined).
  const circles = useMemo(() => {
    const seen = new Set<number>()
    return ((circlesQuery.data || []) as any[]).filter((c) => {
      if (c?.id == null || seen.has(Number(c.id))) return false
      seen.add(Number(c.id))
      return true
    })
  }, [circlesQuery.data])
  // Two different circles with the same name get their member count so you can tell them apart.
  const nameCount = useMemo(() => {
    const counts = new Map<string, number>()
    circles.forEach((c) => counts.set(String(c.name).trim().toLowerCase(), (counts.get(String(c.name).trim().toLowerCase()) || 0) + 1))
    return counts
  }, [circles])
  const tips = useMyTipSettings()
  const me = useAuthStore((state) => state.user)
  const followerCount = (((useFollowers(me?.id).data as any)?.data || []) as any[]).length

  const [step, setStep] = useState<Step>('say')
  const [clip, setClip] = useState<Clip | null>(null)
  const [text, setText] = useState(initialText || '')
  const [pickedDays, setPickedDays] = useState<number | null>(sprint || first ? 7 : null)
  const [pickedFrequency, setPickedFrequency] = useState<Frequency | null>(null)
  // Nothing is pre-selected: unless opened from a circle, the creator chooses.
  const [chosenAudience, setAudience] = useState<Audience | null>(initialCircleId != null ? 'circle' : null)
  const [pickingCircle, setPickingCircle] = useState(false)
  const [circleSearch, setCircleSearch] = useState('')
  const [circleId, setCircleId] = useState<number | null>(initialCircleId)
  const [posting, setPosting] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [watchPrice, setWatchPrice] = useState<number | null>(null)
  const [autoApprove, setAutoApprove] = useState(false)
  const [created, setCreated] = useState<{ id: number; title: string; days: number } | null>(null)
  // The full-screen "your pact is live" moment plays once, then the share screen is there underneath.
  const inputRef = useRef<HTMLInputElement>(null)

  const audience: Audience | null = chosenAudience
  useBackToClose(pickingCircle, () => setPickingCircle(false))
  useEffect(() => () => {
    if (clip) URL.revokeObjectURL(clip.url)
  }, [clip])

  useEffect(() => {
    if (step === 'say') window.setTimeout(() => inputRef.current?.focus(), 250)
  }, [step])

  const isPhoto = Boolean(clip?.contentType.startsWith('image/'))
  const parsed = parseSentence(text)
  const days = pickedDays ?? parsed.days ?? 30
  const frequency = pickedFrequency ?? parsed.frequency ?? 'Every day'
  const cleanText = text.trim()
  const ready = cleanText.length >= 4
  const title = ready ? sentenceTitle(cleanText, days) : ''
  const circle = circles.find((c) => Number(c.id) === circleId)
  const circleIsPrivate = audience === 'circle' && circle?.visibility === 'private'
  // Selling access needs somewhere for the money to go.
  const needsUpi = locked && Boolean(tips.data) && !tips.data?.enabled
  const needsPrice = locked && watchPrice == null
  const lockHint =
    audience == null
      ? 'Choose who sees it first.'
      : audience === 'circle'
      ? circleIsPrivate
        ? `A premium drop: members of ${circle?.name ?? 'the circle'} pay too. Leave it off and the circle watches free.`
        : 'Circle members pay like anyone. Your followers see it locked and can buy.'
      : audience === 'followers'
        ? 'Followers see it locked in their feed. Anyone with the link can pay to watch.'
        : 'Shows in Discover, locked. Anyone can pay to watch.'

  const post = async () => {
    if (!ready || posting || !audience) return
    const payload = {
      title,
      description: '',
      category: parsed.category,
      circle_id: audience === 'circle' ? circleId : null,
      // 'private' on the backend means the creator's followers.
      visibility: audience === 'circle' ? 'circle_only' : audience === 'followers' ? 'private' : 'public',
      media_locked: locked,
      watch_price: locked ? watchPrice : null,
      watch_auto_approve: locked && watchPrice != null ? autoApprove : false,
      start_date: localToday(),
      duration_days: days,
      verification_method: 'video',
      proof_submission_frequency: frequency === 'Every week' ? 'weekly' : 'daily',
      is_milestone: false,
      sprint: sprint && audience === 'circle',
    }
    setPosting('Starting your pact…')
    let pactId: number
    try {
      const response = await createPact.mutateAsync(payload)
      pactId = Number(response?.data?.id)
      if (!pactId) throw new Error('no id')
    } catch {
      setPosting(null)
      return
    }

    if (clip) {
      try {
        setPosting('Posting Day 1… 0%')
        const onProgress = (fraction: number) => setPosting(`Posting Day 1… ${Math.round(fraction * 100)}%`)
        if (isPhoto) {
          const file = new File([clip.blob], clip.contentType === 'image/png' ? 'day-1.png' : 'day-1.jpg', { type: clip.contentType })
          await pactService.uploadProofFile(pactId, file, 'photo', undefined, undefined, onProgress)
        } else {
          const { upload_url, object_key } = await requestStoryUploadUrl(pactId, { content_type: clip.contentType, size_bytes: clip.blob.size })
          await putStoryVideo(upload_url, clip.blob, clip.contentType, onProgress)
          await createStory(pactId, { object_key, duration_seconds: Math.min(STORY_MAX_SECONDS, Math.max(1, Math.round(clip.duration))) })
        }
      } catch {
        toast("Your pact is live. Day 1 didn't upload, add it from the pact.")
      }
    }

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me-today'] }),
      queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
      queryClient.invalidateQueries({ queryKey: ['stories'] }),
      queryClient.invalidateQueries({ queryKey: ['circles'] }),
      queryClient.invalidateQueries({ queryKey: ['feed'] }),
    ])
    setCreated({ id: pactId, title, days })
    setPosting(null)
    setStep('live')
  }

  // Leaving the live screen always lands on the new pact, so it never seems to vanish.
  const openPact = () => {
    if (!created) return onExit()
    const id = created.id
    onExit()
    router.push(`/pacts/${id}`)
  }

  const pactUrl = created && typeof window !== 'undefined' ? `${window.location.origin}/pacts/${created.id}` : ''
  const share = async (kind: 'native' | 'copy') => {
    if (!created) return
    const message = pactInviteMessage({ title: created.title, mine: true })
    if (kind === 'native' && navigator.share) {
      try {
        await navigator.share({ title: created.title, text: message, url: pactUrl })
        return
      } catch {
        // Dismissed; fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(`${message} ${pactUrl}`)
      toast.success('Invite copied. Paste it anywhere.')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  if (step === 'shoot') {
    return (
      <StoryCaptureSheet
        isOpen
        autoStart
        pactId={0}
        pactTitle={title || 'New pact · Day 1'}
        onCaptured={(captured) => {
          setClip({ ...captured, url: URL.createObjectURL(captured.blob) })
          setStep('review')
        }}
        // Closing the camera, or no camera, still lets the pact start; Day 1 can come later.
        onClose={() => setStep('review')}
        onSkip={() => setStep('review')}
      />
    )
  }

  const header = (back: () => void, index: number) => (
    <div className="flex items-center px-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" onClick={back} aria-label="Back" className="flex size-11 items-center justify-center" style={{ color: INK }}>
        <ChevronLeft className="size-6" />
      </button>
      <div className="flex flex-1 justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[5px] w-[22px] rounded-full" style={{ background: i <= index ? NAVY : '#D4CBB8' }} />
        ))}
      </div>
      <button type="button" onClick={onExit} aria-label="Close" className="flex size-11 items-center justify-center" style={{ color: INK }}>
        <X className="size-5" />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto" style={{ background: PAPER, color: INK }}>
      {step === 'say' && (
        <>
          {header(onExit, 0)}
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <label className="mt-5 block">
              {first && (
                <span className="mb-1 block text-[13.5px] font-semibold" style={{ color: MUTED }}>
                  Your first pact. Start small: 7 days is plenty. You can close this and look around first.
                </span>
              )}
              <span className="block text-[30px] font-extrabold tracking-[-0.03em]" style={{ color: INK }}>I will…</span>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 120))}
                placeholder="run 5 km every morning"
                enterKeyHint="next"
                className="mt-2 w-full border-0 border-b-2 bg-transparent pb-2.5 pt-1.5 text-[21px] font-semibold outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none placeholder:text-[17px] placeholder:font-medium placeholder:text-[#A39C8C]"
                style={{ borderColor: NAVY, color: INK }}
              />
            </label>

            {ready ? (
              <>
                <div className="mt-5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>HOW OFTEN</div>
                <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
                  {FREQUENCIES.map((f) => (
                    <button key={f} type="button" onClick={() => setPickedFrequency(f)} className="h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-bold" style={pill(frequency === f)}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>FOR HOW LONG</div>
                <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
                  {[...new Set([...(parsed.days && !DAY_OPTIONS.includes(parsed.days) ? [parsed.days] : []), ...DAY_OPTIONS])].map((n) => (
                    <button key={n} type="button" onClick={() => setPickedDays(n)} className="h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-bold" style={pill(days === n)}>
                      {n} days
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-[18px] p-4" style={{ background: CARD, border: `1px solid ${LINE}` }}>
                  <div className="text-[11.5px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>YOUR PACT</div>
                  <div className="mt-1 text-[19px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: INK }}>{title}</div>
                  <div className="mt-1 text-[13px]" style={{ color: MUTED }}>
                    {frequency} · {days} days · {parsed.categoryLabel}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>IDEAS TO START</div>
                <div className="mt-2.5 flex flex-col gap-2">
                  {IDEAS.map((idea) => (
                    <button key={idea} type="button" onClick={() => setText(idea)} className="min-h-12 rounded-[16px] px-3.5 py-2.5 text-left text-[14.5px] font-semibold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>
                      {idea.charAt(0).toUpperCase() + idea.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              disabled={!ready}
              onClick={() => setStep('who')}
              className="h-14 w-full rounded-full text-[16.5px] font-extrabold"
              style={ready ? { background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' } : { background: '#E1DACB', color: '#7A7B80' }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {step === 'who' && (
        <>
          {header(() => setStep('say'), 1)}
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <div className="pt-3 text-[28px] font-extrabold leading-tight tracking-[-0.03em]" style={{ color: INK }}>Who&apos;s in on it?</div>
            <div className="mt-1.5 text-[14px]" style={{ color: MUTED }}>{title}</div>
            <div className="mt-5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>WHO SEES IT</div>
            <div className="mt-2 flex flex-col gap-2.5" role="radiogroup" aria-label="Who sees it">
              {(
                [
                  {
                    id: 'circle' as Audience,
                    name: 'A circle',
                    desc: circles.length === 0 ? 'You have no circles yet. Make one.' : circle && audience === 'circle' ? titleCase(String(circle.name || '')) : `Choose one of your ${circles.length} ${circles.length === 1 ? 'circle' : 'circles'}.`,
                    icon: <Users className="size-[22px]" />,
                  },
                  { id: 'followers' as Audience, name: 'My followers', desc: followerCount > 0 ? `${followerCount.toLocaleString('en-IN')} ${followerCount === 1 ? 'follower sees' : 'followers see'} it in their feed.` : 'Shows on your profile and to people who follow you.', icon: <Heart className="size-[22px]" /> },
                  { id: 'public' as Audience, name: 'Everyone', desc: 'Shows in Discover. Anyone can find it.', icon: <Globe className="size-[22px]" /> },
                ]
              ).map((option) => {
                const on = audience === option.id
                const isCircle = option.id === 'circle'
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      if (isCircle) {
                        if (circles.length === 0) return router.push('/circles/create')
                        setPickingCircle(true)
                        return
                      }
                      setAudience(option.id)
                    }}
                    className="flex min-h-[72px] w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left"
                    style={{ background: on ? '#FFFFFF' : CARD, border: on ? `2px solid ${NAVY}` : `1px solid ${LINE}` }}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={on ? { background: NAVY, color: '#FFFFFF' } : { background: '#E8E2D4', color: INK }}>
                      {option.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-extrabold tracking-[-0.01em]" style={{ color: INK }}>{option.name}</span>
                      <span className="mt-px block text-[13.5px] leading-snug" style={{ color: on && isCircle ? NAVY : MUTED, fontWeight: on && isCircle ? 700 : 400 }}>{option.desc}</span>
                    </span>
                    {isCircle && on ? (
                      <span className="flex h-9 shrink-0 items-center rounded-full px-3 text-[13px] font-extrabold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>Change</span>
                    ) : isCircle ? (
                      <ChevronRight className="size-[18px] shrink-0" style={{ color: MUTED }} strokeWidth={2.4} aria-hidden="true" />
                    ) : null}
                    {!(isCircle && !on) && (
                      <span className="size-6 shrink-0 rounded-full" style={on ? { border: `8px solid ${NAVY}` } : { border: '2px solid #B9AF9A' }} />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>EARN FROM IT</div>
            <div className="mt-2 rounded-[24px] p-[18px]" style={{ background: NAVY, color: '#FFFFFF' }}>
              <div className="flex items-start gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full text-[22px] font-extrabold" style={{ background: '#FFFFFF', color: NAVY }} aria-hidden="true">₹</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[19px] font-extrabold leading-tight tracking-[-0.02em]">{locked ? 'Paid moments are on' : 'Get paid for your moments'}</span>
                  <span className="mt-1.5 block text-[13.5px] leading-snug" style={{ color: '#DCE3F7' }}>
                    {locked ? lockHint : 'Lock your moments. People pay to watch, and the money goes straight to your UPI.'}
                  </span>
                </span>
                {locked && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked
                    aria-label="Paid moments"
                    onClick={() => setLocked(false)}
                    className="relative h-8 w-[52px] shrink-0 rounded-full"
                    style={{ background: '#FFFFFF' }}
                  >
                    <span className="absolute top-1 size-6 rounded-full" style={{ background: NAVY, left: 24 }} />
                  </button>
                )}
              </div>
              {locked ? (
                <div className="mt-4">
                  <PriceChooser dark price={watchPrice} onPrice={setWatchPrice} autoApprove={autoApprove} onAutoApprove={setAutoApprove} />
                  {watchPrice != null && (
                    <div className="mt-3.5 rounded-[14px] px-3.5 py-2.5 text-[13px] leading-snug" style={{ background: 'rgba(255,255,255,0.12)', color: '#EEF2FC' }}>
                      <span className="font-extrabold" style={{ color: '#FFFFFF' }}>Example</span> · 20 people at ₹{watchPrice} is ₹{(20 * watchPrice).toLocaleString('en-IN')} for one pact.
                    </div>
                  )}
                  {tips.data && !tips.data.enabled ? (
                    <Link href="/profile/tips" className="mt-3.5 flex min-h-11 items-center rounded-[14px] px-3.5 text-[13.5px] font-bold" style={{ border: '1.5px dashed #FFFFFF', color: '#FFFFFF' }}>
                      Add your UPI first, so people can pay you
                    </Link>
                  ) : tips.data?.upi_id ? (
                    <div className="mt-3.5 flex items-center gap-2.5 rounded-[14px] px-3.5 py-2.5" style={{ border: '1px solid rgba(255,255,255,0.18)' }}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px]" style={{ color: '#BFC2CB' }}>Paid straight to your UPI</span>
                        <span className="mt-px block truncate text-[14.5px] font-bold">{tips.data.upi_id}</span>
                      </span>
                      <Link href="/profile/tips" className="flex h-[34px] items-center rounded-full px-3 text-[13px] font-extrabold" style={{ background: 'rgba(255,255,255,0.14)' }}>Edit</Link>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mt-3.5 rounded-[14px] px-3.5 py-2.5 text-[13px] leading-snug" style={{ background: 'rgba(255,255,255,0.12)', color: '#EEF2FC' }}>
                    <span className="font-extrabold" style={{ color: '#FFFFFF' }}>Example</span> · 20 people at ₹51 is ₹1,020 for one pact.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (watchPrice == null) setWatchPrice(51)
                      setLocked(true)
                    }}
                    className="mt-3.5 h-12 w-full rounded-full text-[15px] font-extrabold"
                    style={{ background: '#FFFFFF', color: NAVY }}
                  >
                    Turn on paid moments
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => setStep('shoot')}
              disabled={!audience || (audience === 'circle' && circleId == null) || needsUpi || needsPrice}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16.5px] font-extrabold disabled:opacity-100"
              style={
                !audience || (audience === 'circle' && circleId == null) || needsUpi || needsPrice
                  ? { background: '#E1DACB', color: '#6B6C72' }
                  : { background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }
              }
            >
              {!audience || (audience === 'circle' && circleId == null) ? (
                'Choose who sees it'
              ) : (
                <>
                  <Camera className="size-5" strokeWidth={2.2} aria-hidden="true" />
                  Next: shoot Day 1
                </>
              )}
            </button>
          </div>

          {pickingCircle && (
            <div role="dialog" aria-modal="true" aria-label="Choose your circle" className="fixed inset-0 z-[75] flex items-end justify-center">
              <button type="button" aria-label="Close" onClick={() => setPickingCircle(false)} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
              <div className="relative flex max-h-[85dvh] min-h-[60dvh] w-full max-w-md flex-col rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" style={{ background: CARD, color: INK }}>
                <div className="mx-auto mb-1.5 h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
                <div className="flex items-center justify-between">
                  <div className="text-[20px] font-extrabold tracking-[-0.02em]">Choose your circle</div>
                  <button type="button" onClick={() => setPickingCircle(false)} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center">
                    <X className="size-5" />
                  </button>
                </div>
                <label className="mt-1 flex h-[46px] shrink-0 items-center gap-2.5 rounded-full px-4" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
                  <Search className="size-[18px]" style={{ color: MUTED }} aria-hidden="true" />
                  <input value={circleSearch} onChange={(e) => setCircleSearch(e.target.value)} placeholder="Search your circles" aria-label="Search your circles" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#7A7B80]" />
                </label>
                <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {(() => {
                    const q = circleSearch.trim().toLowerCase()
                    const matches = circles.filter((c) => !q || String(c.name || '').toLowerCase().includes(q))
                    // Private circles first, public ones below.
                    const groups = [
                      { key: 'private', label: 'PRIVATE', icon: <Lock className="size-3" strokeWidth={2.6} aria-hidden="true" />, sub: 'Members only', list: matches.filter((c) => c.visibility === 'private') },
                      { key: 'public', label: 'PUBLIC', icon: <Globe className="size-3" strokeWidth={2.6} aria-hidden="true" />, sub: 'Anyone can join', list: matches.filter((c) => c.visibility !== 'private') },
                    ].filter((g) => g.list.length > 0)
                    if (groups.length === 0) return <p className="px-1 py-6 text-center text-[14px]" style={{ color: MUTED }}>No circle by that name.</p>
                    return groups.map((g) => (
                      <div key={g.key} role="group" aria-label={`${g.label.toLowerCase()} circles`}>
                        <div className="flex items-center gap-1.5 px-0.5 pb-0.5 pt-3.5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>
                          {g.icon}
                          {g.label} · {g.list.length}
                        </div>
                        {g.list.map((c) => {
                          const same = (nameCount.get(String(c.name).trim().toLowerCase()) || 0) > 1
                          const picked = audience === 'circle' && Number(c.id) === circleId
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCircleId(Number(c.id))
                                setAudience('circle')
                                setPickingCircle(false)
                                setCircleSearch('')
                              }}
                              className="flex min-h-[60px] w-full items-center gap-3 border-b py-1.5 text-left last:border-b-0"
                              style={{ borderColor: '#E6E1D6' }}
                            >
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-[16px] font-extrabold" style={{ background: '#E8E2D4' }}>
                                {String(c.name || '?').trim().charAt(0).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15.5px] font-bold">{titleCase(String(c.name || ''))}</span>
                                <span className="block text-[12.5px]" style={{ color: MUTED }}>{same ? `${c.member_count ?? 0} ${Number(c.member_count ?? 0) === 1 ? 'member' : 'members'}` : g.sub}</span>
                              </span>
                              <span className="size-6 shrink-0 rounded-full" style={picked ? { border: `8px solid ${NAVY}` } : { border: '2px solid #B9AF9A' }} />
                            </button>
                          )
                        })}
                      </div>
                    ))
                  })()}
                </div>
                <Link href="/circles/create" className="mt-2 flex h-[50px] shrink-0 items-center justify-center gap-1.5 rounded-full text-[15px] font-extrabold" style={{ border: `1.5px dashed ${NAVY}`, background: '#F5F7FD', color: NAVY }}>
                  <Plus className="size-4" strokeWidth={2.6} aria-hidden="true" />
                  Create a new circle
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'review' && (
        <>
          {header(() => setStep('who'), 2)}
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <div className="pt-3 text-[28px] font-extrabold leading-tight tracking-[-0.03em]" style={{ color: INK }}>Ready to start</div>
            <div className="mt-1.5 text-[14px]" style={{ color: MUTED }}>{clip ? 'Day 1 goes up the moment you start.' : 'No Day 1 yet. You can add it from the pact.'}</div>

            <div className="relative mt-5 h-[300px] overflow-hidden rounded-[24px]" style={{ background: clip ? INK : PACT_BLUE_TILE }}>
              {clip && (isPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clip.url} alt="Your Day 1 photo" className="absolute inset-0 size-full object-cover" />
              ) : (
                <video src={clip.url} autoPlay loop muted playsInline className="absolute inset-0 size-full object-cover" />
              ))}
              {clip && <span className="absolute bottom-3 left-3 flex h-[26px] items-center rounded-full px-2.5 text-[12.5px] font-extrabold" style={{ background: 'rgba(15,16,20,0.62)', color: '#FFFFFF' }}>Day 1</span>}
              <button
                type="button"
                onClick={() => {
                  setClip(null)
                  setStep('shoot')
                }}
                className="absolute bottom-3 right-3 h-9 rounded-full px-3.5 text-[13px] font-extrabold"
                style={{ background: 'rgba(255,255,255,0.92)', color: INK }}
              >
                {clip ? 'Retake' : 'Shoot Day 1'}
              </button>
            </div>

            <div className="mt-3.5 rounded-[20px] px-4 py-3.5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <div className="text-[11.5px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>YOUR PACT</div>
              <div className="mt-1 text-[18px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: INK }}>{title}</div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-extrabold" style={{ background: NAVY, color: '#FFFFFF' }}>
                  {audience === 'circle' ? <Users className="size-3" strokeWidth={2.6} /> : audience === 'followers' ? <Heart className="size-3" strokeWidth={2.6} /> : <Globe className="size-3" strokeWidth={2.6} />}
                  {audience === 'circle' ? titleCase(String(circle?.name || 'Your circle')) : audience === 'followers' ? 'My followers' : 'Everyone'}
                </span>
                <span className="flex h-7 items-center rounded-full px-2.5 text-[12px] font-bold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>
                  {frequency} · {days} days
                </span>
                {locked && watchPrice != null && (
                  <span className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-extrabold" style={{ background: '#E8EDFA', color: NAVY }}>
                    <Lock className="size-3" strokeWidth={2.6} /> ₹{watchPrice} to watch
                  </span>
                )}
              </div>
              <div className="mt-2.5 text-[13px] leading-snug" style={{ color: MUTED }}>
                {audience === 'circle' ? `Members of ${titleCase(String(circle?.name || 'your circle'))} can see it now.` : audience === 'followers' ? 'Your followers can see it now.' : 'It goes live in Discover.'}
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => void post()}
              disabled={Boolean(posting)}
              className="h-14 w-full rounded-full text-[16.5px] font-extrabold disabled:opacity-70"
              style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }}
            >
              {posting || (clip ? 'Start pact and post Day 1' : 'Start pact')}
            </button>
          </div>
        </>
      )}

      {step === 'live' && created && (
        <PactLiveBeat
          title={created.title}
          days={created.days}
          hasDay1={!!clip}
          subtitle={audience === 'circle' ? circle?.name ?? 'Your circle' : audience === 'followers' ? 'Your followers' : 'Everyone'}
          inviteLabel={audience === 'circle' ? 'Tell your circle' : 'Share your pact'}
          message={pactInviteMessage({ title: created.title, mine: true })}
          onInvite={() => void share('native')}
          onCopy={() => void share('copy')}
          onOpen={openPact}
        />
      )}

    </div>
  )
}
