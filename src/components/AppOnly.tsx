'use client';

import { usePathname } from 'next/navigation';

/** App-only pieces (bottom bar, splash, reminders, app sign-in checks) stay out of the console. */
export default function AppOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  if (pathname === '/console' || pathname.startsWith('/console/')) return null;
  return <>{children}</>;
}
