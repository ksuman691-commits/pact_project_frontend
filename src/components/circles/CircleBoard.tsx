'use client'

import { MarkProgress } from '@/components/brand/CircleMark'
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import Avatar from '@/components/Avatar'
import { useCircleBoard, type BoardEntry, type BoardPeriod } from '@/hooks/useCircleBoard'
import { SPRING } from '@/lib/motion'

const TABS: { id: BoardPeriod; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All time' },
]
const SHORT_LIST = 5

function Flame({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 .5 2 1.5 2.5 2 2 0-3-1-5 1-8z" fill="var(--like, #E11D48)" />
    </svg>
  )
}

function Row({ entry, period, reduce }: { entry: BoardEntry; period: BoardPeriod; reduce: boolean | null }) {
  const change = entry.rank_change
  const bars = period === 'week' ? 7 : 0
  const detail =
    period === 'week'
      ? `${entry.days_posted} of ${entry.days_possible ?? 7} days`
      : period === 'month'
        ? `${entry.days_posted} of ${entry.days_possible ?? 30} days`
        : `${entry.days_posted} ${entry.days_posted === 1 ? 'day' : 'days'}`
  return (
    <motion.li
      layout={!reduce}
      layoutId={`board-row-${entry.user_id}`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={reduce ? { duration: 0 } : { layout: SPRING, duration: 0.25 }}
      className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2"
      style={entry.is_you ? { background: 'var(--card, #FBF8F1)', boxShadow: 'inset 0 0 0 1.5px var(--navy, #1F3A93)' } : undefined}
    >
      <span className="w-[22px] text-center text-[15px] font-extrabold" style={{ color: entry.rank <= 3 ? 'var(--ink)' : 'var(--muted)' }}>
        {entry.rank}
      </span>
      <Avatar name={entry.full_name || entry.username} avatarUrl={entry.avatar_url} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">{entry.is_you ? 'You' : entry.full_name || entry.username}</div>
        {bars > 0 ? (
          <div className="mt-1 flex gap-[3px]" aria-label={detail}>
            {Array.from({ length: bars }).map((_, i) => (
              <span key={i} className="h-[5px] w-[14px] rounded-[3px]" style={{ background: i < entry.days_posted ? 'var(--navy, #1F3A93)' : 'var(--hairline, #DCD3C1)' }} />
            ))}
          </div>
        ) : (
          <div className="text-[11.5px]" style={{ color: 'var(--muted)' }}>{detail}</div>
        )}
      </div>
      {change != null && change !== 0 && (
        <span className="text-[11px] font-bold" style={{ color: change > 0 ? 'var(--success, #2E7D5B)' : 'var(--muted)' }} aria-label={change > 0 ? `Up ${change}` : `Down ${-change}`}>
          {change > 0 ? '▲' : '▼'} {Math.abs(change)}
        </span>
      )}
      <span className="flex min-w-[34px] items-center justify-end gap-0.5 text-[12px] font-bold" title="Current streak">
        <Flame />
        {entry.streak}
      </span>
    </motion.li>
  )
}

/**
 * A circle's leaderboard: ranked by days showed up. Shows the top five plus you
 * and your neighbours, then "See all". Rows slide to their new places when ranks change.
 */
export default function CircleBoard({ circleId }: { circleId: number }) {
  const reduce = useReducedMotion()
  const [period, setPeriod] = useState<BoardPeriod>('week')
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading, isError } = useCircleBoard(circleId, period)
  const lastData = useRef(data)
  if (data) lastData.current = data
  const board = data ?? lastData.current

  const visible = useMemo(() => {
    if (!board) return []
    if (expanded) return board.entries
    const meIndex = board.entries.findIndex((e) => e.is_you)
    return board.entries.filter((_, i) => i < SHORT_LIST || (meIndex >= 0 && Math.abs(i - meIndex) <= 1))
  }, [board, expanded])

  // Nothing to show to someone who can't see it, or before the server has the endpoint.
  if (isError || (!isLoading && !board)) return null
  if (board && board.total < 2) return null

  return (
    <section className="mx-4 mt-8 rounded-[24px] px-3 pb-3 pt-4" style={{ background: '#FFFFFF', border: '1px solid #DCD3C1' }} aria-label="Leaderboard">
      <div className="flex items-baseline justify-between px-1.5">
        <h2 className="text-[17px] font-extrabold">Leaderboard</h2>
        {board && (
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--muted)' }}>
            {board.total > 0 && <MarkProgress value={board.showed_up / board.total} size={13} track="var(--hairline, #DCD3C1)" />}
            {board.showed_up} of {board.total} showed up
          </span>
        )}
      </div>

      <div className="relative mx-1 mt-2.5 flex border-b" style={{ borderColor: 'var(--hairline, #DCD3C1)' }} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={period === tab.id}
            onClick={() => setPeriod(tab.id)}
            className="relative flex-1 py-2 text-[13px] font-semibold"
            style={{ color: period === tab.id ? 'var(--ink)' : 'var(--muted)' }}
          >
            {tab.label}
            {period === tab.id && (
              <motion.span layoutId="circle-board-underline" className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full" style={{ background: 'var(--navy, #1F3A93)' }} transition={reduce ? { duration: 0 } : SPRING} />
            )}
          </button>
        ))}
      </div>

      {!board ? (
        <div className="py-8 text-center text-[13px]" style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <LayoutGroup>
          <ul className="mt-2 grid gap-0.5">
            <AnimatePresence initial={false}>
              {visible.map((entry) => (
                <Row key={entry.user_id} entry={entry} period={period} reduce={reduce} />
              ))}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      )}

      {board && board.entries.length > visible.length && (
        <button type="button" onClick={() => setExpanded(true)} className="mt-1.5 w-full py-2 text-center text-[12.5px] font-semibold" style={{ color: 'var(--navy, #1F3A93)' }}>
          See all {board.total}
        </button>
      )}
    </section>
  )
}
