import React from 'react';
import { Flame } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface StreakDisplayProps {
  streak: number;
  todayComplete: boolean;
  onUploadProof?: () => void;
}

export default function StreakDisplay({ streak, todayComplete, onUploadProof }: StreakDisplayProps) {
  return (
    <PremiumCard glass>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">Today's Streak</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900">{streak}</p>
            <p className="text-lg text-slate-600">days</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
            todayComplete
              ? 'bg-gradient-to-br from-emerald-100 to-emerald-200'
              : 'bg-gradient-to-br from-slate-100 to-slate-200'
          }`}>
            <Flame className={`w-8 h-8 ${
              todayComplete ? 'text-emerald-600' : 'text-slate-400'
            }`} />
          </div>

          {!todayComplete && (
            <button
              onClick={onUploadProof}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-all"
            >
              Upload today
            </button>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}
