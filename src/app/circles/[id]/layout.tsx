import type { Metadata } from 'next'

// Shown when a circle invite link is shared (WhatsApp, iMessage). No circle details: private circles stay private.
export const metadata: Metadata = {
  title: "You're invited to a circle · CirclePact",
  description: 'Join my circle on CirclePact. We post one photo a day for our goals and keep each other honest.',
  openGraph: {
    title: "You're invited to a circle",
    description: 'Join my circle on CirclePact. We post one photo a day for our goals and keep each other honest.',
    type: 'website',
    siteName: 'CirclePact',
  },
}

export default function CircleLayout({ children }: { children: React.ReactNode }) {
  return children
}
