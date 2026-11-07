'use client';

import type { CSSProperties } from 'react';
import { MarkPull, MarkTicker } from '@/components/brand/CircleMark';

type LogoSpinnerProps = {
  /** Pixel size of the square spinner. */
  size?: number;
  /**
   * 0-1 pull progress. When given, the mark's missing slice closes as you pull
   * (pull to refresh); omit it for loading, where the gap ticks round.
   */
  progress?: number;
  /** Kept for old call sites; the mark is always CirclePact red. */
  color?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

/** The app's loading indicator: the CirclePact mark, ticking round like a clock hand. */
export default function LogoSpinner({ size = 28, progress, className = '', style, 'aria-label': ariaLabel = 'Loading' }: LogoSpinnerProps) {
  if (typeof progress === 'number') {
    return (
      <span role="status" aria-label={ariaLabel} className={`inline-flex shrink-0 ${className}`} style={style}>
        <MarkPull progress={progress} size={size} />
      </span>
    );
  }
  return <MarkTicker size={size} label={ariaLabel} className={className} style={style} />;
}
