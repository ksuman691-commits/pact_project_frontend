'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
/*
 * Each tab has its own solid, bright icon in its own colour (Home navy, Circles red,
 * Pacts blue, Dares yellow) instead of an outline with colour poured in, and it
 * springs up when its tab opens.
 */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" aria-hidden="true">
      <path d="M3.5 10.6 12 3.8l8.5 6.8V19a1.8 1.8 0 0 1-1.8 1.8H15v-5.6h-6v5.6H5.3A1.8 1.8 0 0 1 3.5 19z" fill="#1F3A93" />
      <path d="M9 20.8v-5.6h6v5.6z" fill="#7FA0FF" />
    </svg>
  )
}
function CirclesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" aria-hidden="true">
      <circle cx="9" cy="12" r="6.5" fill="#E5363B" />
      <circle cx="15" cy="12" r="6.5" fill="#FF7A6B" fillOpacity="0.9" />
      <path d="M12 6.7a6.5 6.5 0 0 1 0 10.6 6.5 6.5 0 0 1 0-10.6z" fill="#B81F2A" />
    </svg>
  )
}
function PactsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" aria-hidden="true">
      <circle cx="9" cy="8" r="3.6" fill="#2F6BFF" />
      <path d="M2.5 19.5c0-3.6 2.9-6.3 6.5-6.3s6.5 2.7 6.5 6.3z" fill="#2F6BFF" />
      <circle cx="16.5" cy="8.6" r="3" fill="#7FA8FF" />
      <path d="M14.8 13.6c.6-.2 1.1-.3 1.7-.3 3 0 5.3 2.3 5.3 5.4v.8h-4.6c0-2.3-.9-4.4-2.4-5.9z" fill="#7FA8FF" />
    </svg>
  )
}
function DaresIcon({ flicker }: { flicker: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[26px] w-[26px] ${flicker ? 'cp-zap' : ''}`} aria-hidden="true">
      <path d="M13.8 2.5 4.6 13.4h6.1l-1.4 8.1 9.3-11.1h-6.2z" fill="#FFC814" stroke="#17181D" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  )
}

const authItems = [
  { href: '/feed', label: 'Home', color: 'var(--navy)' },
  { href: '/circles', label: 'Circles', color: 'var(--circles-deep)' },
  { href: '/pacts', label: 'Pacts', color: 'var(--pacts-ink)' },
  // Yellow text is unreadable on the cream bar, so the Dares label stays ink.
  { href: '/dares', label: 'Dares', color: 'var(--ink)' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user, isInitialized } = useAuthStore()
  const isHiddenRoute =
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/onboarding') ||
    pathname === '/verify-age' ||
    pathname === '/consent' ||
    pathname === '/' ||
    // Public profile pages are a landing page of their own.
    pathname?.startsWith('/u/') ||
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
              {/* Remounted when the tab opens, so the pop plays each time. */}
              <span key={active ? 'on' : 'off'} className={active ? 'cp-tab-pop flex' : 'flex'}>
                {item.href === '/feed' ? <HomeIcon /> : item.href === '/circles' ? <CirclesIcon /> : item.href === '/pacts' ? <PactsIcon /> : <DaresIcon flicker={isDares && pendingForYouCount > 0} />}
              </span>
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
              style={{ background: active ? item.color : 'transparent' }}
            />
            <span
              className="text-[12px] leading-none"
              style={{
                color: active ? item.color : '#3D3C39',
                fontWeight: active ? 800 : 600,
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
