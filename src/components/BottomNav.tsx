'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Circle, Zap } from 'lucide-react'
import { useMyDares } from '@/hooks/useDareQueries'
import { useAuthStore } from '@/store/auth'

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

// Classic redesign: the floating pill (which has twice caused
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
    pathname?.startsWith('/pacts/create') ||
    pathname?.startsWith('/circles/create') ||
    // The circle wall is a public, unauthenticated share surface (linked from
    // the QR code / social shares) — it must not show the members-only app
    // shell nav, which would overlap its own "Join CirclePact" CTA and tempt
    // logged-out visitors into auth-gated routes that just bounce them to login.
    pathname?.endsWith('/wall')

  // Same getMine() result the /dares "For You" tab filters — cached under
  // the same query key, so this doesn't add an extra request beyond what
  // that page already fetches once visited. Must stay disabled until the
  // auth store has actually hydrated a session: this component lives in
  // the root layout and mounts on every route (including /auth/login)
  // before the pathname check below can bail out, so firing it while
  // logged out 401s, which triggers the API client's hard redirect to
  // /auth/login, which remounts this component and fires again — an
  // infinite reload loop.
  const myDaresQuery = useMyDares({ enabled: isInitialized && !!user && !isHiddenRoute })
  const pendingForYouCount = (myDaresQuery.data?.pages?.flatMap((page) => page.data) || []).filter(
    (d: any) => d.my_recipient_status === 'pending' && d.creator_id !== user?.id,
  ).length

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
      {authItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const isDares = item.href === '/dares'
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
            style={{ minHeight: 44 }}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative flex items-center justify-center">
              <Icon
                className="h-5 w-5"
                strokeWidth={1.8}
                style={{ color: active ? 'var(--navy)' : 'var(--muted)' }}
              />
              {/* Dares indicator: only shows when the viewer actually has a
                  pending dare waiting on their response — a plain navy dot,
                  not a glowing/pulsing badge, since it is backed by real
                  data but doesn't need decoration to be legible. */}
              {isDares && pendingForYouCount > 0 && (
                <span
                  aria-hidden="true"
                  className="pact-bottomnav-live-dot absolute -top-0.5 -right-1.5 h-[6px] w-[6px] rounded-full"
                  style={{ background: 'var(--navy)' }}
                />
              )}
            </span>
            {/* Active-state indicator: a small dot above the label instead
                of a filled/glowing icon background. */}
            <span
              aria-hidden="true"
              className="h-[5px] w-[5px] rounded-full"
              style={{ background: active ? 'var(--navy)' : 'transparent' }}
            />
            <span
              className="text-[12px] leading-none"
              style={{
                color: active ? 'var(--navy)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
