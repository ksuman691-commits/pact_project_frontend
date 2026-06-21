'use client'

import { Megaphone, Users } from 'lucide-react'
import type { DashAnnouncement } from '@/lib/dashboard-data'

export default function PactAnnouncements({
  announcements,
}: {
  announcements: DashAnnouncement[]
}) {
  if (announcements.length === 0) return null

  return (
    <section className="mt-7">
      <div className="flex items-center gap-2 px-5">
        <Megaphone className="h-4 w-4 text-emerald-600" />
        <h2 className="text-base font-bold text-slate-900">New pacts to join</h2>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {announcements.map((a) => (
          <article
            key={a.id}
            className="w-64 shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                {a.circle}
              </span>
              <span className="text-[11px] text-slate-400">{a.time}</span>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-900">{a.title}</p>
            <p className="mt-1 text-xs text-slate-500">Created by {a.owner}</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {a.joined} joined
              </span>
              <button className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700">
                Join pact
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
