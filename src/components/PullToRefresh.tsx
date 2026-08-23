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
const CAPTURE_DRAG_THRESHOLD_PX = 2;

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
 *
 * touch-action is set imperatively on the wrapper DOM node (via wrapperRef),
 * NOT through a React state → re-render → paint cycle. A real touchscreen's
 * compositor decides whether to hand a touch sequence to native scrolling
 * based on touch-action's value essentially at touchstart/the first touchmove
 * tick — React state updates are batched and only reach the DOM on the next
 * commit, which on real hardware can easily run behind several native
 * touchmove ticks. That lag was almost certainly why the previous state-driven
 * `style={{ touchAction: isPulling ? 'none' : 'auto' }}` produced *zero*
 * visible response on device: touch-action was still 'auto' in the DOM by the
 * time the compositor had already committed to native scrolling, so it just
 * scrolled (or no-opped at the very top) instead of feeding move events to JS.
 * Mutating wrapperRef.current.style.touchAction directly is synchronous and
 * has no such lag.
 */
export default function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pointerId = useRef<number | null>(null);
  const startY = useRef(0);
  const pullingRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const atTop = () => typeof window !== 'undefined' && window.scrollY <= 0;

  // Imperative, synchronous touch-action toggle — see the class doc comment
  // above for why this can't go through React state without lagging behind
  // the compositor's gesture-recognition decision on real touch hardware.
  const setTouchAction = (value: 'none' | 'auto') => {
    if (wrapperRef.current) wrapperRef.current.style.touchAction = value;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    if (!atTop()) return;
    pointerId.current = event.pointerId;
    startY.current = event.clientY;
    // Claim touch-action:none from the very first touch, synchronously,
    // while we're still at the top and might be about to start a pull. If
    // it turns out not to be a downward pull (see the dy <= 0 branch in
    // handlePointerMove), this is released back to 'auto' immediately so
    // native scroll can still take over for the rest of that same touch.
    setTouchAction('none');
    // Pointer capture is still deferred to handlePointerMove, once a real
    // downward drag is confirmed — see CAPTURE_DRAG_THRESHOLD_PX. Capturing
    // here on every pointerdown retargeted the resulting click event to
    // this wrapper for ANY tap underneath it, not just genuine pulls.
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing || pointerId.current !== event.pointerId) return;

    const dy = event.clientY - startY.current;

    if (dy <= 0 || !atTop()) {
      // Moving up, or the page has scrolled — this was never a downward
      // pull. Hand touch-action back to 'auto' immediately (not just React
      // state) so native scroll can still take over for the rest of this
      // same touch sequence instead of staying locked out until release.
      setTouchAction('auto');
      if (pullingRef.current) {
        pullingRef.current = false;
        setIsPulling(false);
        setPullDistance(0);
      }
      return;
    }

    // preventDefault() only stops the browser's native touch-scroll if it's
    // called before the compositor thread has already committed to handling
    // the gesture as a scroll — which on a real touchscreen can happen as
    // early as the very first touchmove past the platform's tiny built-in
    // slop, well before our own CAPTURE_DRAG_THRESHOLD_PX dead zone below is
    // satisfied. touch-action was already set to 'none' synchronously in
    // handlePointerDown (see setTouchAction above) specifically to win that
    // race — preventDefault() here is the second layer of defense on top of it.
    event.preventDefault();

    if (dy < CAPTURE_DRAG_THRESHOLD_PX) {
      // Still inside the dead zone — not yet confirmed as a genuine pull.
      // Don't capture the pointer or show any visual movement yet, so a
      // plain tap (which never exceeds this) is unaffected.
      return;
    }

    if (!pullingRef.current) {
      // First move past the dead zone: this is a genuine pull, not a tap.
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
    setPullDistance(Math.min(dy * RESISTANCE, MAX_PULL));
  };

  const finishPull = async () => {
    pointerId.current = null;
    // Safety net: always release touch-action back to 'auto' on any
    // pointerup/cancel, even if a move handler somehow missed it.
    setTouchAction('auto');
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
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // Starts at 'auto' (normal scrolling everywhere). handlePointerDown
      // flips this to 'none' imperatively (via wrapperRef, not this style
      // prop/React state) the instant a touch starts while at the top, and
      // hands it back to 'auto' the moment that touch turns out not to be a
      // downward pull. See the class doc comment for why this must be a
      // direct DOM mutation rather than state-driven.
      style={{ touchAction: 'auto' }}
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
