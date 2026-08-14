import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import AuthInitializer from '@/components/AuthInitializer';
import NotificationRealtimeBridge from '@/components/NotificationRealtimeBridge';
import QueryProvider from '@/providers/QueryProvider';
import BottomNav from '@/components/BottomNav';

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
      <body className="bg-[#F4F2FB] text-[#14121F] antialiased">
        <QueryProvider>
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
