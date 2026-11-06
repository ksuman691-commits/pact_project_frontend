'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import LegalText from '@/components/legal/LegalText';
import { TERMS, TERMS_UPDATED } from '@/content/terms';
import { useSmartBack } from '@/hooks/useSmartBack';

export default function TermsPage() {
  const goBack = useSmartBack('/');
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--paper)' }}>
      <header className="sticky top-0 z-30 flex h-14 items-center px-2" style={{ background: 'rgba(244,239,228,0.94)', backdropFilter: 'blur(12px)' }}>
        <button type="button" onClick={goBack} aria-label="Go back" className="flex size-11 items-center justify-center rounded-full text-ink">
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex-1 pr-11 text-center text-[16px] font-bold text-ink">Terms of Service</div>
      </header>
      <article className="mx-auto max-w-2xl px-5 pt-2">
        <h1 className="text-[26px] font-extrabold text-ink">CirclePact Terms of Service</h1>
        <p className="mb-4 mt-1 text-[13px] text-[var(--muted)]">Last updated {TERMS_UPDATED}</p>
        <LegalText source={TERMS} />
      </article>
    </main>
  );
}
