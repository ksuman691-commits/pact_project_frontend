'use client'

import { Flame, Check } from 'lucide-react'

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function StreakCard({
  streak,
  week,
}: {
  streak: number
  week: boolean[]
}) {
  return (
    <section className="mx-5 mt-5 overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300">Current streak</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-extrabold leading-none">{streak}</span>
            <span className="mb-1 text-sm font-medium text-slate-300">days</span>
          </div>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
          <Flame className="h-7 w-7 text-amber-400" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        {week.map((done, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-emerald-500 text-white' : 'border border-slate-700 text-slate-500'
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : dayLabels[i]}
            </div>
            <span className="text-[10px] text-slate-400">{dayLabels[i]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
