import type { Metadata } from 'next'
import { fetchPublicProfile, publicName, publicSummary } from '@/lib/publicProfile'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  // Next 15+: route params arrive as a Promise.
  const username = decodeURIComponent((await params).username)
  const profile = await fetchPublicProfile(username)
  const title = profile ? `${publicName(profile)} on CirclePact` : 'CirclePact'
  const description = profile ? publicSummary(profile) : 'Say it. Do it. Let people see.'
  return {
    title,
    description,
    // Shared on purpose, not for search engines: people's pages stay out of search results.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'profile', siteName: 'CirclePact' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
