import React from 'react';
import { Pact } from '@/types';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PactHeroProps {
  pact: Pact;
  daysCompleted?: number;
  daysRemaining?: number;
}

export default function PactHero({
  pact,
  daysCompleted = 12,
  daysRemaining = 18,
}: PactHeroProps) {
  const router = useRouter();
  const totalDays = daysCompleted + daysRemaining;
  const progressPercent = (daysCompleted / totalDays) * 100;

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-12 pb-8 px-4 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#EDE9FE]0" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-blue-500" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black mb-4 leading-tight">{pact.title}</h1>

        {/* Timeline */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-[28px] p-3 border border-white/20">
            <p className="text-xs font-medium text-white/70">Days Completed</p>
            <p className="text-2xl font-bold text-emerald-400">{daysCompleted}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-[28px] p-3 border border-white/20">
            <p className="text-xs font-medium text-white/70">Days Remaining</p>
            <p className="text-2xl font-bold text-orange-400">{daysRemaining}</p>
          </div>

        </div>

        {/* Progress Ring */}
        <div className="text-center mb-6">
          <p className="text-xs font-medium text-white/70 mb-3">Overall Progress</p>
          <div className="w-24 h-24 mx-auto relative mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${progressPercent * 2.83} 282.6`}
                className="text-emerald-400 transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-black">{Math.round(progressPercent)}%</p>
                <p className="text-xs text-white/70">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
