'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Heart, CheckCircle2 } from 'lucide-react'
import type { DashActivity } from '@/lib/dashboard-data'

export default function ActivityFeed({ activity }: { activity: DashActivity[] }) {
  return (
    <section className="mt-7">
      <h2 className="px-5 text-base font-bold text-slate-900">Activity feed</h2>

      <div className="mt-3 space-y-4 px-5">
        {activity.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function ActivityItem({ item }: { item: DashActivity }) {
  const [liked, setLiked] = useState(false)
  const cheers = item.cheers + (liked ? 1 : 0)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
          {item.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-900">
            <span className="font-semibold">{item.user}</span>{' '}
            <span className="text-slate-500">{item.action}</span>{' '}
            <span className="font-medium">{item.goal}</span>
          </p>
          <p className="text-[11px] text-slate-400">{item.time}</p>
        </div>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      </div>

      {item.photo && (
        <div className="relative aspect-[4/3] w-full bg-slate-100">
          <Image
            src={item.photo}
            alt={`${item.user}'s proof for ${item.goal}`}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={() => setLiked((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600"
          aria-pressed={liked}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
          />
          {cheers}
        </button>
        <span className="text-xs text-slate-400">Cheer on {item.user}</span>
      </div>
    </article>
  )
}
