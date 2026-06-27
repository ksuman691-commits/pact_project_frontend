import React from 'react';
import { Pact } from '@/types';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumCard from './PremiumCard';

interface PactCardProps {
  pact: Pact;
  confidence?: number;
  supporters?: number;
  doubters?: number;
  proofToday?: boolean;
}

export default function PactCard({
  pact,
  confidence = 75,
  supporters = 342,
  doubters = 28,
  proofToday = false,
}: PactCardProps) {
  const router = useRouter();
  const daysRemaining = Math.max(0, Math.floor(
    (new Date(pact.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  const progressPercent = 65; // TODO: Calculate from real data

  return (
    <PremiumCard
      clickable
      onClick={() => router.push(`/pacts/${pact.id}`)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
              {pact.title}
            </h3>
            <p className="text-xs text-slate-600">{pact.description}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            pact.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {pact.status}
          </div>
        </div>

        {/* Money Section - Very Prominent */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200">
          <p className="text-xs font-medium text-amber-700 mb-1">Money at Stake</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-900">${pact.stake_amount}</p>
            <p className="text-xs text-amber-700">USD</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Confidence */}
          <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
            <p className="text-xs font-medium text-blue-700 mb-0.5">Confidence</p>
            <p className="text-lg font-bold text-blue-900">{confidence}%</p>
          </div>

          {/* Time Remaining */}
          <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-orange-700" />
              <p className="text-xs font-medium text-orange-700">Days</p>
            </div>
            <p className="text-lg font-bold text-orange-900">{daysRemaining}</p>
          </div>

          {/* Participants */}
          <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Users className="w-3 h-3 text-purple-700" />
              <p className="text-xs font-medium text-purple-700">People</p>
            </div>
            <p className="text-lg font-bold text-purple-900">4</p>
          </div>
        </div>

        {/* Support / Doubt */}
        <div className="flex gap-2">
          <div className="flex-1 bg-emerald-50 rounded-lg p-2 border border-emerald-100 text-center">
            <p className="text-xs text-emerald-700 font-medium">Supporters</p>
            <p className="text-sm font-bold text-emerald-900">{supporters}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg p-2 border border-red-100 text-center">
            <p className="text-xs text-red-700 font-medium">Doubters</p>
            <p className="text-sm font-bold text-red-900">{doubters}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Progress</p>
            <p className="text-xs font-bold text-slate-900">{progressPercent}%</p>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <button className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all">
          {proofToday ? 'View Proof' : 'Upload Proof'}
        </button>
      </div>
    </PremiumCard>
  );
}
