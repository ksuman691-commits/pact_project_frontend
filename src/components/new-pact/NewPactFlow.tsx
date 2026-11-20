'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Camera, ChevronRight, Globe, Heart, Lock, Plus, Search, Users, X } from 'lucide-react'
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
import { IDEAS, parseSentence, typedTitle, type Frequency } from '@/lib/pactSentence'
import { STORY_MAX_SECONDS } from '@/lib/stories'
import PactLiveBeat from '@/components/celebrations/PactLiveBeat'
import FlowHero, { FlowFooter } from '@/components/flow/FlowHero'
import HeroMark from '@/components/brand/HeroMark'
import CircleMark from '@/components/brand/CircleMark'
import { pactInviteMessage } from '@/lib/inviteMessages'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const CARD = '#FBF8F1'
const PAPER = '#F4EFE4'

/**
 * Say it, choose who, then shoot Day 1 and it starts. The camera has its own
 * "Use this / Retake", and the live card at the top already shows the whole
 * pact, so there's no separate review screen any more.
 */
type Step = 'say' | 'who' | 'shoot' | 'live'
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
 * New pact in two screens and the camera: say it, choose who sees it, then
 * shoot Day 1 (or start without it). The coloured top holds a live card of
 * the pact, so every answer lands on it and nothing needs reviewing.
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

  const parsed = parseSentence(text)
  const days = pickedDays ?? parsed.days ?? 30
  const frequency = pickedFrequency ?? parsed.frequency ?? 'Every day'
  const cleanText = text.trim()
  const ready = cleanText.length >= 4
  // Kept exactly as typed; the length shows on its own chip.
  const title = ready ? typedTitle(cleanText) : ''
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

  const post = async (dayOne: Clip | null) => {
    if (!ready || posting || !audience) return
    const photo = Boolean(dayOne?.contentType.startsWith('image/'))
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
      setStep('who')
      return
    }

    if (dayOne) {
      try {
        setPosting('Posting Day 1… 0%')
        const onProgress = (fraction: number) => setPosting(`Posting Day 1… ${Math.round(fraction * 100)}%`)
        if (photo) {
          const file = new File([dayOne.blob], dayOne.contentType === 'image/png' ? 'day-1.png' : 'day-1.jpg', { type: dayOne.contentType })
          await pactService.uploadProofFile(pactId, file, 'photo', undefined, undefined, onProgress)
        } else {
          const { upload_url, object_key } = await requestStoryUploadUrl(pactId, { content_type: dayOne.contentType, size_bytes: dayOne.blob.size })
          await putStoryVideo(upload_url, dayOne.blob, dayOne.contentType, onProgress)
          await createStory(pactId, { object_key, duration_seconds: Math.min(STORY_MAX_SECONDS, Math.max(1, Math.round(dayOne.duration))) })
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

  if (step === 'shoot' && !posting) {
    return (
      <StoryCaptureSheet
        isOpen
        autoStart
        pactId={0}
        pactTitle={title || 'New pact · Day 1'}
        onCaptured={(captured) => {
          const next = { ...captured, url: URL.createObjectURL(captured.blob) }
          setClip(next)
          void post(next)
        }}
        // Closing the camera goes back a step; "skip" starts the pact without Day 1.
        onClose={() => setStep('who')}
        onSkip={() => void post(null)}
      />
    )
  }

  const audienceLabel = audience === 'circle' ? String(circle?.name || 'Your circle') : audience === 'followers' ? 'My followers' : audience === 'public' ? 'Everyone' : null
  const blockedReason = !audience || (audience === 'circle' && circleId == null) ? 'Choose who sees it' : needsUpi ? 'Add your UPI first' : needsPrice ? 'Pick a price' : null

  // The live card: what you're promising, filling in as you answer.
  const card = (
    <div className="rounded-[22px] bg-white px-4 py-3.5 text-[var(--ink)]" style={{ boxShadow: '0 0 0 1.5px #17181D, 0 3px 0 rgba(10,20,70,0.45)' }} aria-live="polite" aria-label="Preview of your pact">
      <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: NAVY }}>
        <CircleMark size={14} />
        I will
        {locked && watchPrice != null && (
          <span key={watchPrice} className="cp-pop-in ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-bold text-white" style={{ background: NAVY }}>
            <Lock className="size-3" strokeWidth={2.6} aria-hidden="true" />₹{watchPrice} to watch
          </span>
        )}
      </p>
      <p className={`mt-1 line-clamp-3 text-balance text-[24px] font-bold leading-[1.1] tracking-[-0.03em] ${title ? '' : 'opacity-35'}`}>
        {title || 'run 5 km every morning'}
      </p>
      <div className="my-3 h-px" style={{ background: `repeating-linear-gradient(90deg, ${LINE} 0 6px, transparent 6px 12px)` }} />
      <div className="flex flex-wrap items-center gap-1.5">
        <span key={frequency} className="cp-pop-in flex h-6 items-center rounded-full px-2 text-[11.5px] font-bold" style={{ background: '#E8EDFA', color: NAVY }}>{frequency}</span>
        <span key={`d${days}`} className="cp-pop-in flex h-6 items-center rounded-full px-2 text-[11.5px] font-bold" style={{ background: '#E8EDFA', color: NAVY }}>{days} days</span>
        {ready && <span className="flex h-6 items-center rounded-full px-2 text-[11.5px] font-bold" style={{ background: '#F1ECE1', color: INK }}>{parsed.categoryLabel}</span>}
        {audienceLabel && (
          <span key={audienceLabel} className="cp-pop-in flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold text-white" style={{ background: NAVY }}>
            {audience === 'circle' ? <Users className="size-3" strokeWidth={2.6} /> : audience === 'followers' ? <Heart className="size-3" strokeWidth={2.6} /> : <Globe className="size-3" strokeWidth={2.6} />}
            {audienceLabel}
          </span>
        )}
      </div>
    </div>
  )

  const chip = 'h-10 shrink-0 rounded-full px-3.5 text-[14px] font-bold transition active:scale-95'
  const primary = 'flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-bold transition active:scale-[0.98]'

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto" style={{ background: PAPER, color: INK }}>
      {(step === 'say' || step === 'who') && (
        <FlowHero
          tone="navy"
          steps={['Say it', 'Who', 'Day 1']}
          current={step === 'say' ? 0 : 1}
          onBack={step === 'who' ? () => setStep('say') : undefined}
          onExit={onExit}
        >
          {card}
        </FlowHero>
      )}

      {step === 'say' && (
        <>
          <div key="say" className="pact-step-enter mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6">
            {first && (
              <p className="mb-2 text-[13.5px] font-semibold" style={{ color: MUTED }}>
                Your first pact. Start small: 7 days is plenty. You can close this and look around first.
              </p>
            )}
            <label className="block">
              <span className="block text-[26px] font-bold leading-[1.1] tracking-[-0.03em]">Say it out loud</span>
              <span className="mt-1.5 block text-[14.5px]" style={{ color: MUTED }}>Finish the sentence. Your circle will hold you to it.</span>
              <span className="mt-4 flex items-center gap-2 rounded-[18px] bg-[var(--card)] px-4 shadow-[inset_0_0_0_1.5px_#DCD3C1] focus-within:shadow-[inset_0_0_0_2px_#1F3A93]">
                <span className="text-[20px] font-bold" style={{ color: NAVY }}>I will</span>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 120))}
                  placeholder="run 5 km every morning"
                  enterKeyHint="next"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && ready) setStep('who')
                  }}
                  className="h-14 min-w-0 flex-1 bg-transparent text-[20px] font-semibold outline-none focus-visible:outline-none placeholder:font-medium placeholder:text-[#A39C8C]"
                />
              </span>
            </label>

            {ready ? (
              <>
                <div className="mt-5 mb-2 text-[14px] font-bold">How often</div>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-hide">
                  {FREQUENCIES.map((f) => (
                    <button key={f} type="button" onClick={() => setPickedFrequency(f)} aria-pressed={frequency === f} className={chip} style={pill(frequency === f)}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="mt-5 mb-2 text-[14px] font-bold">For how long</div>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-hide">
                  {[...new Set([...(parsed.days && !DAY_OPTIONS.includes(parsed.days) ? [parsed.days] : []), ...DAY_OPTIONS])].map((n) => (
                    <button key={n} type="button" onClick={() => setPickedDays(n)} aria-pressed={days === n} className={chip} style={pill(days === n)}>
                      {n} days
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 mb-2 text-[14px] font-bold">Or pick one to start</div>
                <div className="flex flex-col gap-2">
                  {IDEAS.map((idea) => (
                    <button key={idea} type="button" onClick={() => setText(idea)} className="min-h-12 rounded-[16px] px-3.5 py-2.5 text-left text-[14.5px] font-semibold active:scale-[0.99]" style={{ background: CARD, boxShadow: `inset 0 0 0 1px ${LINE}`, color: INK }}>
                      {idea.charAt(0).toUpperCase() + idea.slice(1)}
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
                Next: who sees it
              </button>
            </div>
          </FlowFooter>
        </>
      )}

      {step === 'who' && (
        <>
          <div key="who" className="pact-step-enter mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6">
            <div className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em]">Who sees it?</div>
            <div className="mt-1.5 text-[14.5px]" style={{ color: MUTED }}>They see every day you show up, and every day you don&apos;t.</div>
            <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Who sees it">
              {(
                [
                  {
                    id: 'circle' as Audience,
                    name: 'A circle',
                    desc: circles.length === 0 ? 'You have no circles yet. Make one.' : circle && audience === 'circle' ? String(circle.name || '') : `Choose one of your ${circles.length} ${circles.length === 1 ? 'circle' : 'circles'}.`,
                    icon: <Users className="size-5" />,
                  },
                  { id: 'followers' as Audience, name: 'My followers', desc: followerCount > 0 ? `${followerCount.toLocaleString('en-IN')} ${followerCount === 1 ? 'follower sees' : 'followers see'} it in their feed.` : 'Your profile and people who follow you.', icon: <Heart className="size-5" /> },
                  { id: 'public' as Audience, name: 'Everyone', desc: 'Shows in Discover. Anyone can find it.', icon: <Globe className="size-5" /> },
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
                    className="flex min-h-[66px] w-full items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-left transition active:scale-[0.99]"
                    style={{ background: on ? '#FFFFFF' : CARD, boxShadow: on ? `inset 0 0 0 2px ${NAVY}` : `inset 0 0 0 1px ${LINE}` }}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={on ? { background: NAVY, color: '#FFFFFF', boxShadow: `0 0 0 1.5px ${INK}` } : { background: '#E8E2D4', color: INK }}>
                      {option.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-bold">{option.name}</span>
                      <span className="mt-px block text-[13px] leading-snug" style={{ color: on && isCircle ? NAVY : MUTED, fontWeight: on && isCircle ? 700 : 400 }}>{option.desc}</span>
                    </span>
                    {isCircle && on ? (
                      <span className="flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-bold" style={{ background: CARD, boxShadow: `inset 0 0 0 1px ${LINE}` }}>Change</span>
                    ) : isCircle ? (
                      <ChevronRight className="size-[18px] shrink-0" style={{ color: MUTED }} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <span className="size-[22px] shrink-0 rounded-full" style={on ? { border: `7px solid ${NAVY}` } : { border: '2px solid #B9AF9A' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Paid moments: one row until you want it. */}
            <div className="mt-4 rounded-[18px] p-3.5" style={locked ? { background: NAVY, color: '#FFFFFF' } : { background: CARD, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-[18px] font-bold" style={locked ? { background: '#FFFFFF', color: NAVY, boxShadow: `0 0 0 1.5px ${INK}` } : { background: '#E8E2D4', color: INK }} aria-hidden="true">₹</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold">Paid moments</span>
                  <span className="mt-px block text-[13px] leading-snug" style={{ color: locked ? '#DCE3F7' : MUTED }}>
                    {locked ? lockHint : 'Lock your moments. People pay to watch, straight to your UPI.'}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={locked}
                  aria-label="Paid moments"
                  onClick={() => {
                    if (!locked && watchPrice == null) setWatchPrice(51)
                    setLocked(!locked)
                  }}
                  className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors"
                  style={{ background: locked ? '#FFFFFF' : '#D4CBB8', boxShadow: `inset 0 0 0 1.5px ${INK}` }}
                >
                  <span className="absolute top-1 size-6 rounded-full transition-[left]" style={{ background: locked ? NAVY : '#FFFFFF', left: locked ? 24 : 4, boxShadow: `0 0 0 1.5px ${INK}` }} />
                </button>
              </div>
              {locked && (
                <div className="mt-3.5">
                  <PriceChooser dark price={watchPrice} onPrice={setWatchPrice} autoApprove={autoApprove} onAutoApprove={setAutoApprove} />
                  {watchPrice != null && (
                    <div className="mt-3 rounded-[14px] px-3.5 py-2.5 text-[13px] leading-snug" style={{ background: 'rgba(255,255,255,0.12)', color: '#EEF2FC' }}>
                      20 people at ₹{watchPrice} is <b className="text-white">₹{(20 * watchPrice).toLocaleString('en-IN')}</b> for one pact.
                    </div>
                  )}
                  {tips.data && !tips.data.enabled ? (
                    <Link href="/profile/tips" className="mt-3 flex min-h-11 items-center rounded-[14px] px-3.5 text-[13.5px] font-bold" style={{ border: '1.5px dashed #FFFFFF', color: '#FFFFFF' }}>
                      Add your UPI first, so people can pay you
                    </Link>
                  ) : tips.data?.upi_id ? (
                    <div className="mt-3 flex items-center gap-2.5 rounded-[14px] px-3.5 py-2.5" style={{ border: '1px solid rgba(255,255,255,0.22)' }}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px]" style={{ color: '#BFC2CB' }}>Paid straight to your UPI</span>
                        <span className="mt-px block truncate text-[14.5px] font-bold">{tips.data.upi_id}</span>
                      </span>
                      <Link href="/profile/tips" className="flex h-[34px] items-center rounded-full px-3 text-[13px] font-bold" style={{ background: 'rgba(255,255,255,0.14)' }}>Edit</Link>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <FlowFooter>
            <div className="mx-auto max-w-md">
              <button
                type="button"
                onClick={() => setStep('shoot')}
                disabled={Boolean(blockedReason) || Boolean(posting)}
                className={primary}
                style={blockedReason ? { background: '#E1DACB', color: '#6B6C72' } : { background: NAVY, color: '#FFFFFF', boxShadow: '0 3px 0 #142766' }}
              >
                {blockedReason ?? (
                  <>
                    <Camera className="size-5" strokeWidth={2.2} aria-hidden="true" />
                    Shoot Day 1 and start
                  </>
                )}
              </button>
              {!blockedReason && (
                <button type="button" onClick={() => void post(null)} disabled={Boolean(posting)} className="mt-1 h-11 w-full text-[14.5px] font-bold underline decoration-2 underline-offset-4" style={{ color: NAVY, textDecorationColor: '#C9D3F2' }}>
                  Start now, add Day 1 later
                </button>
              )}
            </div>
          </FlowFooter>

          {pickingCircle && (
            <div role="dialog" aria-modal="true" aria-label="Choose your circle" className="fixed inset-0 z-[75] flex items-end justify-center">
              <button type="button" aria-label="Close" onClick={() => setPickingCircle(false)} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.55)' }} />
              <div className="relative flex max-h-[85dvh] min-h-[60dvh] w-full max-w-md flex-col rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3" style={{ background: CARD, color: INK }}>
                <div className="mx-auto mb-1.5 h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
                <div className="flex items-center justify-between">
                  <div className="text-[20px] font-bold tracking-[-0.02em]">Choose your circle</div>
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
                      { key: 'private', label: 'Private', icon: <Lock className="size-3" strokeWidth={2.6} aria-hidden="true" />, sub: 'Members only', list: matches.filter((c) => c.visibility === 'private') },
                      { key: 'public', label: 'Public', icon: <Globe className="size-3" strokeWidth={2.6} aria-hidden="true" />, sub: 'Anyone can join', list: matches.filter((c) => c.visibility !== 'private') },
                    ].filter((g) => g.list.length > 0)
                    if (groups.length === 0) return <p className="px-1 py-6 text-center text-[14px]" style={{ color: MUTED }}>No circle by that name.</p>
                    return groups.map((g) => (
                      <div key={g.key} role="group" aria-label={`${g.label.toLowerCase()} circles`}>
                        <div className="flex items-center gap-1.5 px-0.5 pb-0.5 pt-3.5 text-[13px] font-bold" style={{ color: MUTED }}>
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
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-[16px] font-bold" style={{ background: '#E8E2D4' }}>
                                {String(c.name || '?').trim().charAt(0).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15.5px] font-bold">{String(c.name || '')}</span>
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
                <Link href="/circles/create" className="mt-2 flex h-[50px] shrink-0 items-center justify-center gap-1.5 rounded-full text-[15px] font-bold" style={{ border: `1.5px dashed ${NAVY}`, background: '#F5F7FD', color: NAVY }}>
                  <Plus className="size-4" strokeWidth={2.6} aria-hidden="true" />
                  Create a new circle
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Starting: the same mark as the Pacts page, turning until it's live. */}
      {posting && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-8 text-center text-white" style={{ background: 'linear-gradient(180deg, #2546A6 0%, #1F3A93 60%)' }}>
          <HeroMark size={132} color="#2A4CB0" stroke="rgba(255,255,255,0.75)" ringColor="rgba(255,255,255,0.18)" busy />
          <p className="mt-10 text-[26px] font-bold tracking-[-0.03em]">{title}</p>
          <p className="mt-2 text-[15px] font-semibold tabular-nums" style={{ color: '#D4DBFA' }}>{posting}</p>
        </div>
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
