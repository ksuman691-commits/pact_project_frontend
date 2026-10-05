'use client';

import type { CSSProperties } from 'react';

type LogoSpinnerProps = {
  /** Pixel size of the square spinner. */
  size?: number;
  /**
   * 0-1 pull/loading progress. When provided the arc grows with progress;
   * omit for an indeterminate, continuously spinning state.
   */
  progress?: number;
  /** Stroke colour. Defaults to the accent blue. */
  color?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Default loading indicator: a plain open arc (no brand icon). Kept under
 * the LogoSpinner name so existing call sites keep working.
 */
export default function LogoSpinner({
  size = 28,
  progress,
  color = 'var(--navy)',
  className = '',
  style,
  'aria-label': ariaLabel = 'loading',
}: LogoSpinnerProps) {
  const isDeterminate = typeof progress === 'number';
  const clamped = isDeterminate ? Math.min(Math.max(progress as number, 0), 1) : 0.28;
  const visible = CIRCUMFERENCE * Math.max(clamped, 0.04);

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={!isDeterminate ? 'logo-spinner-spin' : ''}>
        <circle cx={50} cy={50} r={RADIUS} stroke="var(--hairline)" strokeWidth={9} />
        <circle
          cx={50}
          cy={50}
          r={RADIUS}
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${visible} ${CIRCUMFERENCE}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
    </span>
  );
}
