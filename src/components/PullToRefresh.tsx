'use client';

import { useRef, useState } from 'react';
import LogoSpinner from './LogoSpinner';

interface PullToRefreshProps {
  /** Called on release once the user has pulled past the threshold. Awaited so the spinner keeps spinning until data actually arrives. */
  onRefresh: () => Promise<unknown> | unknown;
  children: React.ReactNode;
  /** Disable the gesture entirely (e.g. while the initial feed skeleton is showing). */
  disabled?: boolean;
}

// How far (in already-resisted px) the user must pull before release triggers a refresh.
const THRESHOLD = 68;
// Hard cap on how far the indicator can travel, however hard/far the finger drags.
const MAX_PULL = 96;
// Rubber-band factor: raw finger travel is scaled down before it reaches the indicator,
// so the pull feels like it has resistance instead of tracking 1:1 with the finger.
const RESISTANCE = 0.5;

/**
 * Custom pull-to-refresh wrapper built on Pointer Events (no external library).
 *
 * Only starts tracking a pull when the page is already scrolled to the very top
 * (window.scrollY <= 0), so it never fights normal scrolling further down the feed.
 * Pointer events bubble up from child cards (e.g. FeedPactCard's own swipe-to-skip/
 * cheer gesture) without interference: that gesture only reacts to horizontal drags
 * and never calls preventDefault, while this component only reacts to a downward
 * drag while already at the top of the page.
 */
export default function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pointerId = useRef<number | null>(null);
  const startY = useRef(0);
  const pullingRef = useRef(false);

  const atTop = () => typeof window !== 'undefined' && window.scrollY <= 0;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    if (!atTop()) return;
    pointerId.current = event.pointerId;
    startY.current = event.clientY;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing || pointerId.current !== event.pointerId) return;

    const dy = event.clientY - startY.current;

    if (dy <= 0 || !atTop()) {
      // Moving back up, or the page has scrolled — release control back to native scroll.
      if (pullingRef.current) {
        pullingRef.current = false;
        setIsPulling(false);
        setPullDistance(0);
      }
      return;
    }

    pullingRef.current = true;
    setIsPulling(true);
    // Suppress the native overscroll/bounce while we're driving our own indicator.
    event.preventDefault();
    setPullDistance(Math.min(dy * RESISTANCE, MAX_PULL));
  };

  const finishPull = async () => {
    pointerId.current = null;
    if (!pullingRef.current) return;
    pullingRef.current = false;
    setIsPulling(false);

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    void finishPull();
  };

  const displayDistance = isRefreshing ? THRESHOLD : pullDistance;
  const progress = Math.min(displayDistance / THRESHOLD, 1);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        aria-hidden="true"
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: displayDistance,
          transition: isPulling ? 'none' : 'height 220ms ease',
        }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5})`,
            transition: isPulling ? 'none' : 'opacity 220ms ease, transform 220ms ease',
          }}
        >
          <LogoSpinner
            size={28}
            progress={isRefreshing ? undefined : progress}
            color="var(--pact-violet)"
            aria-label={isRefreshing ? 'refreshing' : 'pull to refresh'}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
