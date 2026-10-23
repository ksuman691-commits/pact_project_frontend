'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { useBackToClose } from '@/hooks/useBackToClose'
import { pushService } from '@/services/api'
import type { TodayPact } from '@/hooks/useTodayStatus'
import {
  enablePushOnThisDevice,
  MOMENT_POSTED_EVENT,
  notificationPermission,
  PushNotReadyError,
  pushSupport,
  reminderPromptSnoozed,
  resyncPush,
  snoozeReminderPrompt,
} from '@/lib/push'

const HOURS: { hour: 9 | 13 | 19; label: string }[] = [
  { hour: 9, label: '9 am' },
  { hour: 13, label: '1 pm' },
  { hour: 19, label: '7 pm' },
]

/**
 * "Want a nudge if you forget?" — offered once, right after a check-in, when
 * this phone can take push and hasn't been asked. Not on first launch: the
 * value is clearest right after you've posted. "Not now" waits two weeks.
 */
export default function ReminderPrompt() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hour, setHour] = useState<9 | 13 | 19>(19)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ day: number | null; title: string } | null>(null)

  useEffect(() => setMounted(true), [])

  // A phone that already has push keeps the server's copy (and its time zone) fresh.
  useEffect(() => {
    if (user?.id) void resyncPush()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    let waitTimer: number | undefined
    const onPosted = (event: Event) => {
      if (pushSupport() !== 'supported' || notificationPermission() !== 'default' || reminderPromptSnoozed()) return
      const pactId = Number((event as CustomEvent).detail?.pactId)
      const today = queryClient
        .getQueriesData<TodayPact[]>({ queryKey: ['me-today'] })
        .flatMap(([, data]) => (Array.isArray(data) ? data : []))
        .find((p) => p.id === pactId)
      setPreview(today ? { day: today.day ?? null, title: today.title } : null)
      // Wait for the camera sheet to close, so this never sits on top of it.
      let tries = 0
      const check = () => {
        tries += 1
        if (!document.querySelector('[role="dialog"][aria-label="Post a moment"]')) {
          void pushService
            .vapidKey()
            .then(({ data }) => data?.enabled && setOpen(true))
            .catch(() => {})
          return
        }
        if (tries < 240) waitTimer = window.setTimeout(check, 500)
      }
      waitTimer = window.setTimeout(check, 400)
    }
    window.addEventListener(MOMENT_POSTED_EVENT, onPosted)
    return () => {
      window.removeEventListener(MOMENT_POSTED_EVENT, onPosted)
      if (waitTimer) window.clearTimeout(waitTimer)
    }
  }, [user?.id, queryClient])

  const close = useCallback(() => {
    snoozeReminderPrompt()
    setOpen(false)
  }, [])
  useBackToClose(open, close)

  const turnOn = async () => {
    setBusy(true)
    try {
      const ok = await enablePushOnThisDevice()
      if (!ok) {
        // Declined in the browser's own dialog: don't ask again soon.
        snoozeReminderPrompt(60)
        setOpen(false)
        return
      }
      await pushService.updatePreferences({ daily_reminder: true, reminder_hour: hour })
      toast.success(`Reminders on. We'll nudge you at ${HOURS.find((h) => h.hour === hour)?.label} if a pact is still waiting.`)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof PushNotReadyError ? error.message : "Couldn't turn on reminders. Try again from Notifications.")
    } finally {
      setBusy(false)
    }
  }

  if (!mounted || !open) return null

  const nextDay = preview?.day ? preview.day + 1 : null
  return createPortal(
    <div className="fixed inset-0 z-[88] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Turn on check-in reminders">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0" style={{ background: 'rgba(15,16,20,0.45)' }} />
      <div className="relative flex w-full max-w-md flex-col gap-3.5 rounded-t-[28px] bg-[var(--card)] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 text-[var(--ink)]">
        <div className="mx-auto h-[5px] w-10 rounded-full bg-[#D9D2C2]" aria-hidden="true" />

        <div className="flex items-center gap-2.5 pt-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: 'var(--success, #2E7D4F)' }}>
            <Check className="h-[15px] w-[15px]" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="text-[14px] font-bold" style={{ color: 'var(--success, #2E7D4F)' }}>
            {preview?.day ? `Day ${preview.day} checked in` : 'Checked in for today'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">Want a nudge if you forget?</h2>
          <p className="text-[14.5px] leading-[1.45] text-[var(--muted)]">
            One reminder a day, only for pacts still waiting that day. Nothing after 10 pm, and it stops the moment you post.
          </p>
        </div>

        {preview && (
          <div className="flex gap-[11px] rounded-[18px] border border-[#E6E1D6] bg-white px-[13px] py-3" aria-hidden="true">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[11px] font-extrabold text-white">CP</span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[13.5px] font-extrabold">{nextDay ? `Day ${nextDay} of ${preview.title}` : preview.title}</span>
              <span className="text-[12.5px] text-[var(--muted)]">Add today&apos;s moment: a photo or a 15 s video.</span>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span id="remind-at" className="text-[13px] font-bold text-[var(--muted)]">
            Remind me at
          </span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="remind-at">
            {HOURS.map((option) => {
              const on = option.hour === hour
              return (
                <button
                  key={option.hour}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setHour(option.hour)}
                  className={`h-11 rounded-full text-[14px] ${on ? 'border-[1.5px] border-[var(--navy)] bg-[#E8ECF7] font-extrabold text-[var(--navy)]' : 'border border-[var(--hairline)] bg-white font-bold text-[var(--ink)]'}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void turnOn()}
          disabled={busy}
          className="mt-1 h-[52px] rounded-full bg-[var(--navy)] text-[15.5px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Turning on…' : 'Turn on reminders'}
        </button>
        <button type="button" onClick={close} className="h-11 text-[14.5px] font-bold text-[var(--muted)]">
          Not now
        </button>
      </div>
    </div>,
    document.body,
  )
}
