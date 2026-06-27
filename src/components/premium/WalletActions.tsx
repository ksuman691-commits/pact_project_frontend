import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface WalletActionsProps {
  onDeposit?: (amount: number) => void;
  onWithdraw?: (amount: number) => void;
  isLoading?: boolean;
}

export default function WalletActions({ onDeposit, onWithdraw, isLoading }: WalletActionsProps) {
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleDeposit = () => {
    if (depositAmount && onDeposit) {
      onDeposit(parseFloat(depositAmount));
      setDepositAmount('');
      setShowDepositForm(false);
    }
  };

  const handleWithdraw = () => {
    if (withdrawAmount && onWithdraw) {
      onWithdraw(parseFloat(withdrawAmount));
      setWithdrawAmount('');
      setShowWithdrawForm(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Deposit Button */}
      <div>
        <button
          onClick={() => setShowDepositForm(!showDepositForm)}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Money
        </button>

        {showDepositForm && (
          <PremiumCard className="mt-3">
            <input
              type="number"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg mb-3 focus:outline-none focus:border-emerald-500"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleDeposit}
              disabled={isLoading || !depositAmount}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Confirm Deposit
            </button>
          </PremiumCard>
        )}
      </div>

      {/* Withdraw Button */}
      <div>
        <button
          onClick={() => setShowWithdrawForm(!showWithdrawForm)}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-900 font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Minus className="w-5 h-5" />
          Withdraw
        </button>

        {showWithdrawForm && (
          <PremiumCard className="mt-3">
            <input
              type="number"
              placeholder="Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg mb-3 focus:outline-none focus:border-slate-500"
              min="0"
              step="0.01"
            />
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount}
              className="w-full py-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Confirm Withdrawal
            </button>
          </PremiumCard>
        )}
      </div>
    </div>
  );
}
