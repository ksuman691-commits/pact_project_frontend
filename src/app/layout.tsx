import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Figtree, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AuthInitializer from '@/components/AuthInitializer';
import AgeVerificationGate from '@/components/AgeVerificationGate';
import NotificationRealtimeBridge from '@/components/NotificationRealtimeBridge';
import InAppNavigationTracker from '@/components/InAppNavigationTracker';
import QueryProvider from '@/providers/QueryProvider';
import BottomNav from '@/components/BottomNav';

// "Classic" redesign type system — site-wide, not scoped to a single flow.
// Kept under the pre-existing --font-pact-* variable names so every
// .pact-flow surface (create-pact/create-circle wizards) inherits these
// fonts automatically without needing per-component edits.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-pact-display',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-pact-mono',
});
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-pact-body',
});

export const metadata: Metadata = {
  title: 'CirclePact - Accountability, together',
  description: 'Join circles, make pacts, track goals, and build streaks with followers who keep you accountable.',
  // Renders <link rel="manifest" href="/manifest.json"> in <head> — this is
  // the Next.js Metadata API's idiomatic way to add it (same mechanism as
  // title/description above), rather than hand-writing the tag. Purely
  // additive: prepares the site for an Android TWA wrapper and has no
  // effect on existing behavior in a normal browser tab.
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#F4EFE4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-paper">
      <body
        className={`${fraunces.variable} ${ibmPlexMono.variable} ${figtree.variable} font-sans bg-paper text-ink antialiased`}
      >
        <QueryProvider>
          <InAppNavigationTracker />
          <AuthInitializer />
          <AgeVerificationGate />
          <NotificationRealtimeBridge />
          {children}
          <BottomNav />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--ink)',
                color: 'var(--card)',
                border: '1px solid var(--ink)',
                borderRadius: '6px',
                fontFamily: 'var(--font-pact-body), sans-serif',
                fontSize: '14px',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
