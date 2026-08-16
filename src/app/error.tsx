'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import LogoMark from '@/components/LogoMark';
import { RotateCw, AlertTriangle } from 'lucide-react';

/**
 * App-wide error boundary. Renders inside the root layout (BottomNav, toast
 * provider, etc. stay mounted) whenever a page or nested layout throws
 * during render — Next.js requires this to be a Client Component. Matches
 * the dark `.pact-flow` theme, same rationale as not-found.tsx.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[v0] Route error boundary caught:', error);
  }, [error]);

  return (
    <div className="pact-flow flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-8 flex justify-center text-[var(--pact-text)]">
        <LogoMark size={48} withWordmark wordmarkPlacement="below" />
      </div>

      <div
        className="pact-card mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{ boxShadow: '0 0 0 1px var(--pact-hairline)' }}
      >
        <AlertTriangle className="h-9 w-9" style={{ color: 'var(--pact-gold)' }} />
      </div>

      <p className="pact-mono mt-6 text-sm font-semibold tracking-widest" style={{ color: 'var(--pact-text-faint)' }}>
        SOMETHING BROKE
      </p>
      <h1 className="mt-2 text-3xl font-black text-[var(--pact-text)]">Well, that&apos;s on us</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--pact-text-dim)]">
        An unexpected error interrupted this page. Your pacts and streaks are safe — try again, or head back to your feed.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <p className="pact-mono mt-4 max-w-md break-words rounded-lg bg-[var(--pact-surface)] px-4 py-2 text-left text-xs text-[var(--pact-text-faint)]">
          {error.message}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="pact-btn-glow inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition"
          style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/feed"
          className="pact-card inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--pact-text)] transition"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
