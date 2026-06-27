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
      <PremiumCard glass className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">Total</span>
        </div>
        <p className="text-2xl font-black text-blue-900">${balance.toFixed(2)}</p>
      </PremiumCard>

      {/* Available */}
      <PremiumCard glass className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 border-emerald-200">
        <div className="flex items-start justify-between mb-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">Available</span>
        </div>
        <p className="text-2xl font-black text-emerald-900">${available.toFixed(2)}</p>
      </PremiumCard>

      {/* Locked */}
      <PremiumCard glass className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 border-orange-200">
        <div className="flex items-start justify-between mb-2">
          <Lock className="w-5 h-5 text-orange-600" />
          <span className="text-xs font-bold text-orange-700">Locked</span>
        </div>
        <p className="text-2xl font-black text-orange-900">${locked.toFixed(2)}</p>
      </PremiumCard>

      {/* Earned */}
      <PremiumCard glass className="bg-gradient-to-br from-amber-50/80 to-yellow-100/80 border-amber-200">
        <div className="flex items-start justify-between mb-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Won</span>
        </div>
        <p className="text-2xl font-black text-amber-900">${earned.toFixed(2)}</p>
      </PremiumCard>
    </div>
  );
}
