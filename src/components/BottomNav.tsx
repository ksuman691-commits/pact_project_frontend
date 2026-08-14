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

  if (pathname?.startsWith('/auth') || pathname?.startsWith('/pacts/create')) {
    return null
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t backdrop-blur-xl"
      style={{
        background: 'var(--pact-surface, #F4F2FB)',
        borderColor: 'var(--pact-hairline, rgba(20,18,31,0.06))',
        boxShadow: '0 -8px 24px var(--pact-shadow-violet, rgba(94,84,142,0.08))',
      }}
    >
      <div className="flex items-center justify-around px-4 py-4 pb-safe gap-2">
        {authItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="pact-btn-glow relative w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, var(--pact-pink, #14121F), var(--pact-violet, #14121F))',
                      color: 'var(--pact-text, #ffffff)',
                      boxShadow: '0 4px 16px var(--pact-shadow-violet, rgba(20,18,31,0.15))',
                    }
                  : {
                      background: 'var(--pact-surface-2, #ffffff)',
                      color: 'var(--pact-text-faint, #6B7280)',
                    }
              }
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
