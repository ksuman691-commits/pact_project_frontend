'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'

const CATEGORIES = [
  { id: 'trending', name: 'Trending', emoji: '🔥', color: 'from-red-500 to-orange-500' },
  { id: 'fitness', name: 'Fitness', emoji: '💪', color: 'from-green-500 to-emerald-600' },
  { id: 'startup', name: 'Startup', emoji: '🚀', color: 'from-blue-500 to-cyan-600' },
  { id: 'coding', name: 'Coding', emoji: '💻', color: 'from-purple-500 to-indigo-600' },
  { id: 'creator', name: 'Creator', emoji: '🎬', color: 'from-pink-500 to-rose-500' },
  { id: 'study', name: 'Study', emoji: '📚', color: 'from-amber-500 to-orange-600' },
  { id: 'habits', name: 'Habits', emoji: '⚡', color: 'from-yellow-500 to-amber-600' },
  { id: 'social', name: 'Social', emoji: '👥', color: 'from-cyan-500 to-blue-600' },
]

interface TopNavProps {
  showBack?: boolean
  showCategories?: boolean
  fixed?: boolean
  compact?: boolean
  onCreatePactClick?: () => void
}

export default function TopNav({ showBack = false, showCategories = true, fixed = true, compact = false }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleBack = () => {
    // Go back to feed if on a detail page, otherwise to home
    if (pathname?.includes('/pact-details') || pathname?.includes('/profile') || pathname?.includes('/circles')) {
      router.push('/feed')
    } else {
      router.back()
    }
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to feed with category filter or scroll to category
    router.push(`/feed?category=${categoryId}`)
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className={`${fixed ? 'fixed inset-x-0 top-0 z-50 mx-auto max-w-md' : 'relative max-w-md mx-auto'} bg-white border-b border-slate-200 shadow-sm overflow-visible`}>
        <div className={`px-4 ${compact ? 'py-2' : 'py-3'}`}>
          {/* Navigation Links */}
          <div className={`flex items-center ${compact ? 'mb-1' : 'mb-3'}`}>
            <div className="flex items-center gap-4">
              {/* Back Button - Show on detail pages */}
              {showBack && (
                <button
                  onClick={handleBack}
                  className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-6 w-6" strokeWidth={2} />
                  <span>Back</span>
                </button>
              )}

              {/* Feed/Home Button - Hide when on feed page */}
              {!isActive('/feed') && (
                <Link
                  href="/feed"
                  className={`flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors ${
                    isActive('/') ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Home className="h-6 w-6" strokeWidth={isActive('/') ? 2.4 : 2} />
                  <span>Feed</span>
                </Link>
              )}
            </div>
          </div>

          {/* Category Strip - Only show when showCategories is true */}
          {showCategories && (
            <div className={`${compact ? 'pt-2' : 'pt-4'} border-t border-slate-200 -mx-4 px-4 bg-white`}>
              <div className={`flex overflow-x-auto gap-2 ${compact ? 'pb-2' : 'pb-4'} scrollbar-hide scroll-smooth`}>
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 ${compact ? 'px-3 py-1' : 'px-3 py-1.5'} rounded-lg text-xs font-semibold transition-all transform hover:scale-105 whitespace-nowrap ${
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
          )}
        </div>
      </nav>

      {/* Spacer to prevent content overlap */}
      {fixed && <div className={showCategories ? 'h-36' : 'h-24'} />}
    </>
  )
}
