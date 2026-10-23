'use client'

const INK = '#17181D'
const MUTED = '#5A5C63'
const LINE = '#DCD3C1'

/**
 * The empty state on profile tabs. Pact cards themselves are FeedPactCard
 * everywhere (feed, Pacts tab, profiles, circle pages), so they all look and
 * behave the same.
 */
export function ProfileEmpty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] px-5 py-8 text-center" style={{ background: '#FBF8F1', border: `1px solid ${LINE}` }}>
      <div className="text-[15.5px] font-extrabold" style={{ color: INK }}>{title}</div>
      {text && <div className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-snug" style={{ color: MUTED }}>{text}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
