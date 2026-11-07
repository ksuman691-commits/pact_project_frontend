import type { CSSProperties } from 'react';
import CircleMark from '@/components/brand/CircleMark';

type LogoMarkProps = {
  /** Font size of the wordmark in px. */
  size?: number;
  /** "ink" for light backgrounds, "cream" for dark ones. */
  tone?: 'ink' | 'cream';
  /** Show the red mark before the word (default true). */
  mark?: boolean;
  /** Draw the mark in when it appears. */
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * The CirclePact logo: the red mark (a circle with one slice missing) and the
 * wordmark in Inter Tight 700 with tight tracking.
 */
export default function LogoMark({ size = 20, tone = 'ink', mark = true, animate = false, className = '', style }: LogoMarkProps) {
  return (
    <span role="img" aria-label="CirclePact" className={`inline-flex items-center ${className}`} style={{ gap: size * 0.32, ...style }}>
      {mark && <CircleMark size={Math.round(size * 1.05)} animation={animate ? 'draw' : 'none'} />}
      <span
        aria-hidden="true"
        className="font-bold leading-none"
        style={{ fontSize: size, letterSpacing: '-0.045em', color: tone === 'cream' ? '#F4EFE4' : 'var(--ink)' }}
      >
        CirclePact
      </span>
    </span>
  );
}
