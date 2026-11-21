/** GET /api/public/profiles/{username}: a person's public page, readable signed out. */
export interface PublicProfile {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  joined_at: string | null
  cp_score: { score: number | null; band: string | null; is_new: boolean }
  streak: number
  longest_streak: number
  pacts_kept: number
  pacts_ended: number
  followers: number
  running: { id: number; title: string; day: number; total_days: number | null; days_posted: number }[]
  running_count: number
}

export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com'

/** Server side (link previews): cached for 5 minutes, null when the person doesn't exist. */
export async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/api/public/profiles/${encodeURIComponent(username)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    return (await response.json()) as PublicProfile
  } catch {
    return null
  }
}

/** "Suman K" or the username. */
export const publicName = (p: Pick<PublicProfile, 'full_name' | 'username'>) => (p.full_name || '').trim() || p.username

/** One line of real numbers for previews: "CP Score 82 · 3 pacts kept · 12-day streak". */
export function publicSummary(p: PublicProfile): string {
  const parts = [
    p.cp_score.score != null ? `CP Score ${Math.round(p.cp_score.score)}` : null,
    p.pacts_kept ? `${p.pacts_kept} ${p.pacts_kept === 1 ? 'pact' : 'pacts'} kept` : null,
    p.streak > 1 ? `${p.streak}-day streak` : null,
    p.running_count ? `${p.running_count} running` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Making pacts in public on CirclePact'
}
