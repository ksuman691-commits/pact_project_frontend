'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, TrendingUp, Zap } from 'lucide-react'

const authItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/dares', label: 'Dares', icon: Zap },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/auth')) {
    return null
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-slate-200/80 bg-white/90 shadow-[0_-8px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="flex items-center gap-1 px-3 py-2 pb-safe">
        {authItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all ${
                active
                  ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
