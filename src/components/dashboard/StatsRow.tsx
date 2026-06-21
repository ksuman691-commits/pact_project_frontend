'use client'

import { Target, Users, Trophy } from 'lucide-react'

export default function StatsRow({
  activePacts,
  circles,
  completed,
  reputation,
}: {
  activePacts: number
  circles: number
  completed: number
  reputation: number
}) {
  const items = [
    { label: 'Active', value: activePacts, icon: Target, tint: 'text-emerald-600 bg-emerald-50' },
    { label: 'Circles', value: circles, icon: Users, tint: 'text-sky-600 bg-sky-50' },
    { label: 'Done', value: completed, icon: Trophy, tint: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <section className="mx-5 mt-5 grid grid-cols-3 gap-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-center"
          >
            <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${item.tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{item.value}</p>
            <p className="text-[11px] text-slate-500">{item.label}</p>
          </div>
        )
      })}
    </section>
  )
}
