'use client'

import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/components/TopNav'

/**
 * "For you" heading plus one scrollable chip per real backend category.
 * Replaces the old grey dropdown band; same categories, same /feed?category=
 * URLs, so deep links and the feed query keep working.
 */
export default function FeedFilterChips({ activeCategory, disabled = false }: { activeCategory?: string; disabled?: boolean }) {
  const router = useRouter()
  const current = (activeCategory || 'all').toLowerCase()
  const selectedId = CATEGORIES.find((c) => c.id.toLowerCase() === current)?.id ?? 'all'

  const select = (id: string) => {
    if (disabled || id === selectedId) return
    router.replace(id === 'all' ? '/feed' : `/feed?category=${encodeURIComponent(id)}`, { scroll: false })
  }

  return (
    <section aria-label="Feed filters" className="flex flex-col gap-2">
      <h2 className="px-1 text-[17px] font-bold tracking-[-0.01em] text-[var(--ink)]">For you</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter pacts by category">
        {CATEGORIES.map((category) => {
          const active = category.id === selectedId
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              disabled={disabled && !active}
              onClick={() => select(category.id)}
              className={`h-10 shrink-0 rounded-full border px-4 text-[13.5px] font-bold transition active:scale-[0.97] disabled:opacity-60 ${
                active
                  ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                  : 'border-[var(--hairline)] bg-[var(--card)] text-[var(--ink)]'
              }`}
            >
              {category.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}
