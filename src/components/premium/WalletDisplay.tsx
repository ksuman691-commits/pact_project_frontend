import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { DollarSign, Lock } from 'lucide-react';
import PremiumCard from './PremiumCard';

export default function WalletDisplay() {
  const { data: wallet, isLoading, error } = useWallet();

  if (isLoading) {
    return (
      <PremiumCard glass className="animate-pulse">
        <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-100 rounded-xl" />
      </PremiumCard>
    );
  }

  if (error || !wallet) {
    return null;
  }

  const available = wallet.balance - wallet.escrow_locked;

  return (
    <PremiumCard glass>
      <div className="space-y-4">
        {/* Total Balance */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-slate-900">
            ${wallet.balance.toFixed(2)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-medium text-emerald-700">Available</p>
            </div>
            <p className="text-lg font-bold text-emerald-900">${available.toFixed(2)}</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700">Locked</p>
            </div>
            <p className="text-lg font-bold text-orange-900">${wallet.escrow_locked.toFixed(2)}</p>
          </div>
        </div>

        {/* Rewards */}
        {wallet.rewards_earned > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200">
            <p className="text-xs font-medium text-amber-700 mb-1">Total Rewards Won</p>
            <p className="text-xl font-bold text-amber-900">${wallet.rewards_earned.toFixed(2)}</p>
          </div>
        )}
      </div>
    </PremiumCard>
  );
}
