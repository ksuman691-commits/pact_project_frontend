'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Video, X } from 'lucide-react'
import { useCircleStoriesToday } from '@/hooks/useStories'
import { pactAdvancedService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import StoryCaptureSheet from './StoryCaptureSheet'
import StoryRing, { ringStateFrom, type RingState } from './StoryRing'
import StoryViewer from './StoryViewer'

interface StoryCircle {
  id: number
  name: string
  photo_url?: string | null
  stories_today_count?: number | null
  has_unseen_story?: boolean | null
}

const SIZE = 72

function labelFor(state: RingState, count: number | null | undefined) {
  if (state === 'unseen') return typeof count === 'number' && count > 0 ? `${count} new` : 'new'
  if (state === 'seen') return 'seen'
  return 'none yet'
}

function PostTodaySheet({ onClose, onPick }: { onClose: () => void; onPick: (pact: any) => void }) {
  const { user } = useAuthStore()
  const query = useQuery({
    queryKey: ['my-pacts', user?.id],
    queryFn: () => pactAdvancedService.getMyPacts(0, 100),
    enabled: !!user?.id,
  })
  const active: any[] = ((query.data as any)?.data || []).filter((p: any) => p.status === 'active')

  return (
    <div className="fixed inset-0 z-[70] flex items-end" role="dialog" aria-modal="true" aria-label="Choose a pact">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative mx-auto flex max-h-[75vh] w-full max-w-md flex-col gap-3 rounded-t-[14px] bg-[var(--paper)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-[var(--ink)]">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-bold tracking-[-0.02em]">Post today&apos;s story to</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        {query.isLoading ? (
          <p className="py-4 text-[14px] text-[var(--muted)]">Loading your pacts…</p>
        ) : query.isError ? (
          <p className="py-4 text-[14px] text-[var(--muted)]">We couldn&apos;t load your pacts.</p>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-[14px] text-[var(--muted)]">You have no active pacts.</p>
            <Link href="/pacts/create" className="flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--paper)]">
              Make a pact
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col overflow-y-auto">
            {active.map((pact) => (
              <li key={pact.id} className="border-b border-[var(--hairline)] last:border-b-0">
                <button type="button" onClick={() => onPick(pact)} className="flex min-h-[56px] w-full flex-col items-start justify-center py-2 text-left">
                  <span className="text-[15px] font-semibold">{pact.title}</span>
                  {pact.circle_name && <span className="text-[13px] text-[var(--muted)]">{pact.circle_name}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function StoryCirclesRow({ circles, isLoading }: { circles: StoryCircle[]; isLoading?: boolean }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [capturePact, setCapturePact] = useState<any | null>(null)
  const [viewing, setViewing] = useState<StoryCircle | null>(null)
  const circleStories = useCircleStoriesToday(viewing?.id ?? null)

  return (
    <section aria-label="Your circles" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[13px] font-semibold text-[var(--muted)]">Your circles</h2>
        <Link href="/circles" className="text-[13px] font-semibold text-[var(--navy)]">
          See all
        </Link>
      </div>

      <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
        <li>
          <button type="button" onClick={() => setPickerOpen(true)} className="flex w-[76px] flex-col items-center gap-1.5">
            <span
              className="flex flex-col items-center justify-center gap-0.5 rounded-full"
              style={{ width: SIZE + 6, height: SIZE + 6, background: 'var(--navy)', color: 'var(--paper)' }}
            >
              <Video className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] font-semibold">Post today</span>
            </span>
            <span className="sr-only">Post today&apos;s story</span>
          </button>
        </li>

        {isLoading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="flex w-[76px] flex-col items-center gap-1.5" aria-hidden="true">
                <span className="rounded-full border border-dashed border-[var(--seat-border)]" style={{ width: SIZE + 6, height: SIZE + 6 }} />
              </li>
            ))
          : circles.map((circle) => {
              const state = ringStateFrom(circle.has_unseen_story, circle.stories_today_count)
              return (
                <li key={circle.id}>
                  <button type="button" onClick={() => setViewing(circle)} className="flex w-[76px] flex-col items-center gap-1.5">
                    <StoryRing state={state} size={SIZE} name={circle.name} imageUrl={circle.photo_url} />
                    <span className="w-full truncate text-center text-[12px] font-semibold text-[var(--ink)]">{circle.name}</span>
                    <span className="text-[11px] text-[var(--muted)]">{labelFor(state, circle.stories_today_count)}</span>
                  </button>
                </li>
              )
            })}
      </ul>

      {!isLoading && circles.length === 0 && (
        <p className="px-1 text-[14px] text-[var(--muted)]">
          No circles yet.{' '}
          <Link href="/circles" className="font-semibold text-[var(--navy)]">
            Browse circles
          </Link>
        </p>
      )}

      {pickerOpen && (
        <PostTodaySheet
          onClose={() => setPickerOpen(false)}
          onPick={(pact) => {
            setPickerOpen(false)
            setCapturePact(pact)
          }}
        />
      )}
      {capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} />
      )}
      <StoryViewer
        open={viewing !== null}
        onClose={() => setViewing(null)}
        stories={circleStories.stories}
        circleId={viewing?.id}
        circleName={viewing?.name}
        isLoading={circleStories.isLoading}
        unavailable={circleStories.unavailable}
      />
    </section>
  )
}
