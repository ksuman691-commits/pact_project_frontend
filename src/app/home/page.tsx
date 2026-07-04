'use client';

import React from 'react';
import PremiumLayout from '@/layouts/PremiumLayout';
import WalletDisplay from '@/components/premium/WalletDisplay';
import StreakDisplay from '@/components/premium/StreakDisplay';
import DailyTasksSection from '@/components/premium/DailyTasksSection';
import { useAuthStore } from '@/store/auth';
import { Bell } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <PremiumLayout>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Hey, {user?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">Let's build accountability today</p>
          </div>

          <button className="relative p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
            <Bell className="w-5 h-5 text-slate-700" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* Wallet Section */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Your Wallet
          </h2>
          <WalletDisplay />
        </div>

        {/* Streak Section */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Daily Momentum
          </h2>
          <StreakDisplay
            streak={14}
            todayComplete={false}
            onUploadProof={() => {}}
          />
        </div>

        {/* Daily Tasks */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Today's Commitments
          </h2>
          <DailyTasksSection />
        </div>

        {/* Quick Stats */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Your Progress
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs font-medium text-emerald-700 mb-1">Completed</p>
              <p className="text-2xl font-bold text-emerald-900">24</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-1">Active Pacts</p>
              <p className="text-2xl font-bold text-blue-900">8</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <p className="text-xs font-medium text-amber-700 mb-1">Money at Risk</p>
              <p className="text-2xl font-bold text-amber-900">$240</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <p className="text-xs font-medium text-purple-700 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-purple-900">86%</p>
            </div>
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
