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
      <div className="min-h-screen bg-slate-50 max-w-md mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Wallet is unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">This experience is now centered on commitments and progress rather than money.</p>
        </div>
      </div>
    </>
  );
}
