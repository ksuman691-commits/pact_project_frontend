import { ImageResponse } from 'next/og'
import { MARK_RED, MARK_SWEEP, piePath } from '@/lib/circleMark'
import { fetchPublicProfile, publicName } from '@/lib/publicProfile'
import { loadBoldFont, ogImage, OG_SIZE } from '@/lib/ogImage'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A CirclePact profile'

/** The link preview for a shared profile: their name and real numbers on navy, like the app's page tops. */
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  // Next 15+: route params arrive as a Promise.
  const username = decodeURIComponent((await params).username)
  const p = await fetchPublicProfile(username)
  if (!p) return ogImage('CirclePact', 'Say it. Do it. Let people see.')
  const name = publicName(p)
  const bold = await loadBoldFont()
  const stats: [string, string][] = [
    [p.cp_score.score != null ? String(Math.round(p.cp_score.score)) : '–', 'CP Score'],
    [String(p.pacts_kept), p.pacts_kept === 1 ? 'pact kept' : 'pacts kept'],
    [String(p.streak), 'day streak'],
  ]
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1F3A93', padding: '64px 72px', fontFamily: bold ? 'Inter Tight' : 'sans-serif', color: '#FFFFFF', position: 'relative' }}>
        <svg width="560" height="560" viewBox="0 0 100 100" style={{ position: 'absolute', right: -150, top: -170 }}>
          <path d={piePath(50, 50, 49, MARK_SWEEP)} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="47" fill="#FFFFFF" stroke="#17181D" strokeWidth="5" />
            <path d={piePath(50, 50, 38, MARK_SWEEP)} fill={MARK_RED} />
          </svg>
          <div style={{ marginLeft: 18, fontSize: 34, fontWeight: 800, display: 'flex' }}>CirclePact</div>
        </div>
        <div style={{ marginTop: 56, fontSize: 30, color: '#D4DBFA', display: 'flex' }}>@{p.username}</div>
        <div style={{ marginTop: 6, fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1, display: 'flex' }}>{name}</div>
        <div style={{ display: 'flex', marginTop: 'auto' }}>
          {stats.map(([value, label], i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', marginLeft: i ? 22 : 0, width: 300, padding: '22px 28px', borderRadius: 28, background: '#2A4AAC', border: '3px solid rgba(255,255,255,0.28)' }}>
              <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: i === 0 ? '#FFD23F' : '#FFFFFF', display: 'flex' }}>{value}</div>
              <div style={{ fontSize: 28, color: '#D4DBFA', marginTop: 10, display: 'flex' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: bold ? [{ name: 'Inter Tight', data: bold, weight: 800, style: 'normal' }] : undefined },
  )
}
