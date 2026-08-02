'use client';

import React from 'react';
import { useTodaysPacts } from '@/hooks/usePacts';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import PremiumCard from './PremiumCard';
import { useRouter } from 'next/navigation';

export default function DailyTasksSection() {
  const { data: todaysPacts = [], isLoading } = useTodaysPacts();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#FAF9FE] rounded-[24px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (todaysPacts.length === 0) {
    return (
      <PremiumCard>
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-2" />
          <p className="text-[#6B7280] font-medium">No pacts due today</p>
          <p className="text-xs text-[#9CA3AF]">Great job staying ahead!</p>
        </div>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-2">
      {todaysPacts.map((pact: any) => (
        <div
          key={pact.id}
          onClick={() => router.push(`/pacts/${pact.id}`)}
          className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-[24px] p-4 cursor-pointer hover:shadow-md transition-all border border-[rgba(20,18,31,0.06)] flex items-center justify-between"
        >
          <div className="flex-1">
            <h4 className="font-semibold text-[#14121F] text-sm mb-1">{pact.title}</h4>
            <div className="flex items-center gap-4 text-xs text-[#6B7280]">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Active today</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Today</span>
              </div>
            </div>
          </div>

          <button
            className="ml-4 px-3 py-1.5 rounded-full bg-[#EDE9FE]0 hover:bg-[#A78BFA] text-white text-xs font-semibold transition-all"
          >
            Upload
          </button>
        </div>
      ))}
    </div>
  );
}
