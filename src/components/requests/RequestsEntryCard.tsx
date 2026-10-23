'use client'

import Link from 'next/link'
import { ChevronRight, Inbox } from 'lucide-react'
import { useAccessInbox, useCircleRequests } from '@/hooks/usePactAccess'
import { useTipInbox } from '@/hooks/useTips'

/** People waiting on you: watch asks and payments, circle join asks, tips to confirm. */
export function useRequestCount(enabled = true) {
  const watch = useAccessInbox(enabled)
  const circles = useCircleRequests(enabled)
  const tips = useTipInbox(enabled)
  // A reply of an unexpected shape counts as zero instead of taking the page down.
  const size = (list: unknown) => (Array.isArray(list) ? list.length : 0)
  return size((watch.data as any)?.pending) + size((circles.data as any)?.pending) + size((tips.data as any)?.waiting)
}

/** On your own profile, only when someone is waiting on you. */
export default function RequestsEntryCard({ className = '' }: { className?: string }) {
  const count = useRequestCount()
  if (count === 0) return null
  return (
    <Link href="/requests" className={`flex items-center gap-3 rounded-[18px] px-4 py-3 ${className}`} style={{ background: '#F5F7FD', border: '1.5px solid #1F3A93' }}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: '#17181D', color: '#FFFFFF' }}>
        <Inbox className="size-5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold" style={{ color: '#17181D' }}>
          {count} {count === 1 ? 'Request' : 'Requests'}
        </span>
        <span className="block truncate text-[13px]" style={{ color: '#5A5C63' }}>People waiting to watch, join or be thanked</span>
      </span>
      <ChevronRight className="size-5 shrink-0" style={{ color: '#5A5C63' }} />
    </Link>
  )
}
