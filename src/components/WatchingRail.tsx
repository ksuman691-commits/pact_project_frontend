'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { getMyWatching } from '@/lib/api/access'
import { useAuthStore } from '@/store/auth'

/**
 * Home: the pacts the viewer paid to watch, with how many new moments each has.
 * Hidden when there are none. The pacts themselves sit at the top of the feed
 * below (the server orders them first); See All opens the Watching tab.
 */
export default function WatchingRail() {
  const { user } = useAuthStore()
  const query = useQuery({ queryKey: ['my-watching', user?.id], queryFn: getMyWatching, enabled: !!user?.id, staleTime: 30_000 })
  const today = new Date().toLocaleDateString('en-CA')
  const live = (query.data?.watching ?? []).filter((p: any) => p.status === 'active' && (!p.end_date || String(p.end_date).slice(0, 10) >= today))
  if (live.length === 0) return null
  const newCount = live.filter((p: any) => Number(p.watch?.new_moments ?? 0) > 0).length

  return (
    <section aria-label="Pacts you watch" className="pt-1">
      <div className="flex items-baseline justify-between px-0.5 pb-2.5">
        <h2 className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--navy)]">
          Watching {newCount > 0 && <span className="font-bold text-[var(--muted)]">{newCount} New</span>}
        </h2>
        <Link href="/pacts?filter=Watching" className="text-[13px] font-extrabold text-[var(--navy)]">
          See All
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {live.map((pact: any) => {
          const fresh = Number(pact.watch?.new_moments ?? 0)
          const initial = (pact.creator_full_name || pact.creator_username || '?').slice(0, 1).toUpperCase()
          return (
            <Link key={pact.id} href={`/pacts/${pact.id}`} className="w-[72px] shrink-0 text-center">
              <span
                className={`relative mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--card)] p-[3px] ${fresh > 0 ? 'border-[2.5px] border-[var(--navy)]' : 'border-[1.5px] border-[var(--line)]'}`}
              >
                <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[var(--navy)] text-[16px] font-extrabold text-white">
                  {pact.creatorAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pact.creatorAvatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                <span className={`absolute -bottom-0.5 -right-1 flex size-[22px] items-center justify-center rounded-full border-[1.5px] bg-white ${fresh > 0 ? 'border-[var(--navy)] text-[var(--navy)]' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                  <Check className="size-[11px]" strokeWidth={3.2} aria-hidden="true" />
                </span>
              </span>
              <span className="mt-1.5 block truncate text-[12px] font-extrabold">{pact.title}</span>
              <span className={`block text-[11.5px] ${fresh > 0 ? 'font-bold text-[var(--navy)]' : 'font-semibold text-[var(--muted)]'}`}>{fresh > 0 ? `${fresh} new` : 'Caught up'}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
