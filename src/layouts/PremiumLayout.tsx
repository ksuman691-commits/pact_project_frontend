'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import PactWizardModal from '@/components/PactWizardModal';

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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading CirclePact...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col">
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        {showNav && <BottomNav onCreatePactClick={() => setPactModalOpen(true)} />}
      </div>
      <PactWizardModal isOpen={pactModalOpen} onClose={() => setPactModalOpen(false)} />
    </div>
  );
}
