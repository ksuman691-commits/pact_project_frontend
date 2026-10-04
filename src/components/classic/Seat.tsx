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

export default function Seat({ name, avatarUrl, size = 40, lit = false, className = '' }: SeatProps) {
  const badge = Math.round(size * 0.4)
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
      {lit && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: badge,
            height: badge,
            right: -4,
            bottom: -4,
            background: 'var(--card)',
            border: '1.5px solid var(--navy)',
          }}
        >
          <svg width={badge * 0.57} height={badge * 0.57} viewBox="0 0 10 10" fill="none">
            <path d="M2 5.2 L4.1 7.3 L8 2.8" stroke="var(--navy)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  )
}
