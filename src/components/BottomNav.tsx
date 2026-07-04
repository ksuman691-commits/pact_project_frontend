'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Activity, User, Plus } from 'lucide-react'

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/feed', label: 'Feed', icon: Activity },
  { href: '/profile', label: 'Profile', icon: User },
]

interface BottomNavProps {
  onCreatePactClick?: () => void
}

export default function BottomNav({ onCreatePactClick }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
      <div className="relative border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="grid grid-cols-5 items-center">
          {items.slice(0, 2).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          {/* Center create button */}
          <div className="flex justify-center">
            <button
              onClick={onCreatePactClick}
              aria-label="Create pact"
              className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-600/50 transition-all transform hover:scale-110 active:scale-95 hover:shadow-2xl"
            >
              <Plus className="h-8 w-8" />
            </button>
          </div>

          {items.slice(2).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>
      </div>
    </nav>
  )
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof Home }
  active: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium transition-colors ${
        active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </Link>
  )
}
