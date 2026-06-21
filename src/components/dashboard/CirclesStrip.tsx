'use client'

import { Plus, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DashCircle } from '@/lib/dashboard-data'

export default function CirclesStrip({ circles }: { circles: DashCircle[] }) {
  const router = useRouter()

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-base font-bold text-slate-900">Your circles</h2>
        <button
          onClick={() => router.push('/circles')}
          className="text-xs font-semibold text-emerald-600"
        >
          See all
        </button>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => router.push('/circles/create')}
          className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-5 text-slate-500 transition-colors hover:border-emerald-400 hover:text-emerald-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold">New circle</span>
        </button>

        {circles.map((circle) => (
          <button
            key={circle.id}
            onClick={() => router.push(`/circles/${circle.id}`)}
            className="w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${circle.color} text-sm font-bold text-white`}>
              {circle.name.charAt(0)}
            </div>
            <div className="mt-3 flex items-center gap-1">
              <p className="truncate text-sm font-semibold text-slate-900">{circle.name}</p>
              {circle.isOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">{circle.members} members</p>
          </button>
        ))}
      </div>
    </section>
  )
}
