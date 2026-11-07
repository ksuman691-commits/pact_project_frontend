'use client';

import LogoSpinner from '@/components/LogoSpinner';
import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TopNav from '@/components/TopNav';
import CreatePactFlowModal from '@/components/create-pact-flow/CreatePactFlowModal';

interface PremiumLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export default function PremiumLayout({ children, showNav = true }: PremiumLayoutProps) {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const [pactModalOpen, setPactModalOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/auth/login');
    }
  }, [isInitialized, user, router]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--paper)]">
        <div className="text-center">
          <LogoSpinner size={44} className="mx-auto mb-4" />
          <p className="text-[var(--muted)] font-medium">Loading CirclePact...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-md mx-auto min-h-screen bg-[var(--paper)] flex flex-col">
        {showNav && <TopNav onCreatePactClick={() => setPactModalOpen(true)} showCategories={true} />}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CreatePactFlowModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  );
}
