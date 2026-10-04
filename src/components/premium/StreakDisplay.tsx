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
          <p className="text-sm font-medium text-[#6B7280] mb-1">Today Streak</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-[#14121F]">{streak}</p>
            <p className="text-lg text-[#6B7280]">days</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
            todayComplete
              ? 'bg-gradient-to-br  '
              : 'bg-gradient-to-br  '
          }`}>
            <Flame className={`w-8 h-8 ${
              todayComplete ? 'text-[#A78BFA]' : 'text-[var(--muted)]'
            }`} />
          </div>

          {!todayComplete && (
            <button
              onClick={onUploadProof}
              className="text-xs font-semibold text-[#A78BFA] hover:text-[var(--navy)] px-2 py-1 rounded-full bg-[#EDE9FE] hover:bg-[var(--card)] transition-all"
            >
              Upload today
            </button>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}
