/**
 * Where to go after signing in. Shared links (a circle, a pact) send
 * signed-out people to /auth/login?next=<path>, so they come back to what
 * they opened instead of the home screen.
 */

/** Only paths inside this site; anything else falls back to `fallback`. */
export function safeNext(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.startsWith('/auth/')) return fallback
  return value
}

/** Reads ?next= from the current address. */
export function readNext(fallback = '/'): string {
  if (typeof window === 'undefined') return fallback
  return safeNext(new URLSearchParams(window.location.search).get('next'), fallback)
}

/** The sign-in address that returns to the current page afterwards. */
export function loginHrefForHere(): string {
  if (typeof window === 'undefined') return '/auth/login'
  const here = `${window.location.pathname}${window.location.search}`
  return here === '/' || here.startsWith('/auth/') ? '/auth/login' : `/auth/login?next=${encodeURIComponent(here)}`
}
