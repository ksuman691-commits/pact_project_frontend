import { NextResponse, type NextRequest } from 'next/server';

/**
 * The console lives on its own address (NEXT_PUBLIC_CONSOLE_HOST, e.g.
 * console.circlepact.com). On that address only the console's pages are
 * served; everywhere else /console isn't there. With the variable unset
 * (local runs, previews) /console works on any address. This only keeps the
 * two apart; every console action is still checked by the server.
 */
const CONSOLE_HOST = process.env.NEXT_PUBLIC_CONSOLE_HOST?.toLowerCase();

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const { pathname } = request.nextUrl;
  const isConsolePath = pathname === '/console' || pathname.startsWith('/console/');

  if (CONSOLE_HOST && host === CONSOLE_HOST) {
    if (pathname === '/') return NextResponse.redirect(new URL('/console', request.url));
    if (pathname.startsWith('/setup/')) return NextResponse.redirect(new URL(`/console${pathname}`, request.url));
    if (!isConsolePath) return NextResponse.redirect(new URL('/console', request.url));
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  if (isConsolePath) {
    if (CONSOLE_HOST) return NextResponse.rewrite(new URL('/not-found-console', request.url), { status: 404 });
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  return NextResponse.next();
}

export const config = {
  // Pages only: never static files, images or Next's own assets.
  matcher: ['/((?!_next/|api/|favicon|icons/|brand/|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|js|css|woff2?)$).*)'],
};
