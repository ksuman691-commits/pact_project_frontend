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
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-[#F4F2FB] border-t border-[rgba(20,18,31,0.06)] shadow-[0_-8px_24px_rgba(94,84,142,0.08)]">
      <div className="flex items-center justify-around px-4 py-4 pb-safe gap-2">
        {authItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                active
                  ? 'bg-[#14121F] text-white shadow-[0_4px_12px_rgba(20,18,31,0.15)]'
                  : 'bg-white text-[#6B7280] shadow-[0_4px_12px_rgba(94,84,142,0.08)] hover:shadow-[0_6px_16px_rgba(94,84,142,0.12)]'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
