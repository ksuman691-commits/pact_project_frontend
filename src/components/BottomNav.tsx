'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, TrendingUp } from 'lucide-react'

const authItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/auth')) {
    return null
  }

  const items = authItems

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-white border-t border-slate-200 shadow-lg">
      <div className="flex items-center px-4 py-3 pb-safe">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
