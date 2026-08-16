'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Zap } from 'lucide-react'
import { useMyDares } from '@/hooks/useDareQueries'
import { useAuthStore } from '@/store/auth'

// Leaderboard was dropped from the nav deliberately (it 404s and we're not
// fixing that route here) — exactly 3 items, Home → Circles → Dares.
const authItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/dares', label: 'Dares', icon: Zap },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  // Same getMine() result the /dares "For You" tab filters — cached under
  // the same query key, so this doesn't add an extra request beyond what
  // that page already fetches once visited.
  const myDaresQuery = useMyDares()
  const pendingForYouCount = (myDaresQuery.data?.pages?.flatMap((page) => page.data) || []).filter(
    (d: any) => d.my_recipient_status === 'pending' && d.creator_id !== user?.id,
  ).length

  if (
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/pacts/create') ||
    pathname?.startsWith('/circles/create')
  ) {
    return null
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    // Floating pill, not an edge-to-edge strip — the dark page background
    // (each route's own .pact-flow wrapper) shows through around and beneath
    // it instead of the old light strip. See globals.css: --pact-* tokens
    // were previously scoped to .pact-flow only, so this nav (rendered in
    // the root layout, outside any page's .pact-flow div) fell back to the
    // hardcoded light defaults baked into the old inline styles below.
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Rainbow ring wrapper: a rotating multi-hue conic-gradient layer
          fills this outer box, and the pill below sits inset by `margin`
          so a thin rotating rainbow border shows all the way around it —
          same ring-band technique as Avatar's decorative ring. */}
      <div className="relative w-full max-w-[280px] rounded-full">
        {/* Glow layer: same breathing technique as Avatar's ring glow (Layer 1
            in Avatar.tsx) — a blurred, oversized copy of the rainbow gradient
            sitting behind the ring band so the stripe itself appears to glow,
            not just spin. Independently timed from the rotation below. */}
        <div
          aria-hidden="true"
          className="avatar-ring-breathe pointer-events-none absolute -inset-1.5 rounded-full blur-md"
          style={{
            background:
              'conic-gradient(from 0deg, var(--pact-pink), var(--pact-gold), var(--pact-mint), var(--pact-violet), var(--pact-pink))',
            opacity: 0.8,
          }}
        />
        <div
          aria-hidden="true"
          className="avatar-ring-spin pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, var(--pact-pink), var(--pact-gold), var(--pact-mint), var(--pact-violet), var(--pact-pink))',
          }}
        />
        <div
          className="relative flex items-center gap-1 rounded-full border px-2 py-2 backdrop-blur-xl"
          style={{
            margin: 2,
            background: 'var(--pact-surface)',
            borderColor: 'var(--pact-hairline)',
            boxShadow: '0 12px 32px var(--pact-shadow-violet)',
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
              className="relative flex flex-1 items-center justify-center py-1"
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90">
                {/* Active-tab illumination: soft violet/pink aura behind the
                    icon, breathing at the same cadence as PremiumJoinButton's
                    aura so "you are here" reads consistently across the app. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="pact-bottomnav-active-glow pointer-events-none absolute inset-0 rounded-full blur-md"
                    style={{ background: 'radial-gradient(circle, rgba(139,107,255,0.55), rgba(255,79,135,0.4) 55%, transparent 78%)' }}
                  />
                )}
                <span
                  className="relative z-10 flex h-full w-full items-center justify-center rounded-full transition-colors"
                  style={
                    active
                      ? {
                          background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))',
                          color: 'var(--pact-text)',
                          boxShadow: '0 4px 14px var(--pact-shadow-violet)',
                        }
                      : { color: 'var(--pact-text-faint)' }
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                {/* Dares "live" indicator: a small pulsing dot that now only
                    shows when the viewer actually has a pending dare waiting
                    on their response (getMine() filtered client-side, same
                    as the /dares "For You" tab) — no longer a purely
                    decorative always-on pulse. Corner-positioned so it stays
                    visually distinct from the active-tab glow above even
                    when Dares is the active tab. */}
                {isDares && pendingForYouCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="pact-bottomnav-live-dot pointer-events-none absolute -top-0.5 right-0 z-20 h-2 w-2 rounded-full"
                    style={{ background: 'var(--pact-mint)', boxShadow: '0 0 6px var(--pact-mint)' }}
                  />
                )}
              </span>
            </Link>
          )
          })}
        </div>
      </div>
    </nav>
  )
}
