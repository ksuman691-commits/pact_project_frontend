'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import { useAuthStore } from '@/store/auth';
import api from '@/services/api';

export default function DaresPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [dares, setDares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    api.get('/api/dares/mine').then((response) => {
      setDares(response?.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, [isInitialized, router, user]);

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-slate-50 max-w-md mx-auto px-4 py-6 pb-24">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Dares</h1>
          <p className="text-sm text-slate-600">Short challenge prompts you can send to a person, a circle, or the public.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading your dares…</div>
        ) : dares.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No dares yet. Create one from the backend API or add a dedicated creator UI later.
          </div>
        ) : (
          <div className="space-y-3">
            {dares.map((dare) => (
              <div key={dare.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-slate-900">{dare.title}</h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{dare.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{dare.description}</p>
                <p className="mt-3 text-xs text-slate-500">Audience: {dare.audience} • Respond by {new Date(dare.respond_by).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
