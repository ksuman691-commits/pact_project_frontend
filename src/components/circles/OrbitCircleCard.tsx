'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { CircleActivity } from '@/lib/circleActivity'
import OrbitRing from '@/components/circles/OrbitRing'

const INK = '#17181D'
const MUTED = '#5A5C63'
const LINE = '#DCD3C1'
const MAX_FACES = 7

/**
 * A circle on the Circles page: the ring (see OrbitRing) on the left, and on
 * the right its name, how many showed up this week, live pacts and members.
 * Works the same for 3 members or 300.
 */
export default function OrbitCircleCard({ circle, activity, index = 0 }: { circle: any; activity: CircleActivity; index?: number }) {
  const preview: any[] = Array.isArray(circle?.members_preview) ? circle.members_preview : []
  const faces = preview.slice(0, MAX_FACES)
  const total = Math.max(activity.totalMembers || 0, faces.length, 1)
  const active = activity.known ? activity.activeCount : faces.filter((m) => m?.sent_proof_this_week === true).length
  const duration = `${60 + (index % 4) * 12}s`
  const isPrivate = (circle?.visibility ?? 'public') === 'private'
  const live = typeof circle?.live_pact_count === 'number' ? circle.live_pact_count : null

  const status = !activity.known
    ? `${total} ${total === 1 ? 'member' : 'members'}`
    : active === 0
      ? 'Quiet this week. Be the first to post.'
      : active >= total
        ? 'Everyone showed up this week.'
        : `${active} of ${total} showed up this week.`

  return (
    <Link
      href={`/circles/${circle.id}`}
      className="flex items-center gap-3.5 rounded-[24px] py-3.5 pl-3 pr-4 transition active:scale-[0.99]"
      style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, boxShadow: '0 1px 0 rgba(23,24,29,0.03), 0 16px 30px -26px rgba(23,24,29,0.5)', color: INK }}
    >
      <OrbitRing name={circle?.name} photoUrl={circle?.photo_url} members={faces} total={total} active={active} duration={duration} />

      <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[17px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>{circle?.name}</span>
          {isPrivate && <Lock className="size-[13px] shrink-0" strokeWidth={2.4} style={{ color: MUTED }} aria-label="Private circle" />}
        </span>
        <span className="text-[13.5px] leading-snug" style={{ color: MUTED }}>{status}</span>
        <span className="mt-1 flex flex-wrap gap-1.5">
          {live != null && (
            <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: '#F4EFE4', color: INK }}>
              {live} live {live === 1 ? 'pact' : 'pacts'}
            </span>
          )}
          <span className="rounded-full px-2.5 py-1 text-[12px] font-extrabold" style={{ background: '#F4EFE4', color: INK }}>
            {total} {total === 1 ? 'member' : 'members'}
          </span>
        </span>
      </span>
    </Link>
  )
}
