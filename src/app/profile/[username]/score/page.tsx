'use client'

import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import ScoreRing from '@/components/profile/ScoreRing'
import { useCpScore } from '@/hooks/useCpScore'
import { useSmartBack } from '@/hooks/useSmartBack'
import { useUserByUsername } from '@/hooks/useUserQueries'
import { useAuthStore } from '@/store/auth'
import type { CpScore } from '@/lib/api/cpScore'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const SOFT = '#ECE6D8'

function shortDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Trend({ points }: { points: NonNullable<CpScore['trend']> }) {
  if (points.length < 2) return null
  const width = 326
  const height = 86
  const scores = points.map((p) => p.score)
  const lo = Math.max(0, Math.min(...scores) - 6)
  const hi = Math.min(100, Math.max(...scores) + 6)
  const span = Math.max(1, hi - lo)
  const xy = points.map((p, i) => [Math.round((i / (points.length - 1)) * width), Math.round(height - 4 - ((p.score - lo) / span) * (height - 12))])
  const first = points[0]
  const last = points[points.length - 1]
  return (
    <div className="mx-4 mt-6 rounded-[22px] px-4 pb-3 pt-3.5" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
      <div className="flex items-center justify-between">
        <div className="text-[14.5px] font-extrabold" style={{ color: INK }}>Last 90 days</div>
        <div className="text-[12.5px] font-bold" style={{ color: MUTED }}>
          {first.score} → {last.score}
        </div>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Score over the last 90 days, from ${first.score} to ${last.score}`} className="mt-2 block">
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="#E7E1D3" strokeWidth="1" />
        <polyline fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={xy.map((p) => p.join(',')).join(' ')} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[11.5px] font-bold" style={{ color: MUTED }}>
        <span>{shortDate(first.date)}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

/**
 * How a CP Score is worked out. Public, like the score: anyone can see the
 * parts. Only the owner sees what moved it lately.
 */
export default function CpScorePage() {
  const params = useParams()
  const username = decodeURIComponent(String(params.username || ''))
  const goBack = useSmartBack(`/profile/${encodeURIComponent(username)}`)
  const me = useAuthStore((state) => state.user)
  const isOwn = Boolean(me?.username && me.username.toLowerCase() === username.toLowerCase())
  const profile = useUserByUsername(isOwn ? '' : username)
  const userId = isOwn ? me?.id : profile.data?.data?.id
  const name = isOwn ? 'Your' : `${String(profile.data?.data?.full_name || username).split(' ')[0]}'s`
  const { data, isLoading } = useCpScore(userId)

  return (
    <main className="min-h-screen pb-28" style={{ background: 'var(--paper)', color: INK }}>
      <div className="mx-auto max-w-md">
        <header className="flex items-center gap-1 px-2 pt-3">
          <button type="button" onClick={goBack} aria-label="Go back" className="flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-[19px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
            {name} CP Score
          </h1>
        </header>

        {isLoading || !data ? (
          <div className="mx-auto mt-10 size-[184px] rounded-full pact-shimmer" aria-hidden="true" />
        ) : data.status === 'building' ? (
          <section className="flex flex-col items-center px-6 pt-6 text-center">
            <ScoreRing score={null} size={184} stroke={8} label="building" />
            <div className="mt-4 text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
              Day {data.building_day ?? 0} of {data.building_days ?? 7}
            </div>
            <p className="mt-2 max-w-[300px] text-[14px] leading-snug" style={{ color: MUTED }}>
              {isOwn
                ? 'Your score shows after your first week. Post on the days your pacts need you, finish what you start and cheer others on.'
                : 'Their score shows after their first week on CirclePact.'}
            </p>
          </section>
        ) : (
          <>
            <section className="flex flex-col items-center px-5 pt-2 text-center">
              <ScoreRing score={data.score} size={184} stroke={8} />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
                  {data.band}
                </span>
                {data.change_30d != null && data.change_30d !== 0 && (
                  <span className="rounded-full px-2.5 py-1 text-[12.5px] font-extrabold" style={data.change_30d > 0 ? { background: '#E6F2EA', color: '#22663F' } : { background: '#F8E3DF', color: '#A23B2A' }}>
                    {data.change_30d > 0 ? '+' : '−'}
                    {Math.abs(data.change_30d)} this month
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-[300px] text-[14px] leading-snug" style={{ color: MUTED }}>
                How reliably {isOwn ? 'you do' : 'they do'} what {isOwn ? 'you' : 'they'} say, from the last 90 days. Everyone who visits {isOwn ? 'your' : 'their'} profile sees it.
              </p>
            </section>

            <Trend points={data.trend ?? []} />

            <h2 className="px-5 pt-6 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>
              WHAT MAKES IT UP
            </h2>
            <div className="mx-4 mt-2.5 overflow-hidden rounded-[22px]" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
              {(data.parts ?? []).map((part, index, all) => (
                <div key={part.key} className="flex flex-col gap-[7px] px-4 py-3.5" style={{ borderBottom: index === all.length - 1 ? 0 : `1px solid ${SOFT}` }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15.5px] font-extrabold" style={{ color: INK }}>{part.name}</span>
                    <span className="text-[14px] font-extrabold" style={{ color: INK }}>
                      {part.got}
                      <span className="font-semibold" style={{ color: MUTED }}> of {part.max}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded" style={{ background: SOFT }} aria-hidden="true">
                    <div className="h-2 rounded" style={{ background: NAVY, width: `${Math.round((part.got / Math.max(1, part.max)) * 100)}%` }} />
                  </div>
                  <div className="text-[13px] leading-snug" style={{ color: MUTED }}>{part.why}</div>
                </div>
              ))}
            </div>
            {(data.penalty ?? 0) > 0 && (
              <div className="mx-4 mt-2 rounded-[16px] px-4 py-2.5 text-[13px] font-semibold" style={{ background: '#F8E3DF', color: '#A23B2A' }}>
                −{data.penalty} for things that bring it down (below).
              </div>
            )}

            {isOwn && (
              <>
                <div className="flex items-center justify-between px-5 pt-6">
                  <h2 className="text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>RECENT CHANGES</h2>
                  <span className="text-[12px] font-bold" style={{ color: MUTED }}>Only you see these</span>
                </div>
                <div className="mx-4 mt-2.5 overflow-hidden rounded-[22px]" style={{ background: '#FFFFFF', border: `1px solid ${LINE}` }}>
                  {(data.recent ?? []).length === 0 ? (
                    <div className="px-4 py-4 text-[13.5px]" style={{ color: MUTED }}>Nothing this week yet. Post on a pact and it shows here.</div>
                  ) : (
                    (data.recent ?? []).map((change, index, all) => (
                      <div key={`${change.what}-${index}`} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: index === all.length - 1 ? 0 : `1px solid ${SOFT}` }}>
                        <span className="flex h-[30px] min-w-[46px] shrink-0 items-center justify-center rounded-full px-2 text-[13px] font-extrabold" style={change.up ? { background: '#E6F2EA', color: '#22663F' } : { background: '#F8E3DF', color: '#A23B2A' }}>
                          {change.delta}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-bold" style={{ color: INK }}>{change.what}</span>
                          <span className="block text-[12.5px]" style={{ color: MUTED }}>
                            {new Date(change.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <h2 className="px-5 pt-6 text-[12px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>WHAT BRINGS IT DOWN</h2>
            <ul className="mx-4 mt-2.5 flex flex-col gap-2.5 rounded-[22px] px-4 py-3.5 text-[14px] leading-snug" style={{ background: '#FBF8F1', border: `1px solid ${LINE}`, color: INK }}>
              {['Missing days your pacts need you', 'Quitting a pact in its first week', 'Saying you paid when you didn’t', 'Posts reported and taken down'].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="font-extrabold" style={{ color: '#A23B2A' }} aria-hidden="true">–</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="px-6 pt-4 text-center text-[12.5px] leading-snug" style={{ color: MUTED }}>
              Updates as you go and rechecks every few minutes. It can’t be bought or boosted.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
