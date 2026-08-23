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
// Minimum raw downward travel (px) before we treat the pointer as a genuine pull
// gesture rather than a stationary press. Below this, nothing is captured, so a
// plain click/tap on a child button (e.g. header actions) always reaches it —
// setPointerCapture retargets the resulting click to the capturing element, so
// capturing eagerly on every pointerdown silently swallowed clicks on anything
// underneath while the page was scrolled to the top.
const CAPTURE_DRAG_THRESHOLD_PX = 6;

/**
 * Custom pull-to-refresh wrapper built on Pointer Events (no external library).
 *
 * Only starts tracking a pull when the page is already scrolled to the very top
 * (window.scrollY <= 0), so it never fights normal scrolling further down the feed.
 * Pointer events bubble up from child cards (e.g. FeedPactCard's own swipe-to-skip/
 * cheer gesture) without interference: that gesture only reacts to horizontal drags
 * and never calls preventDefault, while this component only reacts to a downward
 * drag while already at the top of the page.
 *
 * Pointer capture is deliberately deferred until a real downward drag is confirmed
 * (see CAPTURE_DRAG_THRESHOLD_PX in handlePointerMove), not taken eagerly on
 * pointerdown. Capturing on every pointerdown retargets the resulting click event
 * to this wrapper, which silently swallowed clicks on any child button/link
 * (e.g. the feed header's Search/Notifications/My Circles/New Pact buttons)
 * whenever the page happened to be scrolled to the top — i.e. on every real
 * attempt to click a non-sticky header, since it's only clickable at scrollY 0.
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
    // Capture is deferred to handlePointerMove, once a real downward drag
    // is confirmed — see CAPTURE_DRAG_THRESHOLD_PX. Capturing here on every
    // pointerdown retargeted the resulting click event to this wrapper for
    // ANY tap underneath it (buttons, links, etc.), not just genuine pulls.
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing || pointerId.current !== event.pointerId) return;

    const dy = event.clientY - startY.current;

    if (dy < CAPTURE_DRAG_THRESHOLD_PX || !atTop()) {
      // Not a confirmed downward pull yet (or the page has scrolled) —
      // release control back to native scroll/click handling.
      if (pullingRef.current) {
        pullingRef.current = false;
        setIsPulling(false);
        setPullDistance(0);
      }
      return;
    }

    if (!pullingRef.current) {
      // First move past the threshold: this is a genuine pull, not a tap.
      // On a real touchscreen the finger drifts more than a simulated/mouse
      // pointer does, so without capture a fast or wide drag can hand
      // subsequent pointermove events to a different element (or none) and
      // silently drop the gesture. Capturing keeps every move/up event for
      // this pointerId routed here regardless of what's underneath it.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture can throw for already-released/invalid pointer ids; the
        // gesture still works without it, just less robustly on real touch.
      }
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
