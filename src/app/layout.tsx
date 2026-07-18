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
  themeColor: '#16a34a',
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
      <body className="bg-slate-50 text-slate-950 antialiased min-h-screen flex flex-col md:flex-row">
        <QueryProvider>
          <AuthInitializer />
          <NotificationRealtimeBridge />
          
          {/* Desktop Sidebar Navigation - Hidden on mobile */}
          <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-screen md:w-60 md:flex-col md:bg-white md:border-r md:border-slate-200 md:z-fixed">
            {/* Sidebar content will be populated via BottomNav component reuse */}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 md:ml-60 w-full md:w-auto">
            <div className="bg-slate-50 min-h-screen">
              {children}
            </div>
          </main>

          {/* Bottom Navigation - Hidden on desktop */}
          <BottomNav />
          
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#020617',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              },
              success: {
                style: {
                  background: '#16a34a',
                  color: '#ffffff',
                },
              },
              error: {
                style: {
                  background: '#dc2626',
                  color: '#ffffff',
                },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
