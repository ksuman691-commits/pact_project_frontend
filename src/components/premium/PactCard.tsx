import React from 'react';
import { Pact } from '@/types';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumCard from './PremiumCard';

interface PactCardProps {
  pact: Pact;
  confidence?: number;
  cheers?: number;
  skipped?: number;
  proofToday?: boolean;
}

export default function PactCard({
  pact,
  confidence = 75,
  cheers = 342,
  skipped = 28,
  proofToday = false,
}: PactCardProps) {
  const router = useRouter();
  const deadline = pact.deadline ?? pact.end_date;
  const daysRemaining = Math.max(0, Math.floor(
    (new Date(deadline ?? '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
            <h3 className="font-bold text-[#14121F] text-base leading-tight mb-1">
              {pact.title}
            </h3>
            <p className="text-xs text-[#6B7280]">{pact.description}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            pact.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-[#FAF9FE] text-slate-700'
          }`}>
            {pact.status}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Confidence */}
          <div className="bg-blue-50 rounded-[28px] p-2.5 border border-blue-100">
            <p className="text-xs font-medium text-blue-700 mb-0.5">Confidence</p>
            <p className="text-lg font-bold text-blue-900">{confidence}%</p>
          </div>

          {/* Time Remaining */}
          <div className="bg-orange-50 rounded-[28px] p-2.5 border border-orange-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-orange-700" />
              <p className="text-xs font-medium text-orange-700">Days</p>
            </div>
            <p className="text-lg font-bold text-orange-900">{daysRemaining}</p>
          </div>

          {/* Participants */}
          <div className="bg-purple-50 rounded-[28px] p-2.5 border border-purple-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Users className="w-3 h-3 text-purple-700" />
              <p className="text-xs font-medium text-purple-700">People</p>
            </div>
            <p className="text-lg font-bold text-purple-900">4</p>
          </div>
        </div>

        {/* Cheer / Skip */}
        <div className="flex gap-2">
          <div className="flex-1 bg-[#EDE9FE] rounded-[28px] p-2 border border-emerald-100 text-center">
            <p className="text-xs text-emerald-700 font-medium">Cheers</p>
            <p className="text-sm font-bold text-emerald-900">{cheers}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-[28px] p-2 border border-red-100 text-center">
            <p className="text-xs text-red-700 font-medium">Skipped</p>
            <p className="text-sm font-bold text-red-900">{skipped}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Progress</p>
            <p className="text-xs font-bold text-[#14121F]">{progressPercent}%</p>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <button className="w-full py-2.5 rounded-[28px] bg-[#EDE9FE]0 hover:bg-[#A78BFA] text-white font-semibold text-sm transition-all">
          {proofToday ? 'View Proof' : 'Upload Proof'}
        </button>
      </div>
    </PremiumCard>
  );
}
