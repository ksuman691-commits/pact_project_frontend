import Image from 'next/image'

interface SeatProps {
  name?: string | null
  avatarUrl?: string | null
  size?: number
  /** true = sent proof this week (blue + tick). false/undefined = plain seat. */
  lit?: boolean
  className?: string
}

function initials(name?: string | null) {
  const safe = (name || 'U').trim()
  if (!safe) return 'U'
  return safe
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/** Tick badge shared by every avatar: bottom-right corner, 2px cream ring. Parent must be `relative`. */
export function TickBadge({ size }: { size: number }) {
  const offset = -Math.round(size * 0.25)
  return (
    <span
      aria-hidden="true"
      className="absolute flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        right: offset,
        bottom: offset,
        background: 'var(--navy)',
        boxShadow: '0 0 0 2px #F4EFE4',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none">
        <path d="M2 5.2 L4.1 7.3 L8 2.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function Seat({ name, avatarUrl, size = 40, lit = false, className = '' }: SeatProps) {
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full"
        style={{
          background: lit ? 'var(--navy)' : 'var(--card)',
          border: lit ? '2px solid var(--paper)' : '1.5px solid var(--seat-border)',
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name || ''} fill sizes={`${size}px`} className="object-cover" />
        ) : (
          <span
            className="font-semibold"
            style={{ fontSize: Math.max(9, size * 0.34), color: lit ? 'var(--card)' : 'var(--muted)' }}
          >
            {initials(name)}
          </span>
        )}
      </div>
      {lit && <TickBadge size={Math.max(12, Math.round(size * 0.42))} />}
    </div>
  )
}
