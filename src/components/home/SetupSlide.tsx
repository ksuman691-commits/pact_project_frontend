'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import CircleWatch from '@/components/brand/CircleWatch'
import { authService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { queryKeys } from '@/lib/queryKeys'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'

export type SetupStep = 'first' | 'photo' | 'circle'

const SNOOZE_DAYS = 7
const snoozeKey = (step: SetupStep) => `cp:setup-snooze:${step}`

function snoozed(step: SetupStep): boolean {
  try {
    const until = Number(window.localStorage.getItem(snoozeKey(step)) || 0)
    return until > Date.now()
  } catch {
    return false
  }
}

/**
 * The setup steps still worth showing on Home, in order. Each one appears only
 * once we actually know it's missing, so nothing flashes in and out after
 * sign-in:
 * - first: never created a pact and has no pact running;
 * - photo: no profile photo;
 * - circle: not in any circle.
 * "Not now" hides a step for a week; a done step never comes back.
 */
export function useSetupSteps(activePacts: number): { steps: SetupStep[]; snooze: (step: SetupStep) => void } {
  const profile = useProfileCompletion()
  const [hidden, setHidden] = useState<SetupStep[]>([])
  useEffect(() => {
    setHidden((['first', 'photo', 'circle'] as SetupStep[]).filter(snoozed))
  }, [])

  const steps: SetupStep[] = []
  if (profile.known) {
    if (!profile.hasCreatedPact && activePacts === 0) steps.push('first')
    if (!profile.hasPhoto) steps.push('photo')
    if (!profile.hasCircle) steps.push('circle')
  }
  const snooze = (step: SetupStep) => {
    try {
      window.localStorage.setItem(snoozeKey(step), String(Date.now() + SNOOZE_DAYS * 86_400_000))
    } catch {
      // Storage blocked: it just hides for this visit.
    }
    setHidden((h) => [...h, step])
  }
  return { steps: steps.filter((s) => !hidden.includes(s)), snooze }
}

const COPY: Record<SetupStep, { title: string; sub: string; cta: string }> = {
  first: { title: 'Start your first pact', sub: '7 days is plenty to begin', cta: 'Start' },
  photo: { title: 'Add your photo', sub: 'So your circle knows it’s you', cta: 'Add' },
  circle: { title: 'Join a circle', sub: 'Pacts are easier with people', cta: 'Find' },
}

/**
 * One setup step as a slide in Home's Today swipe. The first pact is pact
 * blue; photo and circle are black with a yellow button, a to-do for your
 * account rather than a pact.
 */
export default function SetupSlide({
  step,
  position,
  count,
  fullWidth,
  width,
  onCreatePact,
  onSnooze,
}: {
  step: SetupStep
  position: number
  count: number
  fullWidth: boolean
  width: string
  onCreatePact?: () => void
  onSnooze: (step: SetupStep) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const copy = COPY[step]
  const blue = step === 'first'

  const act = () => {
    if (step === 'first') onCreatePact ? onCreatePact() : router.push('/pacts/create')
    else if (step === 'photo') fileRef.current?.click()
    else router.push('/circles')
  }

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const response = await authService.uploadAvatar(file)
      setUser(response.data)
      if (user?.id) queryClient.invalidateQueries({ queryKey: queryKeys.users.stats(user.id) })
      toast.success('Photo added')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Couldn’t add the photo. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <li
      className="relative flex shrink-0 snap-start flex-col rounded-[20px] pb-3 pl-3.5 pr-2.5 pt-2.5 text-white"
      style={{ width: fullWidth ? '100%' : width, background: blue ? 'var(--navy)' : 'var(--ink)' }}
      aria-label={copy.title}
    >
      <div className="flex min-h-6 items-center gap-1.5 text-[12px] font-semibold" style={{ color: blue ? '#D4DBFA' : '#B9BBC2' }}>
        <span>
          {count > 1 ? `Get set up · ${position} of ${count}` : 'Get set up'}
        </span>
        <span className="flex-1" />
        {!blue && (
          <button type="button" onClick={() => onSnooze(step)} className="cp-hit relative flex h-6 items-center pr-1 text-[12.5px] font-semibold" style={{ ['--cp-hit' as string]: '10px', color: '#B9BBC2' }}>
            Not now
          </button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-3">
        {blue ? (
          <CircleWatch size={36} elapsed={0} state="running" />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-white/70" aria-hidden="true">
            {step === 'photo' ? <Plus className="size-5" strokeWidth={2.4} /> : <Users className="size-5" strokeWidth={2.2} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-bold tracking-[-0.015em]">{copy.title}</div>
          <p className="mt-px truncate text-[12.5px]" style={{ color: blue ? '#D4DBFA' : '#B9BBC2' }}>{copy.sub}</p>
        </div>
        <button
          type="button"
          onClick={act}
          disabled={uploading}
          className="flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] font-bold transition active:scale-[0.97] disabled:opacity-60"
          style={blue ? { background: '#FFFFFF', color: 'var(--navy)' } : { background: 'var(--dare)', color: 'var(--ink)' }}
        >
          {uploading ? 'Adding…' : copy.cta}
        </button>
      </div>
      {step === 'photo' && <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />}
    </li>
  )
}
