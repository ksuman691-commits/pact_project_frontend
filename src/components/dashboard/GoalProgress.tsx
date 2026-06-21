'use client'

import { ChevronRight } from 'lucide-react'
import type { DashGoal } from '@/lib/dashboard-data'

const colorMap: Record<DashGoal['color'], { bar: string; text: string }> = {
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-600' },
  sky: { bar: 'bg-sky-500', text: 'text-sky-600' },
  rose: { bar: 'bg-rose-500', text: 'text-rose-600' },
}

export default function GoalProgress({ goals }: { goals: DashGoal[] }) {
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-base font-bold text-slate-900">Your goals</h2>
        <button className="text-xs font-semibold text-emerald-600">See all</button>
      </div>

      <div className="mt-3 space-y-3 px-5">
        {goals.map((goal) => {
          const c = colorMap[goal.color]
          return (
            <button
              key={goal.id}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{goal.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{goal.circle}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${c.bar}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${c.text}`}>{goal.progress}%</span>
              </div>

              <p className="mt-2 text-[11px] text-slate-400">{goal.daysLeft} days left</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
