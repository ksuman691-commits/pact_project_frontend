import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import AuthInitializer from '@/components/AuthInitializer';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'CirclePact - Accountability, together',
  description: 'Join circles, make pacts, track goals, and build streaks with friends who keep you accountable.',
};

export const viewport: Viewport = {
  themeColor: '#059669',
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
    <html lang="en" className="bg-slate-50">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>
          <AuthInitializer />
          {children}
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
