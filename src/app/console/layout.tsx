import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CirclePact Console',
  description: 'For the CirclePact team.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">{children}</div>;
}
