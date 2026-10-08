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
    </div>
  );
}
