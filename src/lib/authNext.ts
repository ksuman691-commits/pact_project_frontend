/**
 * Where to go after signing in. Shared links (a circle, a pact) send
 * signed-out people to /auth/login?next=<path>, so they come back to what
 * they opened instead of the home screen.
 */

/**
 * Only paths inside this site; anything else falls back to `fallback`.
 * Browsers drop tabs and newlines from addresses and treat \\ like /, so "/\t/evil.com"
 * or "/\\evil.com" would leave the site: any such character is refused, and the result
 * must still be on this origin once the browser has parsed it.
 */
export function safeNext(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  if (/[\\\u0000-\u001f\u007f\s]/.test(value)) return fallback
  if (value.startsWith('/auth/')) return fallback
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(value, window.location.origin)
      if (url.origin !== window.location.origin) return fallback
      // Checked again after the browser tidies the path ("/./auth/login" is /auth/login).
      if (url.pathname.startsWith('/auth/')) return fallback
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return fallback
    }
  }
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
