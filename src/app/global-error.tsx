'use client';

import { useEffect } from 'react';
import '@/styles/globals.css';

/**
 * Last-resort fallback for errors thrown by the root layout itself (e.g. a
 * crash in AuthInitializer or QueryProvider, before BottomNav/Toaster even
 * mount). Per Next.js, this replaces the ENTIRE document — it must render
 * its own <html>/<body> and cannot assume anything from layout.tsx rendered.
 * Deliberately plain inline styles only (no next/image, no Google Fonts,
 * no lucide-react) since the failure could be anywhere in the render tree
 * that those normally depend on — this file has to be as close to
 * bulletproof as possible. Still pulls in globals.css directly so the
 * --pact-* color tokens and .pact-flow/.pact-card/.pact-btn-glow classes
 * are available, since that's just a static stylesheet import.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[v0] Global (root layout) error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="pact-flow flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
          <p className="pact-mono text-sm font-semibold tracking-widest" style={{ color: 'var(--pact-text-faint)' }}>
            CIRCLEPACT
          </p>
          <h1 className="mt-4 text-3xl font-black" style={{ color: 'var(--pact-text)' }}>
            Something went seriously wrong
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--pact-text-dim)' }}>
            The app hit an error it couldn&apos;t recover from. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            className="pact-btn-glow mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
