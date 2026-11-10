'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Circle, Zap } from 'lucide-react'
import { usePendingDareCount } from '@/hooks/usePendingDareCount'
import { useAuthStore } from '@/store/auth'
import QuickPostButton from '@/components/QuickPostButton'
import { STORIES_ENABLED } from '@/lib/stories'

// Leaderboard was dropped from the nav deliberately (it 404s and we're not
// fixing that route here) — exactly 4 items, Home → Circles → Pacts → Dares.
// "Curated" used to live here as its own destination; it's been folded into
// the Discover tabs on the Pacts and Dares pages instead, since those tabs
// already cover "browse things you haven't joined yet" and a separate
// bottom-nav entry for essentially the same purpose was redundant.
const authItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/circles', label: 'Circles', icon: Circle },
  { href: '/pacts', label: 'Pacts', icon: Users },
  { href: '/dares', label: 'Dares', icon: Zap },
]

// Classic redesign: the floating gradient pill (which has twice caused
// content below it to be hidden/overlapped) is replaced with a flat,
// edge-to-edge bar fixed to the bottom of the viewport. Every page's
// scrollable content is expected to reserve bottom padding (see
// `pb-nav-safe` usage across pages) so nothing sits underneath it.
export default function BottomNav() {
  const pathname = usePathname()
  const { user, isInitialized } = useAuthStore()
  const isHiddenRoute =
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/onboarding') ||
    pathname === '/verify-age' ||
    pathname === '/consent' ||
    pathname === '/' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname?.startsWith('/pacts/create') ||
    pathname?.startsWith('/circles/create') ||
    // The circle wall is a public, unauthenticated share surface (linked from
    // the QR code / social shares) — it must not show the members-only app
    // shell nav, which would overlap its own "Join CirclePact" CTA and tempt
    // logged-out visitors into auth-gated routes that just bounce them to login.
    pathname?.endsWith('/wall')

  // Shares the Dares page's "my dares" query; off on signed-out and hidden
  // routes (asking while signed out 401s and loops through sign-in).
  const pendingForYouCount = usePendingDareCount(!isHiddenRoute)

  if (isHiddenRoute) {
    return null
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--hairline)',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        paddingTop: '8px',
        paddingLeft: '8px',
        paddingRight: '8px',
      }}
    >
      {authItems.map((item, index) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const isDares = item.href === '/dares'
        const link = (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
            style={{ minHeight: 44 }}
            title={item.label}
            aria-label={isDares && pendingForYouCount > 0 ? `Dares, ${pendingForYouCount} waiting for you` : item.label}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative flex items-center justify-center">
              {isDares ? (
                // Dares are yellow on ink everywhere; the bolt flickers while one waits for you.
                <Icon
                  className={`h-[22px] w-[22px] ${pendingForYouCount > 0 ? 'cp-zap' : ''}`}
                  strokeWidth={1.6}
                  style={{ color: 'var(--ink)', fill: 'var(--dare)' }}
                />
              ) : (
                <Icon className="h-5 w-5" strokeWidth={1.8} style={{ color: active ? 'var(--navy)' : 'var(--muted)' }} />
              )}
              {isDares && pendingForYouCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ink)] px-1 text-[10px] font-bold leading-none text-[var(--dare)]"
                >
                  {pendingForYouCount > 9 ? '9+' : pendingForYouCount}
                </span>
              )}
            </span>
            {/* Active-state indicator: a small dot above the label instead
                of a filled/glowing icon background. */}
            <span
              aria-hidden="true"
              className="h-[5px] w-[5px] rounded-full"
              style={{ background: active ? (isDares ? 'var(--ink)' : 'var(--navy)') : 'transparent' }}
            />
            <span
              className="text-[12px] leading-none"
              style={{
                color: isDares ? 'var(--ink)' : active ? 'var(--navy)' : 'var(--muted)',
                fontWeight: active || isDares ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </Link>
        )
        // The camera sits raised in the middle, between Circles and Pacts.
        if (index === 2 && user && STORIES_ENABLED) {
          return [<QuickPostButton key="camera" />, link]
        }
        return link
      })}
    </nav>
  )
}
