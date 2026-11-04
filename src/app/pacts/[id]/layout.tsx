import type { Metadata } from 'next'

// Shown when a pact link is shared. No pact details: private and paid pacts stay private.
export const metadata: Metadata = {
  title: 'Keep me honest · CirclePact',
  description: "I made a pact on CirclePact. Watch me show up, one photo a day, and nudge me if I don't.",
  openGraph: {
    title: 'Keep me honest',
    description: "I made a pact on CirclePact. Watch me show up, one photo a day, and nudge me if I don't.",
    type: 'website',
    siteName: 'CirclePact',
  },
}

export default function PactLayout({ children }: { children: React.ReactNode }) {
  return children
}
