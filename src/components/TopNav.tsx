'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Target, Plus, Bell } from 'lucide-react'
import { useState } from 'react'

const CATEGORIES = [
  { id: 'trending', name: 'Trending', emoji: '🔥', color: 'from-red-500 to-orange-500' },
  { id: 'elections', name: 'Elections', emoji: '🗳️', color: 'from-blue-500 to-blue-600' },
  { id: 'politics', name: 'Politics', emoji: '📊', color: 'from-purple-500 to-purple-600' },
  { id: 'sports', name: 'Sports', emoji: '🏃', color: 'from-green-500 to-green-600' },
  { id: 'culture', name: 'Culture', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { id: 'climate', name: 'Climate', emoji: '🌱', color: 'from-emerald-500 to-teal-600' },
  { id: 'commodities', name: 'Commodities', emoji: '📈', color: 'from-amber-500 to-orange-600' },
  { id: 'economics', name: 'Economics', emoji: '📉', color: 'from-cyan-500 to-blue-600' },
  { id: 'finance', name: 'Finance', emoji: '💰', color: 'from-yellow-500 to-amber-600' },
  { id: 'tech', name: 'Tech & Science', emoji: '⚡', color: 'from-indigo-500 to-purple-600' },
]

interface TopNavProps {
  onCreatePactClick?: () => void
}

export default function TopNav({ onCreatePactClick }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [scrollPos, setScrollPos] = useState(0)

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to feed with category filter or scroll to category
    router.push(`/feed?category=${categoryId}`)
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed inset-x-0 top-0 z-50 mx-auto max-w-md bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          {/* Navigation Links */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              {/* Home Button */}
              <Link
                href="/"
                className={`flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors ${
                  isActive('/') ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="h-6 w-6" strokeWidth={isActive('/') ? 2.4 : 2} />
                <span>Home</span>
              </Link>

              {/* Pact Button */}
              <Link
                href="/feed"
                className={`flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors ${
                  isActive('/feed') ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Target className="h-6 w-6" strokeWidth={isActive('/feed') ? 2.4 : 2} />
                <span>Feed</span>
              </Link>
            </div>

            {/* Create Pact Button */}
            <button
              onClick={onCreatePactClick}
              aria-label="Create pact"
              className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-110 active:scale-95 hover:shadow-xl -mt-1"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>

            {/* Notification Bell */}
            <button
              aria-label="Notifications"
              className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors relative"
            >
              <div className="relative">
                <Bell className="h-6 w-6" strokeWidth={2} />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  3
                </span>
              </div>
              <span>Notify</span>
            </button>
          </div>

          {/* Category Strip */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex overflow-x-auto gap-2.5 pb-3 scrollbar-hide scroll-smooth">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 whitespace-nowrap ${
                    pathname?.includes(`category=${category.id}`)
                      ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
                  }`}
                >
                  <span className="text-sm">{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-32" />
    </>
  )
}
