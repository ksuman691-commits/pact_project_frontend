import type { CSSProperties } from 'react';

type LogoMarkProps = {
  /** Font size of the wordmark in px. */
  size?: number;
  /** "ink" for light backgrounds, "cream" for the ink login cover. */
  tone?: 'ink' | 'cream';
  className?: string;
  style?: CSSProperties;
};

/**
 * The CirclePact logo is a wordmark only — Inter Tight 700, tight tracking,
 * no icon beside it.
 */
export default function LogoMark({ size = 20, tone = 'ink', className = '', style }: LogoMarkProps) {
  return (
    <span
      role="img"
      aria-label="CirclePact"
      className={`inline-block font-bold leading-none ${className}`}
      style={{
        fontSize: size,
        letterSpacing: '-0.045em',
        color: tone === 'cream' ? '#F4EFE4' : 'var(--ink)',
        ...style,
      }}
    >
      CirclePact
    </span>
  );
}
