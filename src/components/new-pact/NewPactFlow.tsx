'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, Globe, Link2, Lock, MessageCircle, Play, UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import PriceChooser from '@/components/private/PriceChooser'
import { useCreatePact } from '@/hooks/usePactMutations'
import { useCircles } from '@/hooks/useCircles'
import { useMyTipSettings } from '@/hooks/useTips'
import { createStory, putStoryVideo, requestStoryUploadUrl } from '@/lib/api/stories'
import { IDEAS, parseSentence, sentenceTitle, type Frequency } from '@/lib/pactSentence'
import { STORY_MAX_SECONDS } from '@/lib/stories'
import { titleCase } from '@/lib/titleCase'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const CARD = '#FBF8F1'
const PAPER = '#F4EFE4'

type Step = 'shoot' | 'say' | 'who' | 'live'
type Audience = 'circle' | 'public' | 'private'

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
    ? { background: INK, color: '#FFFFFF', border: `1px solid ${INK}` }
    : { background: CARD, color: INK, border: `1px solid ${LINE}` }
}

/**
 * New pact, the short way: shoot Day 1, say what you'll do in one sentence,
 * pick who's in, and it's live with the moment already in it.
 * Replaces the six-step "What's the vibe?" wizard.
 */
export default function NewPactFlow({ onExit, initialCircleId = null, initialText = '' }: { onExit: () => void; initialCircleId?: number | null; initialText?: string | null }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createPact = useCreatePact()
  const circlesQuery = useCircles()
  const circles = useMemo(() => ((circlesQuery.data || []) as any[]).filter((c) => c?.id != null), [circlesQuery.data])
  const tips = useMyTipSettings()

  const [step, setStep] = useState<Step>('shoot')
  const [clip, setClip] = useState<Clip | null>(null)
  const [text, setText] = useState(initialText || '')
  const [pickedDays, setPickedDays] = useState<number | null>(null)
  const [pickedFrequency, setPickedFrequency] = useState<Frequency | null>(null)
  const [chosenAudience, setAudience] = useState<Audience>('circle')
  const [circleId, setCircleId] = useState<number | null>(initialCircleId)
  const [posting, setPosting] = useState<string | null>(null)
  const [watchPrice, setWatchPrice] = useState<number | null>(null)
  const [autoApprove, setAutoApprove] = useState(false)
  const [created, setCreated] = useState<{ id: number; title: string; days: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // No circles means "My circle" isn't an option, so Everyone is the default.
  const audience: Audience = chosenAudience === 'circle' && circles.length === 0 ? 'public' : chosenAudience
  useEffect(() => {
    if (circles.length > 0 && circleId == null) setCircleId(Number(circles[0].id))
  }, [circles, circleId])

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
  const title = ready ? sentenceTitle(cleanText, days) : ''
  const circle = circles.find((c) => Number(c.id) === circleId)
  // Selling access needs somewhere for the money to go.
  const needsUpi = audience === 'private' && watchPrice != null && Boolean(tips.data) && !tips.data?.enabled

  const post = async () => {
    if (!ready || posting) return
    const payload = {
      title,
      description: '',
      category: parsed.category,
      circle_id: audience === 'circle' ? circleId : null,
      visibility: audience === 'circle' ? 'circle_only' : 'public',
      media_locked: audience === 'private',
      watch_price: audience === 'private' ? watchPrice : null,
      watch_auto_approve: audience === 'private' && watchPrice != null ? autoApprove : false,
      start_date: localToday(),
      duration_days: days,
      verification_method: 'video',
      proof_submission_frequency: frequency === 'Every week' ? 'weekly' : 'daily',
      is_milestone: false,
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
        const { upload_url, object_key } = await requestStoryUploadUrl(pactId, { content_type: clip.contentType, size_bytes: clip.blob.size })
        await putStoryVideo(upload_url, clip.blob, clip.contentType, (fraction) => setPosting(`Posting Day 1… ${Math.round(fraction * 100)}%`))
        await createStory(pactId, { object_key, duration_seconds: Math.min(STORY_MAX_SECONDS, Math.max(1, Math.round(clip.duration))) })
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

  const pactUrl = created && typeof window !== 'undefined' ? `${window.location.origin}/pacts/${created.id}` : ''
  const share = async (kind: 'native' | 'whatsapp' | 'copy') => {
    if (!created) return
    const message = `I just started a pact: ${created.title}. Keep me honest on CirclePact`
    if (kind === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${pactUrl}`)}`, '_blank', 'noopener')
      return
    }
    if (kind === 'native' && navigator.share) {
      try {
        await navigator.share({ title: created.title, text: message, url: pactUrl })
        return
      } catch {
        // Dismissed; fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(pactUrl)
      toast.success('Link copied')
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
        pactTitle="New pact · Day 1"
        onCaptured={(captured) => {
          setClip({ ...captured, url: URL.createObjectURL(captured.blob) })
          setStep('say')
        }}
        onClose={() => setStep('say')}
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
          <span key={i} className="h-[5px] w-[22px] rounded-full" style={{ background: i <= index ? INK : '#D4CBB8' }} />
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
          {header(() => setStep('shoot'), 0)}
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <div className="flex items-end gap-3.5 pt-3">
              <button
                type="button"
                onClick={() => setStep('shoot')}
                aria-label={clip ? 'Retake Day 1' : 'Shoot Day 1'}
                className="relative h-[100px] w-[76px] shrink-0 overflow-hidden rounded-[16px]"
                style={clip ? { background: INK } : { background: '#E8E2D4', border: '2px dashed #CFC5B0' }}
              >
                {clip && <video src={`${clip.url}#t=0.1`} muted playsInline preload="auto" className="absolute inset-0 size-full object-cover" />}
                {clip ? (
                  <span className="absolute bottom-1.5 left-1.5 rounded-lg px-1.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: 'rgba(15,16,20,0.6)', color: '#FFFFFF' }}>Day 1</span>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[22px] font-bold" style={{ color: MUTED }}>+</span>
                )}
              </button>
              <div className="pb-1 text-[13.5px] leading-snug" style={{ color: MUTED }}>
                {clip ? 'Day 1 is in. Now say what you’re committing to.' : 'No video yet. Tap the box to shoot Day 1, or add it later.'}
              </div>
            </div>

            <label className="mt-6 block">
              <span className="block text-[30px] font-extrabold tracking-[-0.03em]" style={{ color: INK }}>I will…</span>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 120))}
                placeholder="run 5 km every morning for 30 days"
                enterKeyHint="next"
                className="mt-2 w-full border-0 border-b-2 bg-transparent pb-2.5 pt-1.5 text-[21px] font-semibold outline-none"
                style={{ borderColor: INK, color: INK }}
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
                      {titleCase(idea)}
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
              style={ready ? { background: INK, color: '#FFFFFF' } : { background: '#E1DACB', color: '#7A7B80' }}
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
            <div className="mt-5 flex flex-col gap-2.5">
              {(
                [
                  circles.length > 0 && { id: 'circle', name: 'My circle', desc: 'Your circle watches and cheers. Others only see it exists.', icon: <UserPlus className="size-5" /> },
                  { id: 'public', name: 'Everyone', desc: 'Shows in Discover. Anyone can watch and join.', icon: <Globe className="size-5" /> },
                  { id: 'private', name: 'Private', desc: 'Only people you let in see your moments. Others can ask, and tip you.', icon: <Lock className="size-5" /> },
                ].filter(Boolean) as { id: Audience; name: string; desc: string; icon: React.ReactNode }[]
              ).map((option) => {
                const on = audience === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAudience(option.id)}
                    className="flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left"
                    style={{ background: on ? '#FFFFFF' : CARD, border: on ? `2px solid ${INK}` : `1px solid ${LINE}` }}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={on ? { background: INK, color: '#FFFFFF' } : { background: '#EFEBE1', color: INK }}>
                      {option.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-extrabold" style={{ color: INK }}>{option.name}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug" style={{ color: MUTED }}>{option.desc}</span>
                    </span>
                    <span className="size-[22px] shrink-0 rounded-full" style={on ? { border: `7px solid ${INK}` } : { border: '2px solid #B9AF9A' }} />
                  </button>
                )
              })}
            </div>

            {audience === 'circle' && circles.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {circles.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCircleId(Number(c.id))} className="h-9 rounded-full px-3.5 text-[13.5px] font-bold" style={pill(Number(c.id) === circleId)}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {audience === 'private' && (
              <div className="mt-5">
                <PriceChooser price={watchPrice} onPrice={setWatchPrice} autoApprove={autoApprove} onAutoApprove={setAutoApprove} />
              </div>
            )}
            {audience === 'private' && tips.data && !tips.data.enabled && (
              <Link href="/profile/tips" className="mt-3.5 flex min-h-11 items-center rounded-[14px] px-3.5 text-[13.5px] font-bold" style={{ border: `1.5px dashed ${NAVY}`, color: NAVY, background: '#F5F7FD' }}>
                {watchPrice != null ? 'Add your UPI first, so people can pay you' : 'Turn on tips so people can back you'}
              </Link>
            )}
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => void post()}
              disabled={Boolean(posting) || (audience === 'circle' && circleId == null) || needsUpi}
              className="h-14 w-full rounded-full text-[16.5px] font-extrabold disabled:opacity-70"
              style={{ background: NAVY, color: '#FFFFFF', boxShadow: '0 8px 22px rgba(31,58,147,0.28)' }}
            >
              {posting || (clip ? 'Post Day 1' : 'Start the pact')}
            </button>
          </div>
        </>
      )}

      {step === 'live' && created && (
        <>
          <div className="flex justify-end px-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button type="button" onClick={onExit} aria-label="Close" className="flex size-11 items-center justify-center" style={{ color: INK }}>
              <X className="size-5" />
            </button>
          </div>
          <div className="mx-auto w-full max-w-md flex-1 px-5">
            <div className="text-center">
              <div className="text-[30px] font-extrabold tracking-[-0.035em]" style={{ color: INK }}>{clip ? 'You’re on Day 1.' : 'Your pact is live.'}</div>
              <div className="mt-1.5 text-[14.5px]" style={{ color: MUTED }}>
                {audience === 'circle' ? `${circle?.name ?? 'Your circle'} can see it now.` : audience === 'public' ? 'It’s live in Discover.' : watchPrice != null ? `Private · ₹${watchPrice} to watch.` : 'Private. People can ask to watch, and tip you.'}
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-[24px]" style={{ background: CARD, border: `1px solid ${LINE}` }}>
              <div className="relative h-[300px]" style={{ background: clip ? INK : 'radial-gradient(120% 80% at 30% 20%, #2A3A6E 0%, #141A2E 60%, #0F1014 100%)' }}>
                {clip && <video src={clip.url} autoPlay loop muted playsInline className="absolute inset-0 size-full object-cover" />}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5" style={{ background: 'linear-gradient(0deg, rgba(15,16,20,0.75), rgba(15,16,20,0))' }} />
                {clip && (
                  <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full" style={{ background: 'rgba(15,16,20,0.55)', color: '#FFFFFF' }}>
                    <Play className="size-4 fill-current" />
                  </span>
                )}
                {audience === 'private' && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-xl px-2.5 py-1 text-[12px] font-extrabold" style={{ background: 'rgba(15,16,20,0.6)', color: '#FFFFFF' }}>
                    <Lock className="size-3" strokeWidth={2.6} /> {watchPrice != null ? `Private · ₹${watchPrice}` : 'Private'}
                  </span>
                )}
                <div className="absolute inset-x-3.5 bottom-3" style={{ color: '#FFFFFF' }}>
                  <span className="rounded-[10px] px-2.5 py-0.5 text-[12px] font-extrabold" style={{ background: 'rgba(255,255,255,0.24)' }}>Day 1 of {created.days}</span>
                  <div className="mt-1.5 text-[19px] font-extrabold leading-tight tracking-[-0.02em]">{created.title}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>GET PEOPLE IN</div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(
                [
                  ['native', 'Invite', <UserPlus key="i" className="size-[22px]" />],
                  ['whatsapp', 'WhatsApp', <MessageCircle key="w" className="size-[22px]" />],
                  ['copy', 'Copy link', <Link2 key="c" className="size-[22px]" />],
                ] as const
              ).map(([kind, label, icon]) => (
                <button key={kind} type="button" onClick={() => void share(kind)} className="flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] text-[13px] font-bold" style={{ background: CARD, border: `1px solid ${LINE}`, color: INK }}>
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-md px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => {
                const id = created.id
                onExit()
                router.push(`/pacts/${id}`)
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16.5px] font-extrabold"
              style={{ background: INK, color: '#FFFFFF' }}
            >
              <Check className="size-5" strokeWidth={2.6} />
              See my pact
            </button>
          </div>
        </>
      )}
    </div>
  )
}
