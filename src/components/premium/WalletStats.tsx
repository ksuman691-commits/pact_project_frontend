import React from 'react';
import { DollarSign, TrendingUp, Lock, Zap } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface WalletStatsProps {
  balance: number;
  locked: number;
  earned: number;
  pending: number;
}

export default function WalletStats({ balance, locked, earned, pending }: WalletStatsProps) {
  const available = balance - locked;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Total Balance */}
      <PremiumCard glass className="bg-white border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <DollarSign className="w-5 h-5 text-[var(--navy)]" />
          <span className="text-xs font-bold text-[var(--navy)]">Total</span>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">${balance.toFixed(2)}</p>
      </PremiumCard>

      {/* Available */}
      <PremiumCard glass className="bg-white border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <Zap className="w-5 h-5 text-[#1877F2]" />
          <span className="text-xs font-bold text-[var(--navy)]">Available</span>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">${available.toFixed(2)}</p>
      </PremiumCard>

      {/* Locked */}
      <PremiumCard glass className="bg-white border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <Lock className="w-5 h-5 text-[var(--warn-text)]" />
          <span className="text-xs font-bold text-[var(--warn-text)]">Locked</span>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">${locked.toFixed(2)}</p>
      </PremiumCard>

      {/* Earned */}
      <PremiumCard glass className="bg-white border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <TrendingUp className="w-5 h-5 text-[var(--warn-text)]" />
          <span className="text-xs font-bold text-[var(--warn-text)]">Won</span>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">${earned.toFixed(2)}</p>
      </PremiumCard>
    </div>
  );
}
