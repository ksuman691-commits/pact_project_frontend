'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeft, ChevronDown } from 'lucide-react'

// IMPORTANT: these ids are the backend's `category` column values, and the
// backend enforces a hard server-side enum of exactly these 7 strings
// (confirmed live: POST /api/pacts with any other value, including a raw
// vibe id like "adventure" or "money", is rejected with 422). The Create
// Pact flow's 10-vibe taxonomy (src/lib/createPactFlow/content.ts) maps
// many-to-few onto these 7 buckets via VIBE_TO_CATEGORY in
// src/lib/createPactFlow/toApiPayload.ts — e.g. adventure/love/social all
// collapse to "social". Rather than showing 10 filter chips where several
// visually-different ones would silently return identical result sets, we
// show exactly one chip per REAL filterable bucket, with a friendlier
// vibe-inspired name where one vibe maps cleanly (dare→Dare Yourself,
// create→Create, levelup→Level Up), or a combined name where multiple
// vibes collapse into the same bucket (fitness, startup, social). "Coding"
// has no vibe mapped to it at all in the current create flow — it's a
// legacy-only bucket kept so older pacts created before the vibe flow
// existed remain filterable.
const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '✨' },
  { id: 'Trending', name: 'Trending', emoji: '🔥' },
  { id: 'fitness', name: 'Glow Up & Wellbeing', emoji: '💪' },
  { id: 'startup', name: 'Build & Earn', emoji: '🚀' },
  { id: 'habits', name: 'Dare Yourself', emoji: '🔥' },
  { id: 'social', name: 'Social & Adventure', emoji: '🎉' },
  { id: 'creator', name: 'Create', emoji: '🎨' },
  { id: 'study', name: 'Level Up', emoji: '🧠' },
  { id: 'coding', name: 'Coding', emoji: '💻' },
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

          {/* Category filter - Only show when showCategories is true */}
          {showCategories && (
            <div className={`${compact ? 'pt-2' : 'pt-4'} border-t border-[var(--pact-hairline,rgba(20,18,31,0.06))] -mx-4 px-4 bg-[var(--pact-bg,#ffffff)]`}>
              <div className={`relative inline-block ${compact ? 'pb-2' : 'pb-4'}`}>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => handleCategoryClick(event.target.value)}
                  disabled={isLoadingCategories}
                  aria-label="Filter pacts by category"
                  className="appearance-none cursor-pointer rounded-full border border-[var(--pact-hairline,rgba(20,18,31,0.06))] bg-[var(--pact-surface-2,#FAF9FE)] py-1.5 pl-3.5 pr-9 text-xs font-semibold text-[var(--pact-text-dim,#334155)] transition-colors hover:bg-[var(--pact-surface-3,#e2e8f0)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.emoji} {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--pact-text-faint,#94a3b8)]"
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
