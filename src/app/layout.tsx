import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AuthInitializer from '@/components/AuthInitializer';
import NotificationRealtimeBridge from '@/components/NotificationRealtimeBridge';
import InAppNavigationTracker from '@/components/InAppNavigationTracker';
import QueryProvider from '@/providers/QueryProvider';
import BottomNav from '@/components/BottomNav';

// Scoped to the "Create a Pact" immersive flow only (see .pact-flow in
// globals.css) — the rest of the app keeps its existing light theme fonts.
const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-pact-display',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-pact-mono',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-pact-body',
});

export const metadata: Metadata = {
  title: 'CirclePact - Accountability, together',
  description: 'Join circles, make pacts, track goals, and build streaks with followers who keep you accountable.',
};

export const viewport: Viewport = {
  themeColor: '#A78BFA',
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
    <html lang="en" className="bg-[#F4F2FB]">
      <body
        className={`${bricolageGrotesque.variable} ${ibmPlexMono.variable} ${inter.variable} bg-[#F4F2FB] text-[#14121F] antialiased`}
      >
        <QueryProvider>
          <InAppNavigationTracker />
          <AuthInitializer />
          <NotificationRealtimeBridge />
          {children}
          <BottomNav />
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
