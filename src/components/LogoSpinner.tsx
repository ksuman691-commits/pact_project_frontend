'use client';

import { useMemo, type CSSProperties } from 'react';

type LogoSpinnerProps = {
  /** Pixel size of the square icon. */
  size?: number;
  /**
   * 0-1 pull/loading progress. When provided, the mark's notch shrinks as
   * progress approaches 1 (a "closing wedge" that visually mirrors how
   * close the gesture is to completion). Omit for an indeterminate,
   * continuously spinning state (the default loading look).
   */
  progress?: number;
  /** Fill color for the mark. Defaults to the CirclePact brand red. */
  color?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

const CENTER = 80;
const RADIUS = 70;
// Leading edge angle and gap size of the notch on the static LogoMark,
// derived from its fixed path (`M80 80 L137.34 39.84 A70 70 0 1 1 92.16 11.06 Z`).
const BASE_ANGLE_DEG = -35;
const BASE_GAP_DEG = 45;

function pointOnCircle(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

/**
 * Animated version of the CirclePact LogoMark used as the app's default
 * loading indicator. LogoMark itself is a solid disc with one wedge cut
 * out of it, so it doubles as a spinner shape with no extra assets:
 *
 * - Indeterminate (no `progress`): the whole mark spins continuously,
 *   the notch sweeping around like a clock hand.
 * - Determinate (`progress` 0-1): the notch shrinks as progress
 *   increases, closing into a full disc right as the threshold is hit.
 */
export default function LogoSpinner({
  size = 28,
  progress,
  color = '#E5373B',
  className = '',
  style,
  'aria-label': ariaLabel = 'loading',
}: LogoSpinnerProps) {
  const isDeterminate = typeof progress === 'number';
  const clamped = isDeterminate ? Math.min(Math.max(progress as number, 0), 1) : 0;

  const path = useMemo(() => {
    if (isDeterminate && clamped >= 0.98) return null;
    const gap = isDeterminate ? BASE_GAP_DEG * (1 - clamped) : BASE_GAP_DEG;
    const p1 = pointOnCircle(BASE_ANGLE_DEG);
    const p2 = pointOnCircle(BASE_ANGLE_DEG - gap);
    return `M${CENTER} ${CENTER} L${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${RADIUS} ${RADIUS} 0 1 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
  }, [isDeterminate, clamped]);

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        className={!isDeterminate ? 'logo-spinner-spin' : ''}
      >
        {path ? <path d={path} fill={color} /> : <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={color} />}
      </svg>
    </span>
  );
}
