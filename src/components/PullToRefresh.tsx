'use client';

import { useEffect, useRef, useState } from 'react';
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
// How far a finger moves before we decide whether this is a pull (down) or something else.
const CAPTURE_DRAG_THRESHOLD_PX = 10;

/**
 * Pull down at the top of the page to refresh.
 *
 * Built on touch events, the only reliable way on phones. It never changes
 * touch-action and only cancels the browser's own scroll once a downward pull
 * from the very top is confirmed. Sideways swipes (photo galleries), taps and
 * normal scrolling are left alone. The old version set touch-action: none on
 * pointerdown, which phones apply too late to pull but early enough to block
 * sideways swipes near the top.
 */
export default function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stateRef = useRef({ disabled, isRefreshing, onRefresh, distance: 0 });
  stateRef.current.disabled = disabled;
  stateRef.current.isRefreshing = isRefreshing;
  stateRef.current.onRefresh = onRefresh;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulling = false;

    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    const onStart = (event: TouchEvent) => {
      const s = stateRef.current;
      tracking = !s.disabled && !s.isRefreshing && event.touches.length === 1 && atTop();
      pulling = false;
      if (!tracking) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      if (!pulling) {
        // Decide once: a clear downward drag from the top is a pull; anything else is not ours.
        if (Math.abs(dy) < CAPTURE_DRAG_THRESHOLD_PX && Math.abs(dx) < CAPTURE_DRAG_THRESHOLD_PX) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || !atTop()) {
          tracking = false;
          return;
        }
        pulling = true;
        setIsPulling(true);
      }
      if (event.cancelable) event.preventDefault();
      const distance = Math.min(Math.max(0, dy - CAPTURE_DRAG_THRESHOLD_PX) * RESISTANCE, MAX_PULL);
      stateRef.current.distance = distance;
      setPullDistance(distance);
    };

    const onEnd = async () => {
      const wasPulling = pulling;
      tracking = false;
      pulling = false;
      if (!wasPulling) return;
      setIsPulling(false);
      if (stateRef.current.distance >= THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          await stateRef.current.onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          stateRef.current.distance = 0;
        }
      } else {
        setPullDistance(0);
        stateRef.current.distance = 0;
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    // Not passive: it has to be able to stop the page bouncing while you pull.
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const displayDistance = isRefreshing ? THRESHOLD : pullDistance;
  const progress = Math.min(displayDistance / THRESHOLD, 1);

  return (
    <div
      ref={wrapperRef}
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
