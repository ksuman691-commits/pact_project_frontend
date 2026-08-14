'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '✨', color: 'from-slate-700 to-slate-900' },
  { id: 'Trending', name: 'Trending', emoji: '🔥', color: 'from-red-500 to-orange-500' },
  { id: 'Fitness', name: 'Fitness', emoji: '💪', color: 'from-green-500 to-emerald-600' },
  { id: 'Coding', name: 'Coding', emoji: '💻', color: 'from-purple-500 to-indigo-600' },
  { id: 'Study', name: 'Study', emoji: '📚', color: 'from-amber-500 to-orange-600' },
  { id: 'Startup', name: 'Startup', emoji: '🚀', color: 'from-blue-500 to-cyan-600' },
  { id: 'Habits', name: 'Habits', emoji: '⚡', color: 'from-yellow-500 to-amber-600' },
  { id: 'Creator', name: 'Creator', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { id: 'Social', name: 'Social', emoji: '👥', color: 'from-cyan-500 to-blue-600' },
]

interface TopNavProps {
  showBack?: boolean
  showCategories?: boolean
  fixed?: boolean
  compact?: boolean
  onCreatePactClick?: () => void
  isLoadingCategories?: boolean
  activeCategory?: string
  onCategoryChange?: (categoryId: string) => void
}

export default function TopNav({
  showBack = false,
  showCategories = true,
  fixed = true,
  compact = false,
  isLoadingCategories = false,
  activeCategory,
  onCategoryChange,
}: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentCategory = (activeCategory || 'all').toLowerCase()

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
    if (isLoadingCategories) return

    if (onCategoryChange) {
      onCategoryChange(categoryId)
      return
    }

    const nextPath = categoryId === 'all' ? '/feed' : `/feed?category=${encodeURIComponent(categoryId)}`
    router.replace(nextPath, { scroll: false })
  }

  return (
    <>
      {/* Top Navigation Bar */}
      {/* Falls back to the original light-theme values so pages other than
          Feed (which don't wrap this in .pact-flow) render unchanged. */}
      <nav className={`${fixed ? 'fixed inset-x-0 top-0 z-50 mx-auto max-w-md' : 'relative max-w-md mx-auto'} overflow-visible border-b border-[var(--pact-hairline,rgba(20,18,31,0.06))]/80 bg-[var(--pact-bg,#ffffff)]/95 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur`}>
        <div className={`px-4 ${compact ? 'py-2' : 'py-3'}`}>
          {/* Navigation Links */}
          <div className={`flex items-center ${compact ? 'mb-1' : 'mb-3'}`}>
            <div className="flex items-center gap-4">
              {/* Back Button - Show on detail pages */}
              {showBack && (
                <button
                  onClick={handleBack}
                  className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-[var(--pact-text-faint,#94a3b8)] hover:text-[var(--pact-text-dim,#6B7280)] transition-colors"
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
                    isActive('/') ? 'text-[var(--pact-pink,#A78BFA)]' : 'text-[var(--pact-text-faint,#94a3b8)] hover:text-[var(--pact-text-dim,#6B7280)]'
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
            <div className={`${compact ? 'pt-2' : 'pt-4'} border-t border-[var(--pact-hairline,rgba(20,18,31,0.06))] -mx-4 px-4 bg-[var(--pact-bg,#ffffff)]`}>
              <div className={`flex overflow-x-auto gap-2 ${compact ? 'pb-2' : 'pb-4'} scrollbar-hide scroll-smooth`}>
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    disabled={isLoadingCategories}
                    className={`pact-btn-glow flex-shrink-0 inline-flex items-center gap-1.5 ${compact ? 'px-3 py-1' : 'px-3 py-1.5'} rounded-full text-xs font-semibold whitespace-nowrap transition-all hover:scale-[1.01] ${
                      currentCategory === category.id.toLowerCase()
                        ? `bg-gradient-to-r ${category.color} text-white shadow-[0_4px_12px_rgba(94,84,142,0.08)]`
                        : 'bg-[var(--pact-surface-2,#FAF9FE)] text-[var(--pact-text-dim,#334155)] hover:bg-[var(--pact-surface-3,#e2e8f0)]'
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
