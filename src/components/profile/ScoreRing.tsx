const TRACK = '#E7E1D3'
const NAVY = '#1F3A93'

/** The CP Score ring: a navy arc for the score out of 100, the number in the middle. */
export default function ScoreRing({ score, size = 84, stroke = 10, label = 'of 100' }: { score: number | null; size?: number; stroke?: number; label?: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const value = score == null ? 0 : Math.max(0, Math.min(100, score))
  const big = size >= 140
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
        {score != null && (
          <circle cx="60" cy="60" r={r} fill="none" stroke={NAVY} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 60 60)" />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none tracking-[-0.04em]" style={{ fontSize: big ? 60 : size * 0.33, color: '#17181D' }}>
          {score == null ? '–' : value}
        </span>
        <span className="font-bold" style={{ fontSize: big ? 13 : 10.5, marginTop: big ? 4 : 2, color: '#5A5C63' }}>{label}</span>
      </span>
    </span>
  )
}
