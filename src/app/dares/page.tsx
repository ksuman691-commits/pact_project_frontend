'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import { useAuthStore } from '@/store/auth';
import api from '@/services/api';

interface DareListItem {
  id: string;
  title: string;
  description: string;
  status: string;
  audience: string;
  respond_by: string;
}

export default function DaresPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dares', 'mine'],
    queryFn: async () => {
      const response = await api.get('/api/dares/mine', { params: { skip: 0, limit: 20 } });
      return response?.data ?? { data: [], pagination: { total: 0 } };
    },
    enabled: isInitialized && !!user,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const dares: DareListItem[] = useMemo(() => data?.data ?? [], [data]);

  React.useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/auth/login');
    }
  }, [isInitialized, router, user]);

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-slate-50 max-w-md mx-auto px-4 py-6 pb-24">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Dares</h1>
          <p className="text-sm text-slate-600">Short challenge prompts you can send to a person, a circle, or the public.</p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading your dares…</div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            We couldn’t load your dares right now. Please try again in a moment.
          </div>
        ) : dares.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No dares yet. Create one from the backend API or add a dedicated creator UI later.
          </div>
        ) : (
          <div className="space-y-3">
            {dares.map((dare: DareListItem) => (
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
