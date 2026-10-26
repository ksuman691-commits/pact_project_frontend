'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeft, ChevronDown } from 'lucide-react'

// Feed filters: the real backend categories, named the same way the new
// pact flow names them (see lib/pactSentence.ts).
export const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '✨' },
  { id: 'Trending', name: 'Trending', emoji: '🔥' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'study', name: 'Learning', emoji: '📚' },
  { id: 'creator', name: 'Create', emoji: '🎨' },
  { id: 'startup', name: 'Build & Money', emoji: '🚀' },
  { id: 'coding', name: 'Coding', emoji: '💻' },
  { id: 'social', name: 'Social', emoji: '🎉' },
  { id: 'habits', name: 'Habits', emoji: '🔁' },
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
  // CATEGORIES ids aren't consistently cased ('Trending' vs 'fitness'), but
  // currentCategory always is lowercase (see the prop's callers), so match
  // case-insensitively and fall back to 'all' for any unrecognized value.
  const selectedCategoryId = CATEGORIES.find((category) => category.id.toLowerCase() === currentCategory)?.id ?? 'all'

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

    // Keep "Pay to watch" on while the category changes.
    const keepPaid = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('paid') === '1'
    const params = new URLSearchParams()
    if (categoryId !== 'all') params.set('category', categoryId)
    if (keepPaid) params.set('paid', '1')
    const query = params.toString()
    router.replace(query ? `/feed?${query}` : '/feed', { scroll: false })
  }

  return (
    <>
      {/* Top Navigation Bar */}
      {/* Falls back to the original light-theme values so pages other than
          Feed (which don't wrap this in .pact-flow) render unchanged. */}
      <nav className={`${fixed ? 'fixed inset-x-0 top-0 z-50 mx-auto max-w-md' : 'relative max-w-md mx-auto'} overflow-visible border-b border-[var(--pact-hairline,var(--hairline))]/80 bg-[var(--pact-bg,var(--paper))]/95 shadow-[0_8px_30px_rgba(23,24,29,0.06)] backdrop-blur`}>
        <div className={`px-4 ${compact ? 'py-2' : 'py-3'}`}>
          {/* Navigation Links */}
          <div className={`flex items-center ${compact ? 'mb-1' : 'mb-3'}`}>
            <div className="flex items-center gap-4">
              {/* Back Button - Show on detail pages */}
              {showBack && (
                <button
                  onClick={handleBack}
                  className="flex flex-col items-center gap-1 py-1 text-xs font-medium text-[var(--pact-text-faint,var(--muted))] hover:text-[var(--pact-text-dim,var(--muted))] transition-colors"
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
                    isActive('/') ? 'text-navy' : 'text-[var(--pact-text-faint,var(--muted))] hover:text-[var(--pact-text-dim,var(--muted))]'
                  }`}
                >
                  <Home className="h-6 w-6" strokeWidth={isActive('/') ? 2.4 : 2} />
                  <span>Feed</span>
                </Link>
              )}


            </div>
          </div>

          {/* Category filter - Only show when showCategories is true */}
          {showCategories && (
            <div className={`${compact ? 'pt-2' : 'pt-4'} border-t border-[var(--pact-hairline,var(--hairline))] -mx-4 px-4 bg-[var(--pact-bg,var(--paper))]`}>
              <div className={`relative inline-block ${compact ? 'pb-2' : 'pb-4'}`}>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => handleCategoryClick(event.target.value)}
                  disabled={isLoadingCategories}
                  aria-label="Filter pacts by category"
                  className="appearance-none cursor-pointer rounded-full border border-[var(--pact-hairline,var(--hairline))] bg-[var(--pact-surface-2,var(--card))] py-1.5 pl-3.5 pr-9 text-xs font-semibold text-[var(--pact-text-dim,var(--muted))] transition-colors hover:bg-[var(--pact-surface-3,var(--card-muted))] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--pact-text-faint,var(--muted))]"
                  aria-hidden="true"
                />
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
