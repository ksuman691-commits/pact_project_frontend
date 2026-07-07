'use client';

import React, { useState } from 'react';
import { Plus, Download, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import TopNav from '@/components/TopNav';
import WalletSummary from '@/components/WalletSummary';
import DepositModal from '@/components/DepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import TransactionHistory from '@/components/TransactionHistory';
import { useWalletBalance, useWalletHistory, useWalletLocked, useWalletRewards } from '@/hooks/useWallet';
import { useDeposit, useWithdraw } from '@/hooks/useWalletMutations';

export default function WalletPage() {
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);

  // Fetch wallet data
  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance();
  const { data: lockedData, isLoading: lockedLoading } = useWalletLocked();
  const { data: rewardsData, isLoading: rewardsLoading } = useWalletRewards();
  const { data: historyData, isLoading: historyLoading } = useWalletHistory();

  // Mutations
  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();

  const balance = balanceData?.balance || 0;
  const locked = lockedData?.locked || 0;
  const rewards = rewardsData?.rewards || 0;
  const transactions = historyData?.pages?.[0]?.data || [];

  const handleDeposit = async (amount: number, method: string) => {
    try {
      await depositMutation.mutateAsync({ amount, method });
    } catch (error) {
      throw error;
    }
  };

  const handleWithdraw = async (amount: number, method: string) => {
    try {
      await withdrawMutation.mutateAsync(amount);
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-24 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your CirclePact funds</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDepositModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Funds
            </button>
            <button
              onClick={() => setWithdrawModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <Download className="w-5 h-5" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Wallet Summary */}
          <div className="lg:col-span-1">
            <WalletSummary 
              balance={balance}
              locked={locked}
              rewards={rewards}
              loading={balanceLoading || lockedLoading || rewardsLoading}
            />
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Monthly Spending */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Monthly Spending</h3>
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">₹5,450</p>
              <p className="text-xs text-gray-600 mt-2">+2.5% from last month</p>
            </div>

            {/* Stakes Active */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Active Stakes</h3>
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">3 Pacts</p>
              <p className="text-xs text-gray-600 mt-2">₹25,000 total staked</p>
            </div>

            {/* Earning Streak */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Current Streak</h3>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">12 Days</p>
              <p className="text-xs text-gray-600 mt-2">Keep it up!</p>
            </div>

            {/* Pending Rewards */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Pending Rewards</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">₹850</p>
              <p className="text-xs text-gray-600 mt-2">Available tomorrow</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <TransactionHistory 
          transactions={transactions}
          loading={historyLoading}
        />

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8 flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Your funds are secure</h3>
            <p className="text-sm text-blue-800">All transactions are encrypted and verified. Money in pacts is held in escrow until verification.</p>
          </div>
        </div>
      </div>

        {/* Modals */}
        <DepositModal
          isOpen={depositModal}
          onClose={() => setDepositModal(false)}
          onDeposit={handleDeposit}
        />
        <WithdrawModal
          isOpen={withdrawModal}
          onClose={() => setWithdrawModal(false)}
          maxAmount={balance}
          onWithdraw={handleWithdraw}
        />
      </div>
    </>
  );
}
