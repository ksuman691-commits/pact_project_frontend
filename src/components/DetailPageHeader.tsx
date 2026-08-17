'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';

interface DetailPageHeaderProps {
  title: string;
  /** Where the back chevron goes. Falls back to router.back() when omitted. */
  backHref?: string;
  /** Constrains the header's inner row to match the page's content width. */
  maxWidthClassName?: string;
  /** Hide the Feed/Home shortcut on the right (shown by default). */
  showHomeLink?: boolean;
}

/**
 * Single-row sticky header shared by all detail pages (Circle, Dare, Pact).
 * Kept intentionally compact — one ~56px row with back chevron + title on
 * the left and an optional Home shortcut on the right — so it doesn't eat
 * vertical space that could go to actual content, and so every detail page
 * gets the exact same back-button placement and height.
 */
export default function DetailPageHeader({
  title,
  backHref,
  maxWidthClassName = 'max-w-2xl',
  showHomeLink = true,
}: DetailPageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="sticky top-0 z-40 border-b border-[var(--pact-hairline)]"
      style={{ background: 'var(--pact-bg)' }}
    >
      <div className={`mx-auto flex items-center gap-2 px-4 py-3 ${maxWidthClassName}`}>
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex-shrink-0 rounded-full p-2 transition hover:bg-[var(--pact-surface)]"
          >
            <ChevronLeft className="h-5 w-5 text-[var(--pact-text)]" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex-shrink-0 rounded-full p-2 transition hover:bg-[var(--pact-surface)]"
          >
            <ChevronLeft className="h-5 w-5 text-[var(--pact-text)]" />
          </button>
        )}

        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-[var(--pact-text)]">{title}</h1>

        {showHomeLink && (
          <Link
            href="/feed"
            aria-label="Go to feed"
            className="flex-shrink-0 rounded-full p-2 transition hover:bg-[var(--pact-surface)]"
          >
            <Home className="h-5 w-5 text-[var(--pact-text-faint)]" />
          </Link>
        )}
      </div>
    </div>
  );
}
