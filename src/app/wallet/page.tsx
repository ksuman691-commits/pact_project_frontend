'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';

export default function WalletPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/feed');
  }, [router]);

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-[var(--paper)] max-w-md mx-auto px-4 py-8">
        <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] p-6 text-center shadow-[0_4px_12px_rgba(23,24,29,0.08)]">
          <h1 className="text-xl font-semibold text-[var(--ink)]">Wallet is unavailable</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">This experience is now centered on commitments and progress rather than money.</p>
        </div>
      </div>
    </>
  );
}
