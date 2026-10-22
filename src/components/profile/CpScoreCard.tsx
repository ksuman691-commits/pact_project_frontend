'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ScoreRing from '@/components/profile/ScoreRing'
import { useCpScore } from '@/hooks/useCpScore'

const INK = '#17181D'
const MUTED = '#5A5C63'
const LINE = '#DCD3C1'

/** The CP Score on a profile. Public: everyone who visits sees it. Taps through to how it's worked out. */
export default function CpScoreCard({ userId, username, isOwn = false }: { userId: number | null | undefined; username: string; isOwn?: boolean }) {
  const { data, isLoading, isError, refetch, isFetching } = useCpScore(userId)
  const href = `/profile/${encodeURIComponent(username)}/score`

  if (isError || data?.status === 'unavailable') {
    return (
      <div className="mx-4 mt-4 flex items-center gap-4 rounded-[22px] p-4" style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK }}>
        <ScoreRing score={null} label="" />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>CP SCORE</span>
          <span className="mt-1 block text-[15px] font-bold">Couldn&apos;t load {isOwn ? 'your' : 'this'} score</span>
        </span>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className="h-10 shrink-0 rounded-full px-4 text-[13.5px] font-extrabold disabled:opacity-60" style={{ background: '#1F3A93', color: '#FFFFFF' }}>
          {isFetching ? 'Loading…' : 'Try again'}
        </button>
      </div>
    )
  }

  if (isLoading || !data) {
    return <div className="mx-4 mt-4 h-[118px] rounded-[22px] pact-shimmer" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }} aria-hidden="true" />
  }

  if (data.status === 'building') {
    const day = Math.max(0, Math.min(data.building_days ?? 7, data.building_day ?? 0))
    return (
      <Link href={href} className="mx-4 mt-4 flex items-center gap-4 rounded-[22px] p-4" style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK }}>
        <ScoreRing score={null} label="building" />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>CP SCORE</span>
          <span className="mt-1 block text-[18px] font-extrabold tracking-[-0.02em]">Building · Day {day} of {data.building_days ?? 7}</span>
          <span className="mt-1 block text-[13px] leading-snug" style={{ color: MUTED }}>
            {isOwn ? 'Post on your pacts this week and your score appears.' : 'Their score appears after their first week.'}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0" style={{ color: MUTED }} aria-hidden="true" />
      </Link>
    )
  }

  const change = data.change_30d
  return (
    <Link
      href={href}
      aria-label={`CP Score ${data.score} out of 100, ${data.band}. See how it's worked out`}
      className="mx-4 mt-4 flex items-center gap-4 rounded-[22px] p-4"
      style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK, boxShadow: '0 1px 0 rgba(23,24,29,0.02), 0 10px 24px -18px rgba(23,24,29,0.25)' }}
    >
      <ScoreRing score={data.score} />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>CP SCORE</span>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[20px] font-extrabold tracking-[-0.02em]">{data.band}</span>
          {change != null && change !== 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-[12px] font-extrabold" style={change > 0 ? { background: '#E6F2EA', color: '#22663F' } : { background: '#F8E3DF', color: '#A23B2A' }}>
              {change > 0 ? '+' : '−'}
              {Math.abs(change)} this month
            </span>
          )}
        </span>
        {data.summary && <span className="mt-1 block text-[13px] leading-snug" style={{ color: MUTED }}>{data.summary}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0" style={{ color: MUTED }} aria-hidden="true" />
    </Link>
  )
}
