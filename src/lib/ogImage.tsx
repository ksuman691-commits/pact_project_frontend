import { ImageResponse } from 'next/og'
import { MARK_DARK, MARK_ON_DISC, MARK_RED, MARK_SWEEP, piePath } from '@/lib/circleMark'

export const OG_SIZE = { width: 1200, height: 630 }

/**
 * Inter Tight ExtraBold for preview images (the built-in font has no bold, so
 * numbers come out thin). Fetched once per server instance; null if Google Fonts
 * can't be reached, and the image falls back to the built-in font.
 */
let boldFont: Promise<ArrayBuffer | null> | null = null
export function loadBoldFont(): Promise<ArrayBuffer | null> {
  if (!boldFont) {
    boldFont = (async () => {
      try {
        const css = await (await fetch('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800', { signal: AbortSignal.timeout(4000) })).text()
        const url = css.match(/src: url\((https:[^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1]
        if (!url) return null
        return await (await fetch(url, { signal: AbortSignal.timeout(4000) })).arrayBuffer()
      } catch {
        boldFont = null
        return null
      }
    })()
  }
  return boldFont
}

/** The preview card WhatsApp, iMessage and others show for a shared link: brand paper, the ring, one line. */
export function ogImage(kicker: string, headline: string) {
  const dots = Array.from({ length: 8 })
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#F4EFE4', padding: '0 80px', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'relative', width: 360, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: 9999, border: '6px solid #DCD3C1', display: 'flex' }} />
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: 9999, borderTop: '6px solid #1F3A93', borderRight: '6px solid #1F3A93', transform: 'rotate(20deg)', display: 'flex' }} />
          {dots.map((_, i) => {
            const a = (i / dots.length) * Math.PI * 2
            return (
              <div
                key={i}
                style={{ position: 'absolute', left: 180 + 150 * Math.cos(a) - 22, top: 180 + 150 * Math.sin(a) - 22, width: 44, height: 44, borderRadius: 9999, background: i < 5 ? '#1F3A93' : '#FBF8F1', border: '4px solid #FFFFFF', display: 'flex' }}
              />
            )
          })}
          <svg width="140" height="140" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" fill={MARK_DARK} />
            <path d={piePath(50, 50, 50 * MARK_ON_DISC, MARK_SWEEP)} fill={MARK_RED} />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 60, color: '#17181D' }}>
          <div style={{ fontSize: 30, color: '#1F3A93', letterSpacing: 4, textTransform: 'uppercase', display: 'flex' }}>{kicker}</div>
          <div style={{ fontSize: 66, lineHeight: 1.1, marginTop: 18, maxWidth: 640, display: 'flex' }}>{headline}</div>
          <div style={{ fontSize: 30, color: '#5A5C63', marginTop: 28, display: 'flex' }}>CirclePact</div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
