'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Plus, Wallet, User } from 'lucide-react'

const navItems = [
  { href: '/home', label: 'Feed', icon: Home },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/pacts/create', label: 'Create', icon: Plus },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/auth') || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    // Mobile Bottom Navigation - hidden on desktop (md:hidden)
    <nav className="fixed inset-x-0 bottom-0 md:hidden z-40 mx-auto max-w-md bg-white border-t border-slate-200 shadow-elevation-lg">
      <div className="flex items-center justify-around px-2 py-3 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors touch-target ${
                active
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 2} />
              <span className="text-caption font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
