'use client';

import type { ReactNode } from 'react';

interface ScrollableRowProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function ScrollableRow({ children, className = '', ariaLabel }: ScrollableRowProps) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <div
        aria-label={ariaLabel}
        className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1"
      >
        {children}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[var(--pact-bg)] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[var(--pact-bg)] to-transparent" />
    </div>
  );
}
