import type { CSSProperties } from 'react';

type LogoMarkProps = {
  size?: number;
  withWordmark?: boolean;
  wordmarkPlacement?: 'right' | 'below';
  className?: string;
  style?: CSSProperties;
};

export default function LogoMark({
  size = 40,
  withWordmark = false,
  wordmarkPlacement = 'right',
  className = '',
  style,
}: LogoMarkProps) {
  const isBelow = withWordmark && wordmarkPlacement === 'below';

  return (
    <span
      className={`inline-flex items-center ${isBelow ? 'flex-col gap-2' : 'gap-2'} ${className}`}
      style={style}
    >
      <svg
        aria-label="pact"
        role="img"
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
      >
        <path
          d="M80 80 L137.34 39.84 A70 70 0 1 1 92.16 11.06 Z"
          fill="#E5373B"
        />
      </svg>
      {withWordmark && (
        <span className="font-semibold lowercase tracking-[-0.04em]" style={{ color: 'currentColor', fontSize: Math.max(18, size * 0.58) }}>
          pact
        </span>
      )}
    </span>
  );
}
