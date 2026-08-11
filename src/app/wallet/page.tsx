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
      <div className="min-h-screen bg-[#F4F2FB] max-w-md mx-auto px-4 py-8">
        <div className="rounded-[24px] border border-[rgba(20,18,31,0.06)] bg-white p-6 text-center shadow-[0_4px_12px_rgba(94,84,142,0.08)]">
          <h1 className="text-xl font-semibold text-[#14121F]">Wallet is unavailable</h1>
          <p className="mt-2 text-sm text-[#6B7280]">This experience is now centered on commitments and progress rather than money.</p>
        </div>
      </div>
    </>
  );
}
