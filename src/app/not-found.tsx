'use client';

import Link from 'next/link';
import LogoMark from '@/components/LogoMark';
import { Compass } from 'lucide-react';

/**
 * App-wide 404. Every real authenticated screen (feed, profile, pacts,
 * circles, dares) renders inside the dark `.pact-flow` theme (see
 * globals.css), so this matches that theme rather than the light
 * marketing/auth theme — a 404 can be reached from any of those routes.
 */
export default function NotFound() {
  return (
    <div className="pact-flow flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-8 flex justify-center text-[var(--pact-text)]">
        <LogoMark size={48} withWordmark wordmarkPlacement="below" />
      </div>

      <div
        className="pact-card mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{ boxShadow: '0 0 0 1px var(--pact-hairline)' }}
      >
        <Compass className="h-9 w-9" style={{ color: 'var(--pact-violet)' }} />
      </div>

      <p className="pact-mono mt-6 text-sm font-semibold tracking-widest" style={{ color: 'var(--pact-text-faint)' }}>
        404
      </p>
      <h1 className="mt-2 text-3xl font-black text-[var(--pact-text)]">This pact doesn&apos;t exist</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--pact-text-dim)]">
        The page you&apos;re looking for was moved, deleted, or never existed. Let&apos;s get you back to your Circle.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/feed"
          className="pact-btn-glow inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition"
          style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
        >
          Back to Feed
        </Link>
        <Link
          href="/profile"
          className="pact-card inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--pact-text)] transition"
        >
          Go to Profile
        </Link>
      </div>
    </div>
  );
}
